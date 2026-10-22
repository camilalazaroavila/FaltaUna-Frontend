import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Observable, EMPTY, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { toast } from 'ngx-sonner';

import { ApiService } from '@servicios/api.service';
import { AuthService } from '@servicios/auth.service';
import { BarajaService } from '@servicios/baraja.service';
import { PartidaApiService } from '@servicios/servicios-partida/partida-api.service';
import { PartidaEstadoService } from '@servicios/servicios-partida/partida-estado.service';
import { JUGADORES_MOCK } from '@servicios/servicios-partida/zonas-mock.service';
import type { Carta } from '@modelos/carta.model';
import { CATEGORIA_POR_DEFECTO, categoriaCartaDesdeNombre } from '@modelos/carta.model';
import type {
  CategoriaApi,
  DeltaLugar,
  EstadoRondaPartida,
  JugadorTablero,
  LugarPartida,
  NombreLugar,
  PartidaEstadoApi,
  PorLugar,
  PuntajeLugar,
  ResultadoRonda,
  ResultadoZonaRonda,
  ZonaEstadoApi,
  ZonaTablero,
} from '@modelos/partida.model';

/** Slots por lado en el tablero. */
const SLOTS_POR_LADO = 6;

/** El servidor no manda cuántas cartas tiene el rival en mano: se usa este valor. */
const CARTAS_MANO_RIVAL_ESTIMADAS = 3;

/** Foto de la zona mientras el backend no mande `ImagenUrl`. */
const IMAGEN_ZONA_RESPALDO = 'imagenes/grido.jpg';

/** Avatar por defecto del jugador mientras no exista el de perfil. */
const AVATAR_POR_DEFECTO = 'imagenes/iconos-jugador/batman.png';

/** Clave de `localStorage` con la partida activa, para reconectar al recargar. */
const CLAVE_PARTIDA = 'faltauna_partida_activa';

const zonaVacia = (): ZonaTablero => ({
  id: 0,
  zonaPartidaId: 0,
  nombre: '',
  imagenUrl: IMAGEN_ZONA_RESPALDO,
  efecto: { categoria: CATEGORIA_POR_DEFECTO, bonus: 0 },
  poderPropio: 0,
  poderRival: 0,
  bonusPorCategoria: {},
});

const LUGARES_VACIOS: PorLugar<LugarPartida> = {
  izquierda: { zona: zonaVacia(), rival: [], propio: [] },
  derecha: { zona: zonaVacia(), rival: [], propio: [] },
};

const PUNTAJES_VACIOS: PorLugar<PuntajeLugar> = {
  izquierda: { propio: 0, rival: 0, estadoPropio: 'empate', estadoRival: 'empate' },
  derecha: { propio: 0, rival: 0, estadoPropio: 'empate', estadoRival: 'empate' },
};

const DELTAS_VACIOS: PorLugar<DeltaLugar> = {
  izquierda: { propio: 0, rival: 0 },
  derecha: { propio: 0, rival: 0 },
};

const estadoDe = (propio: number, rival: number): 'ganando' | 'perdiendo' | 'empate' =>
  propio > rival ? 'ganando' : propio < rival ? 'perdiendo' : 'empate';

/**
 * Si la partida ya terminó.
 *
 * El backend manda `Estado = "EN_CURSO"` mientras se juega y `FechaFin` en null
 * hasta el último cierre de ronda.
 */
const partidaTerminada = (estado: PartidaEstadoApi): boolean =>
  estado.estado !== 'EN_CURSO' || estado.fechaFin !== null;

/** Carta bajada a la mesa, con los datos que el servidor usa para el bonus. */
interface CartaEnMesa {
  readonly carta: Carta;
  readonly categoriaId: number;
  readonly poder: number;
  /** Slot del lado propio donde quedó la carta (0..5). */
  readonly slot: number;
}

/** Estado real (contra el bot) que consume el tablero. */
interface EstadoReal {
  readonly partidaId: number;
  readonly estado: string;
  readonly ronda: number;
  readonly segundosIniciales: number;
  readonly momentoReferencia: number;
  readonly manaPropio: number;
  readonly puntosPropio: number;
  readonly puntosRival: number;
  readonly confirmoRonda: boolean;
  readonly mano: readonly Carta[];
  readonly categoriaIdPorCarta: ReadonlyMap<string, number>;
  readonly zonas: PorLugar<ZonaTablero>;
  readonly terminada: boolean;
  readonly ganadorId: number | null;
  readonly miUsuarioId: number;
  readonly rivalUsuarioId: number;
}

