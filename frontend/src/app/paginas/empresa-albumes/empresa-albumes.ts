import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { TarjetaAlbum } from '@compartidos/componentes/cartas/tarjeta-album/tarjeta-album';
import { TarjetaKpi } from '@compartidos/componentes/empresa/tarjeta-kpi/tarjeta-kpi';
import { Esqueleto } from '@compartidos/componentes/feedback/esqueleto/esqueleto';
import type { Carta, RarezaCarta } from '@modelos/carta.model';
import { ETIQUETA_RAREZA, rarezaDesdeNombre } from '@modelos/carta.model';
import { PLANES, type Plan } from '@modelos/plan.model';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumesService } from '@servicios/albumes.service';
import { PagosService } from '@servicios/pagos.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import { AlbumRespuesta } from '@modelos/album.model';
import {
  ORDEN_RAREZA,
  RAREZAS_ORDENADAS,
  COLOR_RAREZA,
  SIN_ESTADISTICAS,
  type AlbumEmpresa,
  type EstadoAlbum,
  type EstadisticasCartaEmpresa,
  type ResumenAlbum,
} from '@modelos/empresa.mock';
import { EstadisticasEmpresaService } from '@servicios/estadisticas-empresa-service';
import type { EstadisticasEmpresaRespuesta } from '@paginas/empresa-estadisticas/empresa-estadisticas';

export type CriterioOrdenAlbum = 'nombre-asc' | 'nombre-desc' | 'rareza';

/** Dato que alimenta una tarjeta KPI del detalle del álbum. */
interface KpiAlbum {
  readonly etiqueta: string;
  readonly valor: string;
  readonly contexto: string;
}

interface AlbumConResumen extends AlbumEmpresa {
  readonly resumen: ResumenAlbum;
  /** Nombre real de la marca, tomado del backend (reemplaza a empresa.nombre del mock). */
  readonly marcaNombre: string;
}

