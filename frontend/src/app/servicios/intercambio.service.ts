import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { ApiService, ParametrosConsulta } from './api.service';
import { UsuariosService } from './usuario.service';
import { AuthService } from './auth.service';
import { AlbumesJugadorService } from './albumes-jugador.service';
import type { Carta } from '@modelos/carta.model';
import { categoriaCartaDesdeNombre } from '@modelos/carta.model';
import { esCartaSinMarca } from '@modelos/catalogo-cartas-imagenes';
import type { CartaInventarioApi } from '@modelos/mazo.model';
import { resolverImagenCarta, mapearRareza } from './baraja.service';
import type {
  CartaIntercambioApi,
  CoincidenciaColeccionistaApi,
  Coleccionista,
  ColeccionistaInventarioApi,
  CrearIntercambioSolicitud,
  FiltrosColeccionistas,
  IntercambioActivoApi,
  IntercambioEstadoRespuesta,
  ResponderIntercambioSolicitud,
} from '@modelos/intercambio.model';

const MENSAJES_DEFAULT: readonly string[] = [
  'Buscando cartas para completar mi colección',
  'Tengo varias repetidas para cambiar',
  '¡Hola! Dispuesto a negociar',
  'Intercambio cartas de cualquier categoría',
  'Buscando mis cartas favoritas',
];

function resolverMensajeEstado(id: number): string {
  return MENSAJES_DEFAULT[Math.abs(id) % MENSAJES_DEFAULT.length];
}

/**
 * Determina si un usuario corresponde al bot del sistema para excluirlo de listas de intercambio.
 */
function esUsuarioBot(usuario: { email?: string; nombreUsuario?: string }): boolean {
  if (usuario.email && usuario.email.toLowerCase() === 'bot@faltauna.com') {
    return true;
  }
  const nombre = (usuario.nombreUsuario ?? '').trim().toLowerCase();
  return (
    nombre === 'bot' ||
    nombre.startsWith('bot ') ||
    nombre.startsWith('bot_') ||
    nombre.includes('bot entrenador')
  );
}

export interface CategoriaOpcion {
  readonly id: number;
  readonly nombre: string;
}