/**
 * Fachada de la partida.
 *
 * La galería de componentes y el tablero mock siguen funcionando porque la
 * fachada arranca en **modo mock** y delega en `PartidaEstadoService`. Cuando
 * la pantalla de partida crea una partida contra el bot, la fachada pasa a
 * **modo real** y todos los datos salen del backend.
 *
 * En modo real:
 *
 * - el tiempo de la ronda se descuenta desde el `segundosRestantes` que
 *   calcula el servidor (el límite lo define el backend, no el front);
 * - la carta bajada aparece al instante (eco optimista) y se revierte con un
 *   aviso si el servidor la rechaza;
 * - las cartas ya bajadas siguen visibles en la mesa hasta que cambia de
 *   ronda; el backend no devuelve las cartas jugadas, así que al recargar la
 *   mesa aparece vacía.
 */
@Injectable({ providedIn: 'root' })
export class PartidaServicio {
  private readonly api = inject(ApiService);
  private readonly partidaApi = inject(PartidaApiService);
  private readonly mock = inject(PartidaEstadoService);
  private readonly baraja = inject(BarajaService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly modoRealSignal = signal(false);
  private readonly estadoRealSignal = signal<EstadoReal | null>(null);
  /** Cartas bajadas a la mesa por el jugador, por `zonaPartidaId`. */
  private readonly mesaSignal = signal<Readonly<Record<number, readonly CartaEnMesa[]>>>({});
  /** Poder que el servidor todavía no cuenta en su respuesta. */
  private readonly poderPendienteSignal = signal<Readonly<Record<number, number>>>({});
  private readonly deltasSignal = signal<PorLugar<DeltaLugar>>(DELTAS_VACIOS);
  private readonly anuncioSignal = signal('');
  private readonly segundosSignal = signal(0);
  private readonly cargandoSignal = signal(false);
  private readonly enviandoCartaSignal = signal(false);
  private readonly confirmandoSignal = signal(false);
  private readonly resultadoSignal = signal<ResultadoRonda | null>(null);
  private readonly errorSignal = signal<string | null>(null);
  private readonly rondaCerradaSignal = signal(false);
  private readonly categoriasSignal = signal<ReadonlyMap<number, string>>(new Map());
  private readonly inventarioSignal = signal<ReadonlyMap<string, Carta>>(new Map());

  private temporizador?: ReturnType<typeof setInterval>;

  /** `true` cuando la partida está contra el bot (backend real). */
  readonly modoReal = this.modoRealSignal.asReadonly();
  /** Partida en curso contra el bot. */
  readonly partidaId = computed(() => this.estadoRealSignal()?.partidaId ?? null);
  readonly cargando = this.cargandoSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly resultadoRonda = this.resultadoSignal.asReadonly();
  /** `true` mientras hay una carta viajando al servidor. */
  readonly enviandoCarta = this.enviandoCartaSignal.asReadonly();
  /** `true` mientras se está cerrando la ronda. */
  readonly confirmando = this.confirmandoSignal.asReadonly();
  /** La partida terminó (no se puede seguir jugando). */
  readonly terminada = computed(() => this.estadoRealSignal()?.terminada ?? false);
  /** El jugador ganó la partida (`null` si terminó empatada). */
  readonly gane = computed(() => {
    const estado = this.estadoRealSignal();

    if (!estado?.terminada) {
      return null;
    }

    return estado.ganadorId === null ? null : estado.ganadorId === estado.miUsuarioId;
  });

  readonly lugares = computed<PorLugar<LugarPartida>>(() => {
    if (!this.modoRealSignal()) {
      return this.mock.lugares();
    }

    const estado = this.estadoRealSignal();

    if (!estado) {
      return LUGARES_VACIOS;
    }

    const mesa = this.mesaSignal();

    return {
      izquierda: this.construirLugar(estado, 'izquierda', mesa),
      derecha: this.construirLugar(estado, 'derecha', mesa),
    };
  });

  readonly puntajes = computed<PorLugar<PuntajeLugar>>(() => {
    if (!this.modoRealSignal()) {
      return this.mock.puntajes();
    }

    const estado = this.estadoRealSignal();

    if (!estado) {
      return PUNTAJES_VACIOS;
    }

    const pendiente = this.poderPendienteSignal();

    const calcular = (lugar: NombreLugar): PuntajeLugar => {
      const zona = estado.zonas[lugar];
      const propio = zona.poderPropio + (pendiente[zona.zonaPartidaId] ?? 0);
      const rival = zona.poderRival;

      return {
        propio,
        rival,
        estadoPropio: estadoDe(propio, rival),
        estadoRival: estadoDe(rival, propio),
      };
    };

    return { izquierda: calcular('izquierda'), derecha: calcular('derecha') };
  });

  readonly deltas = computed<PorLugar<DeltaLugar>>(() =>
    this.modoRealSignal() ? this.deltasSignal() : this.mock.deltas(),
  );

  /** El backend todavía no rota las zonas: en partida real el contador queda en 0. */
  readonly rotaciones = computed(() => (this.modoRealSignal() ? 0 : this.mock.rotaciones()));

  readonly anuncio = computed(() => (this.modoRealSignal() ? this.anuncioSignal() : this.mock.anuncio()));

  readonly estadoRonda = computed<EstadoRondaPartida>(() => {
    if (!this.modoRealSignal()) {
      return this.mock.estadoRondaMock();
    }

    if (this.confirmandoSignal()) {
      return 'resolviendo';
    }

    const estado = this.estadoRealSignal();

    if (!estado) {
      return 'jugando';
    }

    if (estado.terminada) {
      return 'resolviendo';
    }

    return estado.confirmoRonda ? 'esperando' : 'jugando';
  });

  readonly resolviendo = computed(() => this.estadoRonda() === 'resolviendo');

  /** Número de ronda (1 a 6). */
  readonly turno = computed(() => (this.modoRealSignal() ? (this.estadoRealSignal()?.ronda ?? 1) : this.mock.turno()));

  readonly segundosRestantes = computed(() =>
    this.modoRealSignal() ? this.segundosSignal() : this.mock.segundosRestantes(),
  );

  /** Cupones de recurso disponibles (el maná del backend). */
  readonly cuponesPropio = computed(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.manaPropio ?? 0) : this.mock.cuponesPropio(),
  );