@Component({
  selector: 'app-empresa-albumes',
  standalone: true,
  imports: [
    NgIcon,
    RouterLink,
    CartaComponent,
    TarjetaAlbum,
    TarjetaKpi,
    Esqueleto,
  ],
  templateUrl: './empresa-albumes.html',
  styleUrl: './empresa-albumes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumes implements OnInit {
  private readonly albumesService = inject(AlbumesService);
  private readonly estadisticasService = inject(EstadisticasEmpresaService);
  private readonly estado = inject(SuscripcionEstado);
  private readonly borrador = inject(AlbumBorrador);
  private readonly pagosService = inject(PagosService);
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        if (e.urlAfterRedirects === '/empresa/panel/albumes') {
          this.volverAAlbumes();
        }
      });
  }

  /** Datos crudos traídos del backend */
  protected readonly coleccionesBackend = signal<AlbumRespuesta[]>([]);
  protected readonly estadisticasPorMarca = signal<Record<number, EstadisticasEmpresaRespuesta>>({});
  protected readonly estadisticasGenerales = signal<EstadisticasEmpresaRespuesta | null>(null);
  protected readonly cargando = signal(true);

  protected readonly totalUsuarios = computed(
    () => this.estadisticasGenerales()?.totalJugadoresInteractuando ?? 0,
  );
  protected readonly etiquetaRareza = ETIQUETA_RAREZA;

  protected limpiarNombre(nombre: string): string {
    return (nombre || '').replace(/^(?:[áa]lbum\s+|colecci[oó]n\s*)/gi, '').replace(/colecci[oó]n\s*/gi, '').trim();
  }

  /** Plan activo conocido (desde la sesión o el último pago verificado). */
  protected readonly planActual = computed<Plan | null>(() => {
    const elegido = this.estado.planElegido();
    if (elegido) return elegido;
    const idDelPago = this.estado.ultimoPago()?.plan?.id;
    if (idDelPago) return PLANES.find((p) => p.backendId === idDelPago) ?? null;
    return null;
  });

  /** Tope de álbumes del plan activo (1 Básico, 5 Standard, 10 Premium). */
  protected readonly maxAlbumesPlan = computed<number | null>(() => {
    return this.planActual()?.maxAlbumes ?? null;
  });

  /** Habilita crear un nuevo álbum cuando el plan permite más de 1 álbum y aún no llegó al tope. */
  protected readonly puedeCrearNuevoAlbum = computed<boolean>(() => {
    const max = this.maxAlbumesPlan();
    const cantidadActual = this.coleccionesBackend().length;
    if (max !== null) {
      return max > 1 && cantidadActual < max;
    }
    return cantidadActual < 10;
  });

  ngOnInit(): void {
    const ref = this.estado.referenciaGuardada();
    if (!this.estado.planElegido() && ref) {
      this.pagosService.obtenerPago(ref).subscribe({
        next: (pago) => this.estado.ultimoPago.set(pago),
      });
    }
    this.cargarColecciones();
  }

  protected crearNuevoAlbum(): void {
    this.borrador.limpiar();
    this.estado.olvidarAlbumBorrador();
    const plan = this.planActual();
    if (plan) {
      this.estado.planElegido.set(plan);
      void this.router.navigate(['/empresa/album/crear/marca']);
    } else {
      void this.router.navigate(['/empresa']);
    }
  }

  private cargarColecciones(): void {
    this.cargando.set(true);

    this.estadisticasService.obtenerEstadisticas().subscribe({
      next: (est) => this.estadisticasGenerales.set(est),
    });

    this.albumesService.obtenerMisAlbumes().subscribe({
      next: (colecciones) => {
        this.coleccionesBackend.set(colecciones);
        this.cargando.set(false);

        const marcasIds = [...new Set(colecciones.map((c) => c.marcaId))];

        for (const marcaId of marcasIds) {
          this.estadisticasService.obtenerEstadisticas(marcaId).subscribe({
            next: (est) => {
              this.estadisticasPorMarca.update((actual) => ({ ...actual, [marcaId]: est }));
            },
          });
        }
      },
      error: (err) => {
        console.error('Error al obtener álbumes del backend:', err);
        this.cargando.set(false);
      },
    });
  }

  /** Mapea la respuesta del backend a la estructura usada por la vista */
  protected readonly albumes = computed<AlbumConResumen[]>(() => {
    return this.coleccionesBackend().map((c) => {
      const imagenes = c.imagenesAlbum || [];
      const totalCartas = imagenes.length;
      const est = this.estadisticasPorMarca()[c.marcaId];
      const favAlbum =
        est?.favoritosPorAlbum.find((f) => f.coleccionId === c.id)?.cantidadFavoritos ??
        est?.totalFavoritos ??
        0;
      const anio = c.fechaInicio ? new Date(c.fechaInicio).getFullYear() : NaN;
      const temporada = (Number.isNaN(anio) || anio < 2000 ? new Date().getFullYear() : anio).toString();

      const albumEmpresa: AlbumEmpresa = {
        id: String(c.id),
        nombre: c.nombre,
        temporada,
        estado: c.activa ? 'activo' : 'finalizado',
        tono: 'azul',
        descripcion: c.descripcion,
        recompensa: 'Premio por completar el álbum',
        imagenPortada: c.marcaLogoUrl,
        cartasIds: imagenes.map((img) => String(img.id)),
        jugadoresCompletaron: est?.jugadoresCompletaronAlbumes ?? 0,
      };

      const reparto = RAREZAS_ORDENADAS.map((rareza) => {
        const cantidad = imagenes.filter((img) => rarezaDesdeNombre(img.rareza) === rareza).length;
        return {
          rareza,
          etiqueta: ETIQUETA_RAREZA[rareza],
          cantidad,
          porcentaje: totalCartas === 0 ? 0 : Math.round((cantidad / totalCartas) * 100),
          color: COLOR_RAREZA[rareza],
        };
      }).filter((tramo) => tramo.cantidad > 0);

      const resumen: ResumenAlbum = {
        totalCartas,
        reparto,
        favoritos: favAlbum,
        intercambios: est?.cartasIntercambiadas ?? 0,
        porcentajeCompletado: Math.round(est?.porcentajeJugadoresCompletaron ?? 0),
      };

      return {
        ...albumEmpresa,
        marcaNombre: c.marcaNombre,
        resumen,
      };
    });
  });

  /** Nombre de la marca para el encabezado de la grilla de álbumes. */
  protected readonly nombreMarca = computed(() => this.albumes()[0]?.marcaNombre ?? '');

  protected readonly albumActivo = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly rarezaActiva = signal<RarezaCarta | null>(null);
  protected readonly criterioOrden = signal<CriterioOrdenAlbum>('nombre-asc');
  protected readonly cartaSeleccionada = signal<Carta | null>(null);

  protected readonly albumActual = computed<AlbumConResumen | null>(() => {
    const id = this.albumActivo();
    return id === null ? null : (this.albumes().find((album) => album.id === id) ?? null);
  });

  /** Mapea dinámicamente las imágenes guardadas en el backend como cartas de Angular */
  protected readonly cartasDelAlbum = computed<readonly Carta[]>(() => {
    const album = this.albumActual();
    if (album === null) return [];

    const coleccionBackend = this.coleccionesBackend().find((c) => String(c.id) === album.id);
    if (!coleccionBackend) return [];

    return (coleccionBackend.imagenesAlbum || []).map((img, idx) => ({
      id: String(img.id),
      nombre: img.descripcion || `${coleccionBackend.nombre} #${idx + 1}`,
      imagenUrl: img.imagenUrl,
      rareza: rarezaDesdeNombre(img.rareza),
      categoria: 'gastronomia',
      atributoIzquierdo: img.poder ?? 10,
      atributoDerecho: img.costeTicket ?? img.costoCupon ?? 10,
      obtenida: true,
    }));
  });

  private rarezaDeImagen(img: { rarezaNombre?: string | null; rarezaId?: number | null }): RarezaCarta {
    if (img.rarezaNombre) {
      return rarezaDesdeNombre(img.rarezaNombre);
    }
    switch (img.rarezaId) {
      case 2:
        return 'rara';
      case 3:
        return 'epicarta';
      case 4:
        return 'legendaria';
      default:
        return 'comun';
    }
  }

  protected readonly kpisAlbum = computed<readonly KpiAlbum[]>(() => {
    const album = this.albumActual();
    if (album === null) return [];
    const resumen = album.resumen;
    return [
      {
        etiqueta: 'Cartas',
        valor: String(resumen.totalCartas),
        contexto: 'En todo el álbum',
      },
      {
        etiqueta: 'Completaron',
        valor: `${resumen.porcentajeCompletado}%`,
        contexto: `${album.jugadoresCompletaron} jugadores`,
      },
      {
        etiqueta: 'Favoritos',
        valor: resumen.favoritos.toLocaleString('es-AR'),
        contexto: 'Marcas de tus cartas',
      },
      {
        etiqueta: 'Intercambios',
        valor: resumen.intercambios.toLocaleString('es-AR'),
        contexto: 'Entre jugadores',
      },
    ];
  });

  protected readonly rarezasDelAlbum = computed(() => {
    const presentes = new Set(this.cartasDelAlbum().map((carta) => carta.rareza));
    return [...presentes]
      .sort((a, b) => ORDEN_RAREZA[a] - ORDEN_RAREZA[b])
      .map((rareza) => ({ rareza, etiqueta: ETIQUETA_RAREZA[rareza] }));
  });

  protected readonly cartasFiltradas = computed(() => {
    let cartas = this.cartasDelAlbum();

    const termino = this.busqueda().trim().toLowerCase();
    if (termino) {
      cartas = cartas.filter((carta) => carta.nombre.toLowerCase().includes(termino));
    }

    const rareza = this.rarezaActiva();
    if (rareza) {
      cartas = cartas.filter((carta) => carta.rareza === rareza);
    }

    const orden = this.criterioOrden();
    return [...cartas].sort((a, b) => {
      switch (orden) {
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre, 'es');
        case 'rareza':
          return ORDEN_RAREZA[a.rareza] - ORDEN_RAREZA[b.rareza];
        case 'nombre-asc':
        default:
          return a.nombre.localeCompare(b.nombre, 'es');
      }
    });
  });

  protected readonly sinResultados = computed(() => this.cartasFiltradas().length === 0);

  protected readonly estadisticasSeleccionada = computed(() => {
    const carta = this.cartaSeleccionada();
    return carta ? this.obtenerEstadisticasCarta(carta.id) : null;
  });

  protected seleccionarAlbum(id: string): void {
    this.albumActivo.set(id);
    this.rarezaActiva.set(null);
    this.busqueda.set('');
    this.cartaSeleccionada.set(null);
  }

  protected volverAAlbumes(): void {
    this.albumActivo.set(null);
    this.cartaSeleccionada.set(null);
  }

  protected actualizarBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected toggleRareza(rareza: RarezaCarta): void {
    this.rarezaActiva.update((actual) => (actual === rareza ? null : rareza));
  }

  protected cambiarOrden(evento: Event): void {
    this.criterioOrden.set((evento.target as HTMLSelectElement).value as CriterioOrdenAlbum);
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.rarezaActiva.set(null);
    this.criterioOrden.set('nombre-asc');
  }

  protected abrirCarta(carta: Carta): void {
    this.cartaSeleccionada.set(carta);
  }

  protected cerrarCarta(): void {
    this.cartaSeleccionada.set(null);
  }

  protected etiquetaEstado(estado: EstadoAlbum): string {
    return estado === 'activo' ? 'Activo' : 'Finalizado';
  }

  protected obtenerEstadisticasCarta(id: string): EstadisticasCartaEmpresa {
    for (const col of this.coleccionesBackend()) {
      const img = (col.imagenesAlbum || []).find((i) => String(i.id) === id);
      if (img) {
        const usuariosQueLaTienen = img.totalObtenidas ?? 0;
        const totalJugadoresMarca =
          this.estadisticasPorMarca()[col.marcaId]?.totalJugadoresInteractuando ??
          this.totalUsuarios();
        const porcentajeUsuarios =
          totalJugadoresMarca > 0
            ? Math.min(100, Math.round((usuariosQueLaTienen / totalJugadoresMarca) * 100))
            : 0;
        return {
          usuariosQueLaTienen,
          porcentajeUsuarios,
          favoritos: img.totalFavoritos ?? 0,
          intercambios: img.totalIntercambios ?? 0,
          partidas: img.totalPartidas ?? 0,
        };
      }
    }
    return SIN_ESTADISTICAS;
  }

  @HostListener('document:keydown.escape')
  protected alPresionarEscape(): void {
    if (this.cartaSeleccionada() !== null) {
      this.cerrarCarta();
      return;
    }
    this.volverAAlbumes();
  }
}