export interface ColeccionOpcion {
  readonly id: number;
  readonly nombre: string;
  readonly categoriaId: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class IntercambioService {
  private readonly api = inject(ApiService);
  private readonly usuariosService = inject(UsuariosService);
  private readonly authService = inject(AuthService);
  private readonly albumesService = inject(AlbumesJugadorService);

  // Señales reactivas de notificaciones en cascada (!)
  readonly tieneNovedadDashboardSignal = signal<boolean>(false);
  readonly tieneNovedadMenuSignal = signal<boolean>(false);
  readonly intercambiosConNovedadIds = signal<ReadonlySet<string>>(new Set());

  readonly coleccionistaSeleccionado = signal<Coleccionista | null>(null);
  readonly cartaOfrecida = signal<Carta | null>(null);

  /**
   * Obtiene la lista de categorías registradas en el backend para el filtro.
   */
  obtenerCategorias(): Observable<CategoriaOpcion[]> {
    return this.api.get<Array<{ id: number; nombre: string }>>('Categorias').pipe(
      map((cats) => (cats ?? []).map((c) => ({ id: c.id, nombre: c.nombre }))),
      catchError(() => of([])),
    );
  }

  /**
   * Obtiene la lista de colecciones/álbumes disponibles para el filtro.
   */
  obtenerColecciones(): Observable<ColeccionOpcion[]> {
    return this.albumesService.listarAlbumes().pipe(
      map((albumes) =>
        (albumes ?? []).map((a) => ({
          id: a.id,
          nombre: a.marcaNombre,
          categoriaId: a.categoriaId,
        })),
      ),
      catchError(() => of([])),
    );
  }

  /**
   * Obtiene coleccionistas combinando la priorización por cartas favoritas del usuario
   * (`GET api/Usuarios/coincidencias`) con el catálogo general (`GET api/Usuarios`).
   * Aplica filtros opcionales de categoría y colección.
   */
  obtenerColeccionistas(filtros?: FiltrosColeccionistas): Observable<Coleccionista[]> {
    const usuarioActualId = this.authService.usuarioActual()?.id;
    const params: ParametrosConsulta = {};

    if (filtros?.categoriaId) {
      params['categoriaId'] = filtros.categoriaId;
    }
    if (filtros?.coleccionId) {
      params['coleccionId'] = filtros.coleccionId;
    }

    const consultaCoincidencias$: Observable<CoincidenciaColeccionistaApi[]> = this.authService.estaAutenticado()
      ? this.api.get<CoincidenciaColeccionistaApi[]>('Usuarios/coincidencias', { params }).pipe(
          catchError(() => of([])),
        )
      : of([]);

    const consultaGeneral$: Observable<ColeccionistaInventarioApi[]> = this.api
      .get<ColeccionistaInventarioApi[]>('Usuarios', {
        params: { ...params, incluirInventario: true },
      })
      .pipe(
        catchError(() =>
          this.usuariosService.obtenerUsuarios().pipe(
            map((usuarios) =>
              (usuarios ?? []).map((u) => ({
                id: u.id,
                nombreUsuario: u.nombreUsuario,
                fechaRegistro: u.fechaRegistro,
                avatarUrl: u.avatarUrl ?? null,
                cartasDistintas: 0,
                totalCartas: 0,
                cartas: [],
              })),
            ),
            catchError(() => of([])),
          ),
        ),
      );

    return forkJoin({
      coincidencias: consultaCoincidencias$,
      general: consultaGeneral$,
    }).pipe(
      map(({ coincidencias, general }) => {
        // 1. Coleccionistas prioritarios: tienen cartas favoritas del usuario actual
        const prioritarios: Coleccionista[] = (coincidencias ?? [])
          .filter((c) => c.id !== usuarioActualId && c.coincidenciasFavoritas > 0 && !esUsuarioBot(c))
          .map((c) => ({
            id: c.id,
            nombreUsuario: c.nombreUsuario,
            avatarUrl: c.avatarUrl ?? null,
            coincidenciasFavoritas: c.coincidenciasFavoritas,
            coincidenciasIntercambiables: c.coincidenciasIntercambiables,
            totalFavoritas: c.totalFavoritas,
            porcentajeCoincidencia: c.porcentajeCoincidencia,
            cartasFavoritasQueTiene: c.cartasFavoritasQueTiene,
            mensajeEstado: resolverMensajeEstado(c.id),
          }));

        const idsPrioritarios = new Set(prioritarios.map((p) => p.id));

        // 2. Resto de los coleccionistas sin coincidencia de favoritas
        const restantes: Coleccionista[] = (general ?? [])
          .filter(
            (u) =>
              u.id !== usuarioActualId &&
              !idsPrioritarios.has(u.id) &&
              !esUsuarioBot(u) &&
              ((u as any).rol === undefined || (u as any).rol === 'Usuario'),
          )
          .map((u) => ({
            id: u.id,
            nombreUsuario: u.nombreUsuario,
            avatarUrl: u.avatarUrl ?? null,
            totalCartas: u.totalCartas,
            cartasDistintas: u.cartasDistintas,
            fechaRegistro: u.fechaRegistro,
            mensajeEstado: u.totalCartas && u.totalCartas > 0
              ? `${u.totalCartas} cartas en su colección`
              : resolverMensajeEstado(u.id),
          }));

        return [...prioritarios, ...restantes];
      }),
    );
  }

  /**
   * Obtiene un coleccionista específico por su ID.
   */
  obtenerColeccionistaPorId(id: number): Observable<Coleccionista | null> {
    const seleccionado = this.coleccionistaSeleccionado();
    if (seleccionado && seleccionado.id === id) {
      return of(seleccionado);
    }
    return this.usuariosService.obtenerUsuarios().pipe(
      map((usuarios) => {
        const u = usuarios.find((x) => x.id === id && !esUsuarioBot(x));
        if (!u) return null;
        return {
          id: u.id,
          nombreUsuario: u.nombreUsuario,
          email: u.email,
          avatarUrl: u.avatarUrl,
          mensajeEstado: resolverMensajeEstado(u.id),
        } as Coleccionista;
      }),
      catchError(() => of(null)),
    );
  }

  /**
   * Obtiene del inventario del usuario actual solo aquellas cartas de las que
   * posee 2 o más copias (cartas repetidas para intercambiar).
   */
  obtenerCartasRepetidas(): Observable<Carta[]> {
    return this.api.get<CartaInventarioApi[]>('Mazos/cartas-disponibles').pipe(
      map((cartas) =>
        (cartas ?? [])
          .filter((c) => c.cantidad >= 2 && !esCartaSinMarca(c))
          .map(this.mapearCartaInventario),
      ),
    );
  }

  /**
   * Obtiene las cartas favoritas del coleccionista con el que se va a intercambiar,
   * permitiendo que el usuario vea hasta 5 favoritas destacadas y las expanda en detalle.
   */
  obtenerCartasFavoritasDeColeccionista(coleccionistaId: number): Observable<Carta[]> {
    return this.api.get<CartaInventarioApi[]>(`CartaFavorita/usuario/${coleccionistaId}`).pipe(
      map((cartas) => {
        if (cartas && cartas.length > 0) {
          return cartas.map(this.mapearCartaInventario);
        }
        return [];
      }),
      catchError(() =>
        this.api.get<any[]>(`Intercambios/sugerencias/${coleccionistaId}`).pipe(
          map((sugerencias) => {
            const favs = (sugerencias ?? []).filter((s) => s.esFavoritaDelOtro);
            return favs.map((s) => ({
              id: String(s.cartaId ?? s.id),
              nombre: s.nombre,
              imagenUrl: resolverImagenCarta(s.imagenUrl, s.nombre),
              rareza: mapearRareza(s.rareza, s.rarezaOrden ?? 1),
              categoria: categoriaCartaDesdeNombre(s.categoria ?? ''),
              atributoDerecho: s.poder ?? 0,
              atributoIzquierdo: s.costoCupon ?? 0,
              obtenida: true,
              descripcion: s.descripcion,
            }));
          }),
          catchError(() => of([])),
        ),
      ),
    );
  }

  seleccionarColeccionista(coleccionista: Coleccionista | null): void {
    this.coleccionistaSeleccionado.set(coleccionista);
  }

  seleccionarCarta(carta: Carta | null): void {
    this.cartaOfrecida.set(carta);
  }

  limpiarSeleccion(): void {
    this.cartaOfrecida.set(null);
  }

  /**
   * Crea una nueva oferta de intercambio enviada a otro usuario (`POST api/Intercambios`).
   */
  crearIntercambio(solicitud: CrearIntercambioSolicitud): Observable<IntercambioEstadoRespuesta> {
    return this.api.post<IntercambioEstadoRespuesta>('Intercambios', solicitud);
  }

  /**
   * Responde una oferta de intercambio recibida (`POST api/Intercambios/{id}/responder`).
   */
  responderIntercambio(intercambioId: number, cartaId: number): Observable<IntercambioEstadoRespuesta> {
    const solicitud: ResponderIntercambioSolicitud = { cartaId };
    return this.api.post<IntercambioEstadoRespuesta>(`Intercambios/${intercambioId}/responder`, solicitud);
  }

  /**
   * Confirma un intercambio en revisión (`POST api/Intercambios/{id}/confirmar`).
   */
  confirmarIntercambio(intercambioId: number): Observable<IntercambioEstadoRespuesta> {
    return this.api.post<IntercambioEstadoRespuesta>(`Intercambios/${intercambioId}/confirmar`, {});
  }

  /**
   * Rechaza un intercambio (`POST api/Intercambios/{id}/rechazar`).
   */
  rechazarIntercambio(intercambioId: number): Observable<IntercambioEstadoRespuesta> {
    return this.api.post<IntercambioEstadoRespuesta>(`Intercambios/${intercambioId}/rechazar`, {});
  }

  /**
   * Marca un intercambio aceptado como visto/archivado para no volver a mostrarlo en la lista de recibidas.
   */
  archivarIntercambioCompletado(id: number): void {
    const usuarioId = this.authService.usuarioActual()?.id ?? 0;
    const clave = `intercambio_archivado_${usuarioId}_${id}`;
    try {
      localStorage.setItem(clave, 'true');
    } catch {
      // Ignora errores si localStorage no está disponible
    }
  }

  /**
   * Verifica si el usuario ya vio y dio por cerrado un intercambio aceptado.
   */
  esIntercambioArchivado(id: number): boolean {
    const usuarioId = this.authService.usuarioActual()?.id ?? 0;
    const clave = `intercambio_archivado_${usuarioId}_${id}`;
    try {
      return localStorage.getItem(clave) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la lista de intercambios activos del usuario logueado (`GET api/Intercambios`).
   * Normaliza las propiedades para asegurar compatibilidad total con el DTO del backend.
   */
  obtenerIntercambiosActivos(): Observable<IntercambioActivoApi[]> {
    return this.api.get<any[]>('Intercambios').pipe(
      map((lista) =>
        (lista ?? [])
          .map((item) => this.mapearIntercambioActivo(item))
          .filter((item) => item.estado !== 'ACEPTADO' || !this.esIntercambioArchivado(item.id)),
      ),
      catchError(() => of([])),
    );
  }

  private mapearIntercambioActivo(raw: any): IntercambioActivoApi {
    const ofertanteId = Number(raw.ofertanteId ?? raw.usuarioOfertanteId ?? 0);
    const ofertante = String(raw.ofertante ?? raw.usuarioOfertanteNombre ?? '');
    const receptorId = Number(raw.receptorId ?? raw.usuarioReceptorId ?? 0);
    const receptor = String(raw.receptor ?? raw.usuarioReceptorNombre ?? '');

    const cartas: CartaIntercambioApi[] = (raw.cartas ?? []).map((c: any) => ({
      usuarioId: Number(c.usuarioId),
      cartaId: Number(c.cartaId),
      nombre: c.nombre ?? c.cartaNombre ?? '',
      cartaNombre: c.nombre ?? c.cartaNombre ?? '',
      rarezaId: Number(c.rarezaId ?? c.cartaRarezaId ?? 1),
      cartaRarezaId: Number(c.rarezaId ?? c.cartaRarezaId ?? 1),
      rareza: c.rareza ?? c.cartaRareza ?? 'Común',
      cartaRareza: c.rareza ?? c.cartaRareza ?? 'Común',
      imagenUrl: c.imagenUrl ?? c.cartaImagenUrl ?? null,
      cartaImagenUrl: c.imagenUrl ?? c.cartaImagenUrl ?? null,
    }));

    return {
      id: Number(raw.id),
      estado: String(raw.estado ?? 'PENDIENTE'),
      fechaCreacion: raw.fechaCreacion,
      fechaVencimiento: raw.fechaVencimiento,
      ofertanteId,
      usuarioOfertanteId: ofertanteId,
      ofertante,
      usuarioOfertanteNombre: ofertante,
      receptorId,
      usuarioReceptorId: receptorId,
      receptor,
      usuarioReceptorNombre: receptor,
      cartas,
    };
  }

  /**
   * Obtiene un intercambio activo específico por su ID.
   */
  obtenerIntercambioPorId(id: number): Observable<IntercambioActivoApi | null> {
    return this.obtenerIntercambiosActivos().pipe(
      map((intercambios) => intercambios.find((i) => i.id === id) ?? null),
    );
  }

  /**
   * Calcula los días restantes para el vencimiento de una oferta (máximo 3 días).
   */
  calcularDiasRestantes(fechaVencimiento: string): number {
    if (!fechaVencimiento) return 3;
    const fin = new Date(fechaVencimiento).getTime();
    const ahora = Date.now();
    const diferenciaMs = fin - ahora;
    if (diferenciaMs <= 0) return 0;
    const dias = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.min(3, dias));
  }

  private mapearCartaInventario(c: CartaInventarioApi): Carta {
    return {
      id: String(c.cartaId),
      nombre: c.nombre,
      imagenUrl: resolverImagenCarta(c.imagenUrl, c.nombre),
      rareza: mapearRareza(c.rareza, c.rarezaOrden),
      categoria: categoriaCartaDesdeNombre(c.categoria),
      atributoDerecho: c.poder,
      atributoIzquierdo: c.costoCupon,
      obtenida: true,
      descripcion: c.descripcion,
    };
  }

  // =========================================================================
  // SISTEMA DE ALERTAS Y NOTIFICACIONES EN CASCADA (!)
  // =========================================================================

  /**
   * Determina si un intercambio específico requiere la atención/acción del usuario.
   */
  tieneActualizacionPendiente(intercambio: IntercambioActivoApi, usuarioId?: number): boolean {
    const miId = usuarioId ?? this.authService.usuarioActual()?.id ?? 0;
    const ofertanteId = intercambio.usuarioOfertanteId ?? intercambio.ofertanteId;
    const receptorId = intercambio.usuarioReceptorId ?? intercambio.receptorId;
    const estado = intercambio.estado;

    if (miId === receptorId) {
      return estado === 'PENDIENTE' || estado === 'ACEPTADO';
    } else if (miId === ofertanteId) {
      return estado === 'EN_REVISION';
    }
    return false;
  }

  /**
   * Verifica si la tarjeta de un intercambio específico aún no fue vista por el usuario.
   */
  esIntercambioNovedad(intercambioId: number, estado: string): boolean {
    const usuarioId = this.authService.usuarioActual()?.id ?? 0;
    const clave = `notif_intercambio_${usuarioId}_${intercambioId}_${estado}`;
    try {
      return localStorage.getItem(clave) !== 'visto';
    } catch {
      return false;
    }
  }

  /**
   * Marca la tarjeta de un intercambio específico como vista en el estado actual.
   */
  marcarIntercambioVisto(intercambioId: number, estado: string): void {
    const usuarioId = this.authService.usuarioActual()?.id ?? 0;
    const clave = `notif_intercambio_${usuarioId}_${intercambioId}_${estado}`;
    try {
      localStorage.setItem(clave, 'visto');
    } catch {}
    this.verificarNovedades().subscribe();
  }

  /**
   * Genera una firma única representando el conjunto de novedades no vistas de intercambios.
   */
  private calcularFirmaNovedades(intercambios: IntercambioActivoApi[], usuarioId: number): string {
    return intercambios
      .filter((i) => this.tieneActualizacionPendiente(i, usuarioId) && this.esIntercambioNovedad(i.id, i.estado))
      .map((i) => `${i.id}:${i.estado}`)
      .sort()
      .join('|');
  }

  /**
   * Comprueba si existen novedades y actualiza las señales reactivas.
   */
  verificarNovedades(): Observable<{ dashboard: boolean; menu: boolean }> {
    const usuarioId = this.authService.usuarioActual()?.id ?? 0;
    if (!usuarioId) {
      this.tieneNovedadDashboardSignal.set(false);
      this.tieneNovedadMenuSignal.set(false);
      this.intercambiosConNovedadIds.set(new Set());
      return of({ dashboard: false, menu: false });
    }

    return this.obtenerIntercambiosActivos().pipe(
      map((intercambios) => {
        const novedadesSet = new Set<string>();
        intercambios.forEach((i) => {
          if (this.tieneActualizacionPendiente(i, usuarioId) && this.esIntercambioNovedad(i.id, i.estado)) {
            novedadesSet.add(`${i.id}_${i.estado}`);
          }
        });
        this.intercambiosConNovedadIds.set(novedadesSet);

        const firma = this.calcularFirmaNovedades(intercambios, usuarioId);
        let dashboard = false;
        let menu = false;

        if (firma.length > 0) {
          try {
            const vistoDash = localStorage.getItem(`notif_dashboard_visto_${usuarioId}`);
            dashboard = vistoDash !== firma;

            const vistoMenu = localStorage.getItem(`notif_menu_visto_${usuarioId}`);
            menu = vistoMenu !== firma;
          } catch {
            dashboard = true;
            menu = true;
          }
        }

        this.tieneNovedadDashboardSignal.set(dashboard);
        this.tieneNovedadMenuSignal.set(menu);

        return { dashboard, menu };
      }),
      catchError(() => {
        this.tieneNovedadDashboardSignal.set(false);
        this.tieneNovedadMenuSignal.set(false);
        return of({ dashboard: false, menu: false });
      }),
    );
  }

  /**
   * Marca que el usuario vio el icono de intercambio en el Dashboard.
   */
  marcarDashboardIntercambioVisto(): void {
    const usuarioId = this.authService.usuarioActual()?.id ?? 0;
    this.obtenerIntercambiosActivos().subscribe({
      next: (intercambios) => {
        const firma = this.calcularFirmaNovedades(intercambios, usuarioId);
        try {
          localStorage.setItem(`notif_dashboard_visto_${usuarioId}`, firma);
        } catch {}
        this.tieneNovedadDashboardSignal.set(false);
      },
    });
  }

  /**
   * Marca que el usuario vio la tarjeta de "Intercambios activos" en el menú.
   */
  marcarMenuIntercambioVisto(): void {
    const usuarioId = this.authService.usuarioActual()?.id ?? 0;
    this.obtenerIntercambiosActivos().subscribe({
      next: (intercambios) => {
        const firma = this.calcularFirmaNovedades(intercambios, usuarioId);
        try {
          localStorage.setItem(`notif_menu_visto_${usuarioId}`, firma);
        } catch {}
        this.tieneNovedadMenuSignal.set(false);
      },
    });
  }
}