  readonly barraPropia = computed(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.puntosPropio ?? 0) : this.mock.barraPropia(),
  );

  readonly barraRival = computed(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.puntosRival ?? 0) : this.mock.barraRival(),
  );

  readonly jugadores = computed<{ propio: JugadorTablero; rival: JugadorTablero }>(() => {
    if (!this.modoRealSignal()) {
      return { propio: JUGADORES_MOCK.propio, rival: JUGADORES_MOCK.rival };
    }

    return {
      propio: {
        nombre: this.auth.usuarioActual()?.nombreUsuario ?? 'Vos',
        avatarUrl: AVATAR_POR_DEFECTO,
      },
      rival: { nombre: 'Bot', avatarUrl: null },
    };
  });

  readonly manoPropia = computed<readonly Carta[]>(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.mano ?? []) : this.mock.manoPropia(),
  );

  /** El backend no informa la mano del rival: se mantiene el dato de la maqueta. */
  readonly cartasManoRival = computed(() =>
    this.modoRealSignal() ? CARTAS_MANO_RIVAL_ESTIMADAS : this.mock.cartasManoRival(),
  );

  constructor() {
    this.destroyRef.onDestroy(() => clearInterval(this.temporizador));
    this.temporizador = setInterval(() => this.tickReloj(), 1000);
  }

  /* ───────────────────────────── Acciones ───────────────────────────── */

  /**
   * Crea una partida contra el bot con el mazo del jugador.
   *
   * Encadena: mazo actual → creación → estado completo. Si algo falla, deja
   * el mensaje en `error()` y lo muestra como toast.
   */
  iniciarContraBot(): Observable<boolean> {
    if (this.cargandoSignal()) {
      return of(false);
    }

    this.cargandoSignal.set(true);
    this.errorSignal.set(null);
    this.resultadoSignal.set(null);

    return this.baraja.obtenerMazoActual().pipe(
      switchMap((mazo) => {
        if (!mazo) {
          return throwError(
            () => new Error('No tenés un mazo. Armá tu mazo de 12 cartas antes de jugar.'),
          );
        }

        return forkJoin({
          partida: this.partidaApi.iniciarContraBot(mazo.id),
          categorias: this.cargarCategorias(),
          inventario: this.cargarInventario(),
        });
      }),
      switchMap(({ partida, categorias, inventario }) =>
        this.partidaApi.obtenerEstado(partida.partidaId).pipe(
          map((estado) => ({ estado, categorias, inventario })),
        ),
      ),
      tap(({ estado, categorias, inventario }) => {
        this.modoRealSignal.set(true);
        this.categoriasSignal.set(categorias);
        this.inventarioSignal.set(inventario);
        this.mesaSignal.set({});
        this.poderPendienteSignal.set({});
        this.deltasSignal.set(DELTAS_VACIOS);
        this.aplicarEstado(estado);
        this.guardarPartidaId(estado.partidaId);
        this.anuncioSignal.set('Partida iniciada contra el bot. Bajá tus cartas y finalizá el turno.');
        this.cargandoSignal.set(false);
      }),
      map(() => true),
      catchError((error: unknown) => {
        this.cargandoSignal.set(false);
        const mensaje = this.mensajeDeError(error);
        this.errorSignal.set(mensaje);
        toast.error(mensaje);

        return of(false);
      }),
    );
  }

  /**
   * Reconecta con la partida guardada en `localStorage`.
   *
   * Si la partida ya no existe (o el usuario no participa), la borra y devuelve
   * `false` para que la pantalla ofrezca crear una nueva.
   */
  reconectar(): Observable<boolean> {
    const partidaId = this.leerPartidaId();

    if (!partidaId) {
      return of(false);
    }

    this.cargandoSignal.set(true);
    this.errorSignal.set(null);

    return forkJoin({
      estado: this.partidaApi.obtenerEstado(partidaId),
      categorias: this.cargarCategorias(),
      inventario: this.cargarInventario(),
    }).pipe(
      tap(({ estado, categorias, inventario }) => {
        this.modoRealSignal.set(true);
        this.categoriasSignal.set(categorias);
        this.inventarioSignal.set(inventario);
        this.mesaSignal.set({});
        this.poderPendienteSignal.set({});
        this.deltasSignal.set(DELTAS_VACIOS);
        this.aplicarEstado(estado);
        this.anuncioSignal.set('Partida recuperada.');
        this.cargandoSignal.set(false);
      }),
      map(() => true),
      catchError(() => {
        this.borrarPartidaId();
        this.cargandoSignal.set(false);

        return of(false);
      }),
    );
  }

  /** Olvida la partida guardada (para empezar de cero). */
  abandonarPartida(): void {
    this.borrarPartidaId();
    this.modoRealSignal.set(false);
    this.estadoRealSignal.set(null);
    this.mesaSignal.set({});
    this.poderPendienteSignal.set({});
    this.resultadoSignal.set(null);
  }

  /**
   * Vuelve al modo mock sin borrar la partida guardada.
   *
   * Lo usa la galería de componentes: el tablero de muestra tiene que mostrar
   * la maqueta aunque haya una partida real en curso. La partida guardada sigue
   * en `localStorage`, así que la pantalla de partida la recupera al entrar.
   */
  modoGaleria(): void {
    this.modoRealSignal.set(false);
  }

  /**
   * Baja una carta a la mesa.
   *
   * Es la única vía para jugar una carta (la usan el arrastre y el botón de
   * cada casilla). En modo real devuelve `true` apenas la carta baja (eco
   * optimista) y avisa con un toast si el servidor la rechaza.
   */
  jugarCarta(carta: Carta, lugar: NombreLugar, indice: number): boolean {
    if (!this.modoRealSignal()) {
      return this.mock.jugarCarta(carta, lugar, indice);
    }

    const estado = this.estadoRealSignal();

    if (!estado || estado.terminada || this.confirmandoSignal() || this.enviandoCartaSignal()) {
      return false;
    }

    if (estado.confirmoRonda) {
      return false;
    }

    const posicionMano = estado.mano.findIndex((enMano) => enMano.id === carta.id);

    if (posicionMano === -1) {
      return false;
    }

    const zona = estado.zonas[lugar];
    const mesa = this.mesaSignal()[zona.zonaPartidaId] ?? [];

    if (indice < 0 || indice >= SLOTS_POR_LADO || mesa.some((item) => item.slot === indice)) {
      return false;
    }

    const enMesa: CartaEnMesa = {
      carta,
      categoriaId: estado.categoriaIdPorCarta.get(carta.id) ?? 0,
      poder: carta.atributoIzquierdo,
      slot: indice,
    };

    // Eco optimista: la carta baja y sale de la mano antes de que responda el servidor.
    this.mesaSignal.set({
      ...this.mesaSignal(),
      [zona.zonaPartidaId]: [...mesa, enMesa],
    });
    this.estadoRealSignal.set({
      ...estado,
      mano: estado.mano.filter((_, i) => i !== posicionMano),
    });
    this.poderPendienteSignal.set({
      ...this.poderPendienteSignal(),
      [zona.zonaPartidaId]:
        (this.poderPendienteSignal()[zona.zonaPartidaId] ?? 0) +
        enMesa.poder +
        this.bonusDeZona(zona, enMesa.categoriaId),
    });
    this.anuncioSignal.set(`Jugaste ${carta.nombre} en la zona ${lugar}.`);

    this.enviandoCartaSignal.set(true);
    this.enviarCarta(estado, carta, zona, enMesa, posicionMano);

    return true;
  }

  /**
   * Confirma el fin de turno.
   *
   * En modo mock solo cambia el estado (lo usa la galería). En modo real le
   * pide al servidor que cierre la ronda: contra el bot, el servidor juega su
   * turno y devuelve el resultado de la ronda.
   */
  marcarListo(): void {
    if (!this.modoRealSignal()) {
      this.mock.marcarListo();
      return;
    }

    const estado = this.estadoRealSignal();

    if (!estado || estado.terminada || this.confirmandoSignal()) {
      return;
    }

    this.confirmandoSignal.set(true);
    this.anuncioSignal.set('Cerrando la ronda…');

    this.partidaApi
      .confirmarFinDeRonda(estado.partidaId, estado.ronda)
      .pipe(
        tap((respuesta) => {
          this.aplicarEstado(respuesta.estado);
          this.resultadoSignal.set(this.armarResultado(respuesta.resultado, respuesta.estado));
          this.anuncioSignal.set(
            respuesta.estado.ganadorId === null && !partidaTerminada(respuesta.estado)
              ? 'Ronda cerrada. Siguiente ronda.'
              : 'Partida terminada.',
          );
          this.confirmandoSignal.set(false);
        }),
        catchError((error: unknown) => {
          this.confirmandoSignal.set(false);
          const mensaje = this.mensajeDeError(error);
          this.errorSignal.set(mensaje);
          toast.error(mensaje);

          return EMPTY;
        }),
      )
      .subscribe();
  }

  /** En partida real el cierre de ronda lo decide el servidor: no hace nada local. */
  marcarResolviendo(): void {
    if (!this.modoRealSignal()) {
      this.mock.marcarResolviendo();
    }
  }

  /** En partida real la ronda la reinicia el servidor: no hace nada local. */
  reiniciarRonda(): void {
    if (!this.modoRealSignal()) {
      this.mock.reiniciarRonda();
    }
  }

  /** La rotación de zonas la decide el servidor (hoy no existe): avisa y no cambia nada. */
  rotarZonas(): void {
    if (!this.modoRealSignal()) {
      this.mock.rotarZonas();
      return;
    }

    this.anuncioSignal.set('Las zonas las elige el servidor: todavía no rotan.');
  }

  /** Publica un texto en la región aria-live. */
  anunciar(mensaje: string): void {
    if (this.modoRealSignal()) {
      this.anuncioSignal.set(mensaje);
      return;
    }

    this.mock.anunciar(mensaje);
  }

  /**
   * Rendirse.
   *
   * El backend todavía no expone un endpoint para abandonar la partida, así que
   * se avisa en lugar de fingir que se guardó el punto.
   */
  rendirse(): void {
    toast.info('Rendirse todavía no está disponible: el backend no expone ese endpoint.');
  }

  /* ───────────────────────────── Internos ───────────────────────────── */

  private enviarCarta(
    estado: EstadoReal,
    carta: Carta,
    zona: ZonaTablero,
    enMesa: CartaEnMesa,
    posicionMano: number,
  ): void {
    this.partidaApi
      .jugarCarta(estado.partidaId, Number(carta.id), zona.zonaPartidaId, estado.ronda)
      .pipe(
        tap((respuesta) => {
          this.enviandoCartaSignal.set(false);
          this.aplicarEstado(respuesta.estado);
          this.anuncioSignal.set(`${carta.nombre} está en la mesa.`);
        }),
        catchError((error: unknown) => {
          this.enviandoCartaSignal.set(false);

          // Se revierte el eco optimista: la carta vuelve a la mano.
          const mesaActual = this.mesaSignal()[zona.zonaPartidaId] ?? [];
          this.mesaSignal.set({
            ...this.mesaSignal(),
            [zona.zonaPartidaId]: mesaActual.filter((item) => item !== enMesa),
          });

          const pendiente = { ...this.poderPendienteSignal() };
          const resta =
            enMesa.poder + this.bonusDeZona(zona, enMesa.categoriaId);
          pendiente[zona.zonaPartidaId] = Math.max(0, (pendiente[zona.zonaPartidaId] ?? 0) - resta);
          this.poderPendienteSignal.set(pendiente);

          const actual = this.estadoRealSignal();

          if (actual) {
            this.estadoRealSignal.set({
              ...actual,
              mano: [...actual.mano.slice(0, posicionMano), carta, ...actual.mano.slice(posicionMano)],
            });
          }

          const mensaje = this.mensajeDeError(error);
          this.errorSignal.set(mensaje);
          toast.error(mensaje);

          return EMPTY;
        }),
      )
      .subscribe();
  }

  /** Aplica un estado del servidor y recalcula lo que depende de él. */
  private aplicarEstado(estado: PartidaEstadoApi): void {
    const anterior = this.estadoRealSignal();
    const cambioDeRonda = !anterior || anterior.ronda !== estado.rondaActual.numero;

    if (cambioDeRonda) {
      // La ronda nueva arranca con la mesa vacía.
      this.mesaSignal.set({});
      this.rondaCerradaSignal.set(false);
    }

    const zonas = this.construirZonas(estado);
    const puntos = this.construirPuntajes(zonas);

    if (anterior) {
      this.deltasSignal.set({
        izquierda: {
          propio: puntos.izquierda.propio - anterior.zonas.izquierda.poderPropio,
          rival: puntos.izquierda.rival - anterior.zonas.izquierda.poderRival,
        },
        derecha: {
          propio: puntos.derecha.propio - anterior.zonas.derecha.poderPropio,
          rival: puntos.derecha.rival - anterior.zonas.derecha.poderRival,
        },
      });
    }

    // El servidor ya cuenta las cartas jugadas: no queda poder pendiente.
    this.poderPendienteSignal.set({});

    this.estadoRealSignal.set({
      partidaId: estado.partidaId,
      estado: estado.estado,
      ronda: estado.rondaActual.numero,
      segundosIniciales: estado.rondaActual.segundosRestantes,
      momentoReferencia: Date.now(),
      manaPropio: estado.miJugador.manaActual,
      puntosPropio: estado.miJugador.puntosAcumulados,
      puntosRival: estado.rival.puntosAcumulados,
      confirmoRonda: estado.miJugador.confirmoRonda,
      mano: this.construirMano(estado),
      categoriaIdPorCarta: this.construirCategoriaIdPorCarta(estado),
      zonas,
      terminada: partidaTerminada(estado),
      ganadorId: estado.ganadorId,
      miUsuarioId: estado.miJugador.usuarioId,
      rivalUsuarioId: estado.rival.usuarioId,
    });

    this.segundosSignal.set(estado.rondaActual.segundosRestantes);
  }

  private construirZonas(estado: PartidaEstadoApi): PorLugar<ZonaTablero> {
    const ordenadas = [...estado.zonas].sort((a, b) =>
      a.posicionInicial.localeCompare(b.posicionInicial),
    );
    const izquierda = ordenadas[0];
    const derecha = ordenadas[1] ?? ordenadas[0];

    return {
      izquierda: izquierda ? this.construirZona(izquierda) : zonaVacia(),
      derecha: derecha ? this.construirZona(derecha) : zonaVacia(),
    };
  }

  private construirZona(zona: ZonaEstadoApi): ZonaTablero {
    return {
      id: zona.zonaId,
      zonaPartidaId: zona.zonaPartidaId,
      nombre: zona.nombre,
      imagenUrl: IMAGEN_ZONA_RESPALDO,
      efecto: this.efectoDeZona(zona),
      poderPropio: zona.poderPropio,
      poderRival: zona.poderRival,
      bonusPorCategoria: zona.bonusPorCategoria,
    };
  }

  /**
   * Puntaje de cada zona.
   *
   * Ojo: `ZonaEstadoResponse.PoderPropio` / `PoderRival` ya vienen desde la
   * perspectiva de quien consulta el estado (`PartidaEstadoServicio` los calcula
   * con el jugador y su rival), así que acá no hay que intercambiarlos. El
   * intercambio por `UsuarioId` sólo aplica al resultado de ronda, que viene
   * como `PoderJugador1` / `PoderJugador2`.
   */
  private construirPuntajes(zonas: PorLugar<ZonaTablero>): PorLugar<PuntajeLugar> {
    const calcular = (zona: ZonaTablero): PuntajeLugar => {
      const propio = zona.poderPropio;
      const rival = zona.poderRival;

      return {
        propio,
        rival,
        estadoPropio: estadoDe(propio, rival),
        estadoRival: estadoDe(rival, propio),
      };
    };

    return { izquierda: calcular(zonas.izquierda), derecha: calcular(zonas.derecha) };
  }

  private construirLugar(
    estado: EstadoReal,
    lugar: NombreLugar,
    mesa: Readonly<Record<number, readonly CartaEnMesa[]>>,
  ): LugarPartida {
    const zona = estado.zonas[lugar];
    const jugadas = mesa[zona.zonaPartidaId] ?? [];
    const propio: (Carta | null)[] = Array.from({ length: SLOTS_POR_LADO }, () => null);

    jugadas.forEach((item) => {
      if (item.slot >= 0 && item.slot < SLOTS_POR_LADO) {
        propio[item.slot] = item.carta;
      }
    });

    return {
      zona,
      propio,
      rival: Array.from({ length: SLOTS_POR_LADO }, () => null),
    };
  }

  /** El efecto mostrado es la categoría que más bonifica la zona. */
  private efectoDeZona(zona: ZonaEstadoApi): ZonaTablero['efecto'] {
    const entradas = Object.entries(zona.bonusPorCategoria).map(([id, bonus]) => ({
      categoriaId: Number(id),
      bonus,
    }));

    if (entradas.length === 0) {
      return { categoria: CATEGORIA_POR_DEFECTO, bonus: 0 };
    }

    const mejor = entradas.reduce((a, b) => (b.bonus > a.bonus ? b : a));

    return {
      categoria: this.categoriaDe(mejor.categoriaId),
      bonus: mejor.bonus,
    };
  }

  private bonusDeZona(zona: ZonaTablero, categoriaId: number): number {
    if (!categoriaId) {
      return 0;
    }

    const bonus = zona.bonusPorCategoria[categoriaId];

    return typeof bonus === 'number' ? bonus : 0;
  }

  private categoriaDe(categoriaId: number): ZonaTablero['efecto']['categoria'] {
    return categoriaCartaDesdeNombre(this.categoriasSignal().get(categoriaId));
  }

  private construirMano(estado: PartidaEstadoApi): readonly Carta[] {
    const inventario = this.inventarioSignal();

    return estado.miJugador.mano.map((carta) => {
      const id = String(carta.cartaId);
      const delInventario = inventario.get(id);

      return {
        id,
        nombre: carta.nombre || delInventario?.nombre || 'Carta',
        imagenUrl: delInventario?.imagenUrl ?? '',
        rareza: delInventario?.rareza ?? 'comun',
        categoria: this.categoriaDe(carta.categoriaId),
        atributoIzquierdo: carta.poder,
        atributoDerecho: carta.costoMana,
        obtenida: true,
      };
    });
  }

  private construirCategoriaIdPorCarta(estado: PartidaEstadoApi): ReadonlyMap<string, number> {
    const mapa = new Map<string, number>();

    estado.miJugador.mano.forEach((carta) => {
      mapa.set(String(carta.cartaId), carta.categoriaId);
    });

    return mapa;
  }

  /** Traduce el resultado de la ronda a la vista del jugador. */
  private armarResultado(
    resultado: { numeroRonda: number; zonas: readonly { zonaPartidaId: number; poderJugador1: number; poderJugador2: number }[]; partidaTerminada: boolean; ganadorId: number | null } | null,
    estado: PartidaEstadoApi,
  ): ResultadoRonda | null {
    if (!resultado) {
      return null;
    }

    const propioEsJugador1 = estado.miJugador.usuarioId < estado.rival.usuarioId;
    const nombres = new Map(estado.zonas.map((zona) => [zona.zonaPartidaId, zona.nombre]));

    const zonas: ResultadoZonaRonda[] = resultado.zonas.map((zona) => ({
      zonaPartidaId: zona.zonaPartidaId,
      nombreZona: nombres.get(zona.zonaPartidaId) ?? 'Zona',
      propio: propioEsJugador1 ? zona.poderJugador1 : zona.poderJugador2,
      rival: propioEsJugador1 ? zona.poderJugador2 : zona.poderJugador1,
    }));

    const ganadorId = resultado.ganadorId;

    return {
      numero: resultado.numeroRonda,
      zonas,
      puntosPropio: estado.miJugador.puntosAcumulados,
      puntosRival: estado.rival.puntosAcumulados,
      terminada: resultado.partidaTerminada,
      ganadorId,
      gane: resultado.partidaTerminada
        ? ganadorId === null
          ? null
          : ganadorId === estado.miJugador.usuarioId
        : null,
    };
  }

  /** Cuenta regresiva de la ronda y cierre automático cuando vence el tiempo. */
  private tickReloj(): void {
    if (!this.modoRealSignal()) {
      return;
    }

    const estado = this.estadoRealSignal();

    if (!estado || estado.terminada) {
      return;
    }

    const transcurridos = Math.floor((Date.now() - estado.momentoReferencia) / 1000);
    const restantes = Math.max(0, estado.segundosIniciales - transcurridos);

    this.segundosSignal.set(restantes);

    if (restantes === 0 && !this.rondaCerradaSignal() && !this.confirmandoSignal()) {
      this.rondaCerradaSignal.set(true);
      this.cerrarRondaVencida(estado.partidaId);
    }
  }

  /** Le pide al servidor que cierre la ronda vencida. */
  private cerrarRondaVencida(partidaId: number): void {
    this.confirmandoSignal.set(true);

    this.partidaApi
      .cerrarRondaVencida(partidaId)
      .pipe(
        tap((respuesta) => {
          this.confirmandoSignal.set(false);
          this.aplicarEstado(respuesta.estado);
          this.resultadoSignal.set(this.armarResultado(respuesta.resultado, respuesta.estado));
          this.anuncioSignal.set('Se venció el tiempo de la ronda.');
        }),
        catchError((error: unknown) => {
          this.confirmandoSignal.set(false);
          const mensaje = this.mensajeDeError(error);
          this.errorSignal.set(mensaje);
          toast.error(mensaje);

          return EMPTY;
        }),
      )
      .subscribe();
  }

  /**
   * Categorías del catálogo.
   *
   * `GET /api/Categorias` devuelve las entidades crudas, así que puede fallar
   * por referencias circulares: si pasa, se usan; si no, el nombre sale del
   * inventario del jugador.
   */
  private cargarCategorias(): Observable<ReadonlyMap<number, string>> {
    return this.api.get<CategoriaApi[]>('Categorias').pipe(
      map((categorias) => {
        const mapa = new Map<number, string>();

        categorias.forEach((categoria) => mapa.set(categoria.id, categoria.nombre));

        return mapa as ReadonlyMap<number, string>;
      }),
      catchError(() => of(new Map<number, string>() as ReadonlyMap<number, string>)),
    );
  }

  /** Inventario del jugador: trae la imagen y la rareza de cada carta. */
  private cargarInventario(): Observable<ReadonlyMap<string, Carta>> {
    return this.baraja.obtenerCartasDisponibles().pipe(
      map((cartas) => {
        const mapa = new Map<string, Carta>();

        cartas.forEach((carta) => mapa.set(carta.id, carta));

        return mapa as ReadonlyMap<string, Carta>;
      }),
      catchError(() => of(new Map<string, Carta>() as ReadonlyMap<string, Carta>)),
    );
  }

  private guardarPartidaId(partidaId: number): void {
    try {
      localStorage.setItem(CLAVE_PARTIDA, String(partidaId));
    } catch {
      // Sin localStorage no hay reconexión, pero la partida sigue.
    }
  }

  private leerPartidaId(): number | null {
    try {
      const guardado = localStorage.getItem(CLAVE_PARTIDA);

      return guardado ? Number(guardado) : null;
    } catch {
      return null;
    }
  }

  private borrarPartidaId(): void {
    try {
      localStorage.removeItem(CLAVE_PARTIDA);
    } catch {
      // Sin localStorage no hay nada que borrar.
    }
  }

  /** Arma el mensaje a partir de lo que devuelve el backend. */
  private mensajeDeError(error: unknown): string {
    const cuerpo = (
      error as { error?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } }
    )?.error;

    if (cuerpo?.mensaje) {
      return cuerpo.mensaje;
    }

    if (cuerpo?.message) {
      return cuerpo.message;
    }

    if (cuerpo?.errors) {
      const textos = Object.values(cuerpo.errors).flat();

      if (textos.length > 0) {
        return textos.slice(0, 3).join(' ');
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'No se pudo completar la jugada. Intentá de nuevo.';
  }
}
