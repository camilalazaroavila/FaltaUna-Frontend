import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, finalize, map, of, switchMap, tap } from 'rxjs';
import { toast } from 'ngx-sonner';

import { PartidaApiService } from '@servicios/servicios-partida/partida-api.service';
import { PartidaEstadoService } from '@servicios/servicios-partida/partida-estado.service';
import { JUGADORES_MOCK } from '@servicios/servicios-partida/zonas-mock.service';
import type { Carta, RarezaCarta } from '@modelos/carta.model';
import { CATEGORIA_POR_DEFECTO, categoriaCartaDesdeNombre } from '@modelos/carta.model';
import type {
  CartaApi,
  CartaEnMesaApi,
  DeltaLugar,
  EstadoPartidaApi,
  EstadoRondaPartida,
  GanadorPartida,
  JugadorTablero,
  LadoPartida,
  LugarPartida,
  NombreLugar,
  PorLugar,
  PuntajeLugar,
  ResultadoRonda,
  ResultadoRondaApi,
  ResultadoZonaRonda,
  ZonaPartidaApi,
  ZonaTablero,
} from '@modelos/partida.model';

/** Slots por lado en el tablero. */
const SLOTS_POR_LADO = 6;

/** Foto de la zona mientras el backend no mande `imagenUrl`. */
const IMAGEN_ZONA_RESPALDO = 'imagenes/grido.jpg';

/** Clave de `localStorage` con la partida activa, para reconectar al recargar. */
const CLAVE_PARTIDA = 'faltauna_partida_activa';

/** Cada cuánto se pide el estado completo al servidor. */
const MS_POLLING = 5000;
/** Cada cuánto se avisa al servidor que el jugador sigue conectado. */
const MS_LATIDO = 20000;

const normalizar = (valor: string | null | undefined): string =>
  typeof valor === 'string'
    ? valor
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
    : '';

const zonaVacia = (): ZonaTablero => ({
  id: 0,
  zonaPartidaId: 0,
  nombre: '',
  imagenUrl: IMAGEN_ZONA_RESPALDO,
  efecto: { categoria: CATEGORIA_POR_DEFECTO, bonus: 0 },
  poderPropio: 0,
  poderRival: 0,
  bonusPorCategoria: {},
  ganador: 'empate',
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

/** Carta bajada a la mesa, ya adaptada al modelo del tablero. */
interface CartaMesaVista {
  readonly carta: Carta;
  readonly zonaPartidaId: number;
  readonly lado: LadoPartida;
  /** Slot del lugar (0..5). */
  readonly slot: number;
}

/** Estado real (contra el bot o PvP) que consume el tablero. */
interface EstadoReal {
  readonly partidaId: number;
  readonly estado: string;
  readonly fase: string;
  readonly ronda: number;
  readonly rondasTotales: number;
  readonly puntosMaximos: number;
  readonly segundosIniciales: number;
  readonly momentoReferencia: number;
  readonly cuponActual: number;
  readonly cuponMaximo: number;
  readonly puntosPropio: number;
  readonly puntosRival: number;
  readonly listo: boolean;
  readonly nombrePropio: string;
  readonly avatarPropio: string | null;
  readonly nombreRival: string;
  readonly avatarRival: string | null;
  readonly cartasManoRival: number;
  readonly mano: readonly Carta[];
  readonly cartasMesa: readonly CartaMesaVista[];
  readonly zonas: PorLugar<ZonaTablero>;
  readonly terminada: boolean;
  /** Ronda del último resultado aplicado, para no repetir los deltas. */
  readonly resultadoRonda: number | null;
  /**
   * Mapa `zonaPartidaId → NombreLugar` calculado en `aplicarEstado`.
   * Incluye todas las zonas conocidas (activas + rotadas) para que las
   * cartas ya jugadas permanezcan en su lugar físico tras una rotación.
   */
  readonly mapaZonaLugar: ReadonlyMap<number, NombreLugar>;
}

const estadoPuntaje = (ganador: GanadorPartida): 'ganando' | 'perdiendo' | 'empate' =>
  ganador === 'propio' ? 'ganando' : ganador === 'rival' ? 'perdiendo' : 'empate';

const invertirPuntaje = (
  estado: 'ganando' | 'perdiendo' | 'empate',
): 'ganando' | 'perdiendo' | 'empate' =>
  estado === 'ganando' ? 'perdiendo' : estado === 'perdiendo' ? 'ganando' : 'empate';

/**
 * Fachada de la partida.
 *
 * La galería de componentes y el tablero de muestra siguen funcionando porque
 * la fachada arranca en **modo mock** y delega en `PartidaEstadoService`.
 *
 * Cuando se crea o recupera una partida, pasa a **modo real**: el estado del
 * servidor es la única fuente de verdad. El servicio no calcula puntajes,
 * cupones, ganadores de zona ni progreso a 100; solo adapta el contrato a los
 * modelos del tablero y sincroniza (heartbeat + polling).
 */
@Injectable({ providedIn: 'root' })
export class PartidaServicio {
  private readonly partidaApi = inject(PartidaApiService);
  private readonly mock = inject(PartidaEstadoService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly modoRealSignal = signal(false);
  private readonly estadoRealSignal = signal<EstadoReal | null>(null);
  private readonly deltasSignal = signal<PorLugar<DeltaLugar>>(DELTAS_VACIOS);
  private readonly anuncioSignal = signal('');
  private readonly segundosSignal = signal(0);
  private readonly cargandoSignal = signal(false);
  private readonly enviandoCartaSignal = signal(false);
  private readonly confirmandoSignal = signal(false);
  private readonly resultadoSignal = signal<ResultadoRonda | null>(null);
  private readonly errorSignal = signal<string | null>(null);
  private readonly rondaCerradaSignal = signal(false);

  private temporizador?: ReturnType<typeof setInterval>;
  private latido?: ReturnType<typeof setInterval>;
  private consulta?: ReturnType<typeof setInterval>;
  private sincronizando = false;
  /** Invalida respuestas que llegan después de abandonar o cambiar de partida. */
  private epoca = 0;
  private readonly clavesEnCurso = new Map<string, { firma: string; clave: string }>();

  private readonly escuchaVisibilidad = (): void => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      this.sincronizarEstado(false);
    }
  };

  /** `true` cuando hay una partida real (backend). */
  readonly modoReal = this.modoRealSignal.asReadonly();
  readonly partidaId = computed(() => this.estadoRealSignal()?.partidaId ?? null);
  readonly cargando = this.cargandoSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly resultadoRonda = this.resultadoSignal.asReadonly();
  /** `true` mientras hay una acción viajando al servidor. */
  readonly enviandoCarta = this.enviandoCartaSignal.asReadonly();
  /** `true` mientras se está cerrando la ronda o abandonando. */
  readonly confirmando = this.confirmandoSignal.asReadonly();
  /** La partida terminó (no se puede seguir jugando). */
  readonly terminada = computed(() => this.estadoRealSignal()?.terminada ?? false);
  /** El jugador ganó la partida (`null` si sigue en curso o terminó empatada). */
  readonly gane = computed(() => this.resultadoSignal()?.gane ?? null);

  readonly lugares = computed<PorLugar<LugarPartida>>(() => {
    if (!this.modoRealSignal()) {
      return this.mock.lugares();
    }

    const estado = this.estadoRealSignal();

    if (!estado) {
      return LUGARES_VACIOS;
    }

    // El mapa acumula todas las zonas conocidas (activas + rotadas) para
    // que las cartas jugadas antes de una rotación sigan visibles.
    const mapaZona: ReadonlyMap<number, NombreLugar> = estado.mapaZonaLugar;

    return {
      izquierda: this.construirLugar(estado, 'izquierda', mapaZona),
      derecha: this.construirLugar(estado, 'derecha', mapaZona),
    };
  });

  /** Puntajes y ganador de zona tal como los resolvió el servidor. */
  readonly puntajes = computed<PorLugar<PuntajeLugar>>(() => {
    if (!this.modoRealSignal()) {
      return this.mock.puntajes();
    }

    const estado = this.estadoRealSignal();

    if (!estado) {
      return PUNTAJES_VACIOS;
    }

    const calcular = (lugar: NombreLugar): PuntajeLugar => {
      const zona = estado.zonas[lugar];
      const estadoPropio = estadoPuntaje(zona.ganador ?? 'empate');

      return {
        propio: zona.poderPropio,
        rival: zona.poderRival,
        estadoPropio,
        estadoRival: invertirPuntaje(estadoPropio),
      };
    };

    return { izquierda: calcular('izquierda'), derecha: calcular('derecha') };
  });

  readonly deltas = computed<PorLugar<DeltaLugar>>(() =>
    this.modoRealSignal() ? this.deltasSignal() : this.mock.deltas(),
  );

  /** La rotación de zonas la decide el servidor y hoy no se informa. */
  readonly rotaciones = computed(() => (this.modoRealSignal() ? 0 : this.mock.rotaciones()));

  readonly anuncio = computed(() =>
    this.modoRealSignal() ? this.anuncioSignal() : this.mock.anuncio(),
  );

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

    if (estado.terminada || estado.fase === 'revelando' || estado.fase === 'resuelto') {
      return 'resolviendo';
    }

    if (estado.listo || estado.fase === 'esperando') {
      return 'esperando';
    }

    return 'jugando';
  });

  readonly resolviendo = computed(() => this.estadoRonda() === 'resolviendo');

  /** Número de ronda actual. */
  readonly turno = computed(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.ronda ?? 1) : this.mock.turno(),
  );

  /** Cantidad total de rondas definida por el servidor. */
  readonly rondasTotales = computed(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.rondasTotales ?? 6) : 6,
  );

  /** Puntaje máximo de la partida (hoy 100). */
  readonly puntosMaximos = computed(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.puntosMaximos ?? 100) : 100,
  );

  readonly segundosRestantes = computed(() =>
    this.modoRealSignal() ? this.segundosSignal() : this.mock.segundosRestantes(),
  );

  /** Cupones de recurso disponibles. */
  readonly cuponesPropio = computed(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.cuponActual ?? 0) : this.mock.cuponesPropio(),
  );

  /** Máximo de cupones de la ronda, definido por el servidor. */
  readonly cuponMaximo = computed(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.cuponMaximo ?? 1) : this.mock.turno(),
  );

  readonly barraPropia = computed(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.puntosPropio ?? 0) : this.mock.barraPropia(),
  );

  readonly barraRival = computed(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.puntosRival ?? 0) : this.mock.barraRival(),
  );

  /**
   * Puntos que sumó cada lado en la ronda resuelta, para el indicador flotante
   * de las barras generales. Sale del resultado del servidor y no depende de
   * que las zonas sigan siendo las mismas después de rotar.
   */
  readonly deltaPuntosPropio = computed<number | null>(() => this.deltaPuntos('propio'));
  readonly deltaPuntosRival = computed<number | null>(() => this.deltaPuntos('rival'));

  readonly jugadores = computed<{ propio: JugadorTablero; rival: JugadorTablero }>(() => {
    if (!this.modoRealSignal()) {
      return { propio: JUGADORES_MOCK.propio, rival: JUGADORES_MOCK.rival };
    }

    const estado = this.estadoRealSignal();

    if (!estado) {
      return { propio: JUGADORES_MOCK.propio, rival: JUGADORES_MOCK.rival };
    }

    return {
      propio: { nombre: estado.nombrePropio, avatarUrl: estado.avatarPropio },
      rival: { nombre: estado.nombreRival, avatarUrl: estado.avatarRival, esBot: true },
    };
  });

  readonly manoPropia = computed<readonly Carta[]>(() =>
    this.modoRealSignal() ? (this.estadoRealSignal()?.mano ?? []) : this.mock.manoPropia(),
  );

  /** Cantidad de cartas en la mano del rival, informada por el servidor. */
  readonly cartasManoRival = computed(() =>
    this.modoRealSignal()
      ? (this.estadoRealSignal()?.cartasManoRival ?? 0)
      : this.mock.cartasManoRival(),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.detenerSincronizacion());
  }

  /* ───────────────────────────── Acciones ───────────────────────────── */

  /**
   * Crea una partida contra el bot con el mazo indicado.
   *
   * El `POST` devuelve el estado completo, así que no hace falta una segunda
   * lectura. Si el servidor responde con la partida ya terminada, no arranca
   * la sincronización.
   */
  iniciarContraBot(mazoId: number): Observable<boolean> {
    if (this.cargandoSignal() || !Number.isInteger(mazoId) || mazoId <= 0) {
      return of(false);
    }

    const epoca = ++this.epoca;

    this.sincronizando = false;
    this.cargandoSignal.set(true);
    this.errorSignal.set(null);
    this.resultadoSignal.set(null);
    this.deltasSignal.set(DELTAS_VACIOS);
    this.anuncioSignal.set('');
    this.rondaCerradaSignal.set(false);

    return this.partidaApi.iniciarContraBot(mazoId).pipe(
      tap((estado) => {
        if (!this.esEpocaActual(epoca)) {
          return;
        }

        this.modoRealSignal.set(true);
        this.aplicarEstado(estado);
        this.guardarPartidaId(estado.partidaId);
        this.anuncioSignal.set(
          this.esFinal(estado)
            ? 'La partida terminó.'
            : 'Partida iniciada contra el bot. Bajá tus cartas y finalizá el turno.',
        );
        this.cargandoSignal.set(false);

        if (!this.esFinal(estado)) {
          this.iniciarSincronizacion();
        }
      }),
      map(() => true),
      catchError((error: unknown) => {
        if (!this.esEpocaActual(epoca)) {
          return of(false);
        }

        this.cargandoSignal.set(false);
        this.registrarError(error, false);

        return of(false);
      }),
    );
  }

  /**
   * Reconecta con la partida guardada en `localStorage`.
   *
   * Si el servidor dice que la partida no existe, borra la referencia. Un
   * error de red no la borra: se puede reintentar al volver a entrar.
   */
  reconectar(): Observable<boolean> {
    const guardada = this.leerPartidaId();
    const partidaId = guardada ?? this.estadoRealSignal()?.partidaId ?? null;

    if (!partidaId) {
      this.limpiarEstado();
      return of(false);
    }

    const epoca = ++this.epoca;

    this.sincronizando = false;
    this.cargandoSignal.set(true);
    this.errorSignal.set(null);

    return this.partidaApi.obtenerEstado(partidaId).pipe(
      tap((estado) => {
        if (!this.esEpocaActual(epoca)) {
          return;
        }

        this.modoRealSignal.set(true);
        this.aplicarEstado(estado);
        this.guardarPartidaId(estado.partidaId);
        this.anuncioSignal.set(
          this.esFinal(estado) ? 'La partida terminó.' : 'Partida recuperada.',
        );
        this.cargandoSignal.set(false);

        if (!this.esFinal(estado)) {
          this.iniciarSincronizacion();
        }
      }),
      map(() => true),
      catchError((error: unknown) => {
        if (!this.esEpocaActual(epoca)) {
          return of(false);
        }

        this.cargandoSignal.set(false);

        if (this.statusDe(error) === 404 || this.statusDe(error) === 403) {
          this.limpiarEstado();
        } else {
          this.registrarError(error, false);
        }

        return of(false);
      }),
    );
  }

  /** Abandona la partida (si sigue en curso) y limpia el estado local. */
  abandonarPartida(): void {
    const estado = this.estadoRealSignal();

    if (this.modoRealSignal() && estado && !estado.terminada) {
      const clave = this.clavePara('abandonar', String(estado.partidaId));

      this.partidaApi
        .abandonar(estado.partidaId, clave)
        .pipe(
          tap(() => this.olvidarClave('abandonar')),
          catchError(() => EMPTY),
        )
        .subscribe();
    }

    this.limpiarEstado();
  }

  /**
   * Vuelve al modo mock sin borrar la partida guardada.
   *
   * Lo usa la galería de componentes: el tablero de muestra tiene que mostrar
   * la maqueta aunque haya una partida real en curso.
   */
  modoGaleria(): void {
    this.epoca += 1;
    this.modoRealSignal.set(false);
  }

  /**
   * Baja una carta a la mesa.
   *
   * Es la única vía para jugar una carta (la usan el arrastre y el botón de
   * cada casilla). No hay eco optimista: la mesa se actualiza recién con el
   * estado que devuelve el servidor.
   */
  jugarCarta(carta: Carta, lugar: NombreLugar, indice: number): boolean {
    if (!this.modoRealSignal()) {
      return this.mock.jugarCarta(carta, lugar, indice);
    }

    const estado = this.estadoRealSignal();

    if (
      !estado ||
      estado.terminada ||
      estado.listo ||
      estado.fase !== 'jugando' ||
      this.confirmandoSignal() ||
      this.enviandoCartaSignal()
    ) {
      return false;
    }

    const enMano = estado.mano.find(
      (item) => item.id === carta.id || item.cartaPartidaId === carta.cartaPartidaId,
    );

    if (!enMano || enMano.jugable === false || enMano.cartaId === undefined) {
      return false;
    }

    const zona = estado.zonas[lugar];

    if (
      indice < 0 ||
      indice >= SLOTS_POR_LADO ||
      zona.zonaPartidaId <= 0 ||
      estado.cartasMesa.some(
        (item) =>
          item.lado === 'propio' &&
          item.zonaPartidaId === zona.zonaPartidaId &&
          item.slot === indice,
      )
    ) {
      return false;
    }

    const cartaPartidaId = enMano.cartaPartidaId;
    const firma = [estado.partidaId, estado.ronda, cartaPartidaId, zona.zonaPartidaId, indice].join(
      ':',
    );
    const clave = this.clavePara('jugar', firma);
    const epoca = this.epoca;

    this.enviandoCartaSignal.set(true);
    this.errorSignal.set(null);
    this.deltasSignal.set(DELTAS_VACIOS);

    this.partidaApi
      .jugarCarta(
        estado.partidaId,
        {
          cartaId: enMano.cartaId,
          cartaPartidaId,
          zonaPartidaId: zona.zonaPartidaId,
          indice,
          numeroRonda: estado.ronda,
        },
        clave,
      )
      .pipe(
        tap((nuevoEstado) => {
          if (!this.esEpocaActual(epoca) || !this.esPartidaActual(estado.partidaId)) {
            return;
          }

          this.olvidarClave('jugar');
          this.enviandoCartaSignal.set(false);
          this.aplicarEstado(nuevoEstado);
          this.anuncioSignal.set(`${carta.nombre} está en la mesa.`);
        }),
        catchError((error: unknown) => {
          if (!this.esEpocaActual(epoca)) {
            return EMPTY;
          }

          this.enviandoCartaSignal.set(false);
          this.registrarError(error, true);

          return EMPTY;
        }),
      )
      .subscribe();

    return true;
  }

  /**
   * Confirma el fin de turno.
   *
   * En modo mock solo cambia el estado (lo usa la galería). En modo real le
   * pide al servidor que cierre la ronda y después relee el estado completo.
   */
  marcarListo(): void {
    if (!this.modoRealSignal()) {
      this.mock.marcarListo();
      return;
    }

    this.cerrarRonda();
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

  /** La rotación de zonas la decide el servidor. */
  rotarZonas(): void {
    if (!this.modoRealSignal()) {
      this.mock.rotarZonas();
      return;
    }

    this.anuncioSignal.set('Las zonas las elige el servidor.');
  }

  /** Publica un texto en la región aria-live. */
  anunciar(mensaje: string): void {
    if (this.modoRealSignal()) {
      this.anuncioSignal.set(mensaje);
      return;
    }

    this.mock.anunciar(mensaje);
  }

  /** Rendirse: el servidor marca la derrota y devuelve el resultado. */
  rendirse(): void {
    if (!this.modoRealSignal()) {
      toast.info('Rendirse está disponible solo en una partida en curso.');
      return;
    }

    const estado = this.estadoRealSignal();

    if (!estado || estado.terminada || this.confirmandoSignal()) {
      return;
    }

    const clave = this.clavePara('rendirse', String(estado.partidaId));
    const epoca = this.epoca;

    this.confirmandoSignal.set(true);
    this.errorSignal.set(null);
    this.anuncioSignal.set('Cerrando la partida…');

    this.partidaApi
      .rendirse(estado.partidaId, clave)
      .pipe(
        switchMap(() => this.partidaApi.obtenerEstado(estado.partidaId)),
        tap((nuevoEstado) => {
          if (!this.esEpocaActual(epoca) || !this.esPartidaActual(estado.partidaId)) {
            return;
          }

          this.olvidarClave('rendirse');
          this.confirmandoSignal.set(false);
          this.aplicarEstado(nuevoEstado);
          this.anuncioSignal.set('Te rendiste: la partida cuenta como derrota.');
        }),
        catchError((error: unknown) => {
          if (!this.esEpocaActual(epoca)) {
            return EMPTY;
          }

          this.confirmandoSignal.set(false);
          this.registrarError(error, true);

          return EMPTY;
        }),
      )
      .subscribe();
  }

  /** Arranca timers de reloj, heartbeat y polling. Es idempotente. */
  iniciarSincronizacion(): void {
    if (!this.modoRealSignal() || !this.estadoRealSignal() || this.terminada()) {
      return;
    }

    this.detenerSincronizacion();

    this.temporizador = setInterval(() => this.tickReloj(), 1000);
    this.latido = setInterval(() => this.enviarLatido(), MS_LATIDO);
    this.consulta = setInterval(() => this.consultarEstado(), MS_POLLING);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.escuchaVisibilidad);
    }
  }

  /** Limpia timers y listeners. */
  detenerSincronizacion(): void {
    clearInterval(this.temporizador);
    clearInterval(this.latido);
    clearInterval(this.consulta);
    this.temporizador = undefined;
    this.latido = undefined;
    this.consulta = undefined;

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.escuchaVisibilidad);
    }
  }

  /* ───────────────────────────── Internos ───────────────────────────── */

  /** Cierra la ronda actual (botón o vencimiento del tiempo). */
  private cerrarRonda(): void {
    const estado = this.estadoRealSignal();

    if (
      !estado ||
      estado.terminada ||
      estado.listo ||
      this.confirmandoSignal() ||
      this.enviandoCartaSignal()
    ) {
      return;
    }

    const clave = this.clavePara('finalizar', `${estado.partidaId}:${estado.ronda}`);
    const epoca = this.epoca;
    const partidaId = estado.partidaId;
    const rondaActual = estado.ronda;

    this.confirmandoSignal.set(true);
    this.errorSignal.set(null);
    this.anuncioSignal.set('Cerrando la ronda…');

    this.partidaApi
      .finalizar(partidaId, rondaActual, clave)
      .pipe(
        switchMap((respuesta) => {
          if (!this.esEpocaActual(epoca) || !this.esPartidaActual(partidaId)) {
            return EMPTY;
          }

          // Si la respuesta ya es el estado completo (202), aplicarlo directamente
          const esEstadoCompleto = (valor: unknown): valor is EstadoPartidaApi => {
            if (!valor || typeof valor !== 'object') {
              return false;
            }

            const candidato = valor as Partial<EstadoPartidaApi>;
            return typeof candidato.partidaId === 'number' && Array.isArray(candidato.zonas);
          };

          if (esEstadoCompleto(respuesta)) {
            return of({ tipo: 'estado' as const, estado: respuesta });
          }

          // 200 con ResultadoRondaApi: obtener estado completo para sincronizar
          return this.partidaApi.obtenerEstado(partidaId).pipe(
            map((estadoCompleto) => ({ tipo: 'estado' as const, estado: estadoCompleto })),
          );
        }),
        tap((resultado) => {
          if (!this.esEpocaActual(epoca) || !this.esPartidaActual(partidaId)) {
            return;
          }

          this.olvidarClave('finalizar');
          this.confirmandoSignal.set(false);

          // Blindado: no aplicar estado con ronda menor
          if (resultado.estado.ronda < rondaActual) {
            console.warn('[PartidaServicio] Se descartó respuesta con ronda menor al cerrar ronda', {
              recibido: resultado.estado.ronda,
              esperadoMinimo: rondaActual,
            });
            return;
          }

          this.aplicarEstado(resultado.estado);
          this.rondaCerradaSignal.set(resultado.estado.ronda === rondaActual);

          this.anuncioSignal.set(
            this.esFinal(resultado.estado)
              ? 'Partida terminada.'
              : `Ronda ${resultado.estado.ronda} en curso.`,
          );
        }),
        catchError((error: unknown) => {
          if (!this.esEpocaActual(epoca)) {
            return EMPTY;
          }

          this.confirmandoSignal.set(false);
          this.registrarError(error, true);

          return EMPTY;
        }),
      )
      .subscribe();
  }

  /** Aplica el estado del servidor y adapta todo lo que consume el tablero. */
  private aplicarEstado(estado: EstadoPartidaApi): void {
    if (!this.modoRealSignal()) {
      return;
    }

    const anterior = this.estadoRealSignal();

    // Blindado contra respuestas antiguas
    if (anterior && estado.ronda < anterior.ronda) {
      console.warn('[PartidaServicio] Se descartó respuesta con ronda menor', {
        recibido: estado.ronda,
        actual: anterior.ronda,
      });
      return;
    }

    const cambioDeRonda = !anterior || anterior.ronda !== estado.ronda;
    const terminada = this.esFinal(estado);
    const zonas = this.construirZonas(estado);
    const resultado = this.armarResultado(estado.ultimoResultado, estado);

    if (cambioDeRonda) {
      this.rondaCerradaSignal.set(false);
    }

    this.resultadoSignal.set(resultado);
    this.aplicarDeltas(resultado, zonas, anterior);

    // Construir el mapa de zonas ANTES de fijar el estado para que
    // `construirLugar` pueda ubicar cartas de zonas que ya rotaron.
    const mapaZonaLugar = this.mapaZonaALugar(estado);

    // Acumular el mapa anterior (zonas de rondas previas) para no perder
    // la ubicación de cartas jugadas antes de la última rotación.
    const mapaAnterior = this.estadoRealSignal()?.mapaZonaLugar;
    if (mapaAnterior) {
      mapaAnterior.forEach((lugar, id) => {
        if (!mapaZonaLugar.has(id)) {
          mapaZonaLugar.set(id, lugar);
        }
      });
    }

    // Agregar mapeo desde cartas en mesa para zonas no presentes
    estado.cartasEnMesa.forEach((item) => {
      if (item.zonaPartidaId != null && !mapaZonaLugar.has(item.zonaPartidaId)) {
        // Intentar inferir lugar por zonas activas
        const zonaIzq = zonas.izquierda;
        const zonaDer = zonas.derecha;
        if (zonaIzq.zonaPartidaId === item.zonaPartidaId) {
          mapaZonaLugar.set(item.zonaPartidaId, 'izquierda');
        } else if (zonaDer.zonaPartidaId === item.zonaPartidaId) {
          mapaZonaLugar.set(item.zonaPartidaId, 'derecha');
        }
      }
    });

    // Procesar cartas reveladas del resultado
    let cartasEnMesaProcesadas = estado.cartasEnMesa;
    if (estado.ultimoResultado?.cartasReveladas && estado.ultimoResultado.cartasReveladas.length > 0) {
      const reveladasPorId = new Map<number, typeof estado.ultimoResultado.cartasReveladas[0]>();
      estado.ultimoResultado.cartasReveladas.forEach((c) => {
        if (c.cartaPartidaId) {
          reveladasPorId.set(c.cartaPartidaId, c);
        }
      });
      cartasEnMesaProcesadas = estado.cartasEnMesa.map((carta) => {
        const revelada = reveladasPorId.get(carta.cartaPartidaId);
        if (revelada && carta.oculta) {
          return revelada;
        }
        return carta;
      });
    }

    if (
      anterior &&
      cartasEnMesaProcesadas.length === 0 &&
      anterior.cartasMesa.length > 0 &&
      !terminada
    ) {
      console.warn('[PartidaServicio] cartasEnMesa vacío recibido desde el servidor', {
        partidaId: estado.partidaId,
        ronda: estado.ronda,
        endpoint: 'GET/POST Partidas',
        campos: ['cartasEnMesa'],
        cartasAnteriores: anterior.cartasMesa.length,
      });
    }

    this.estadoRealSignal.set({
      partidaId: estado.partidaId,
      estado: estado.estado,
      fase: normalizar(estado.fase),
      ronda: estado.ronda,
      rondasTotales: estado.rondasTotales,
      puntosMaximos: estado.puntosMaximos,
      segundosIniciales: estado.segundosRestantes,
      momentoReferencia: Date.now(),
      mapaZonaLugar,
      cuponActual: estado.jugadorPropio.cuponActual,
      cuponMaximo: estado.jugadorPropio.cuponMaximo,
      puntosPropio: estado.jugadorPropio.puntosTotales,
      puntosRival: estado.rival.puntosTotales,
      listo: estado.jugadorPropio.listo,
      nombrePropio: estado.jugadorPropio.nombre,
      avatarPropio: estado.jugadorPropio.avatarUrl,
      nombreRival: estado.rival.nombre,
      avatarRival: estado.rival.avatarUrl,
      cartasManoRival: estado.rival.cartasEnMano,
      mano: estado.manoPropia.map((item) =>
        this.cartaDesdeApi(item.carta, {
          cartaPartidaId: item.cartaPartidaId,
          jugable: item.jugable,
        }),
      ),
      cartasMesa: cartasEnMesaProcesadas.map((item) => this.cartaMesaDesdeApi(item)),
      zonas,
      terminada,
      resultadoRonda: estado.ultimoResultado?.ronda ?? null,
    });

    this.segundosSignal.set(estado.segundosRestantes);
    this.errorSignal.set(null);

    if (terminada) {
      this.detenerSincronizacion();
    } else if (cambioDeRonda && anterior) {
      this.anuncioSignal.set(`Ronda ${estado.ronda} en curso.`);
    }
  }

  private deltaPuntos(lado: LadoPartida): number | null {
    if (!this.modoRealSignal()) {
      return null;
    }

    const resultado = this.resultadoSignal();

    if (!resultado) {
      return null;
    }

    return resultado.zonas.reduce(
      (total, zona) =>
        total + (lado === 'propio' ? zona.puntosGanadosPropio : zona.puntosGanadosRival),
      0,
    );
  }

  private aplicarDeltas(
    resultado: ResultadoRonda | null,
    zonas: PorLugar<ZonaTablero>,
    anterior: EstadoReal | null,
  ): void {
    if (!resultado || anterior?.resultadoRonda === resultado.numero) {
      if (!resultado) {
        this.deltasSignal.set(DELTAS_VACIOS);
      }

      return;
    }

    const deltas: PorLugar<DeltaLugar> = {
      izquierda: { propio: 0, rival: 0 },
      derecha: { propio: 0, rival: 0 },
    };

    for (const zona of resultado.zonas) {
      const lugar = (['izquierda', 'derecha'] as const).find(
        (nombre) => zonas[nombre].zonaPartidaId === zona.zonaPartidaId,
      );

      if (lugar) {
        deltas[lugar] = {
          propio: zona.puntosGanadosPropio,
          rival: zona.puntosGanadosRival,
        };
      }
    }

    this.deltasSignal.set(deltas);
  }

  /**
   * Construye un mapa de `zonaPartidaId → NombreLugar` usando el campo `lugar`
   * que manda el servidor en cada `ZonaPartidaApi`. Se incluye el estado actual
   * y, si existe, las `zonasNuevas` del último resultado (que ya rotaron).
   *
   * El objeto devuelto permite ubicar cualquier carta en su lugar físico
   * independientemente de las rotaciones de zona.
   */
  private mapaZonaALugar(estado: EstadoPartidaApi): Map<number, NombreLugar> {
    const mapa = new Map<number, NombreLugar>();

    const clasificar = (zona: ZonaPartidaApi, indice: number): void => {
      const lugarNorm = normalizar(zona.lugar);
      const nombre: NombreLugar =
        lugarNorm.includes('der') || (!lugarNorm.includes('izq') && indice === 1)
          ? 'derecha'
          : 'izquierda';

      mapa.set(zona.zonaPartidaId, nombre);
    };

    estado.zonas.forEach((zona, i) => clasificar(zona, i));
    estado.ultimoResultado?.zonasNuevas.forEach((zona, i) => clasificar(zona, i));

    return mapa;
  }

  private construirZonas(estado: EstadoPartidaApi): PorLugar<ZonaTablero> {
    const buscar = (lugar: NombreLugar, indice: number): ZonaTablero | undefined => {
      const zona = estado.zonas.find((item) =>
        lugar === 'derecha'
          ? normalizar(item.lugar).includes('der') ||
            (!normalizar(item.lugar).includes('izq') && indice === 1)
          : normalizar(item.lugar).includes('izq') ||
            (!normalizar(item.lugar).includes('der') && indice === 0),
      );

      return zona ? this.construirZona(zona) : undefined;
    };

    return {
      izquierda: buscar('izquierda', 0) ?? zonaVacia(),
      derecha: buscar('derecha', 1) ?? zonaVacia(),
    };
  }

  private construirZona(zona: ZonaPartidaApi): ZonaTablero {
    return {
      id: zona.zonaPartidaId,
      zonaPartidaId: zona.zonaPartidaId,
      nombre: zona.nombre,
      imagenUrl: zona.imagenUrl || IMAGEN_ZONA_RESPALDO,
      efecto: {
        categoria: CATEGORIA_POR_DEFECTO,
        bonus: 0,
        texto: zona.efecto ?? undefined,
      },
      poderPropio: zona.puntajePropio,
      poderRival: zona.puntajeRival,
      bonusPorCategoria: {},
      ganador: zona.ganador,
    };
  }

  /**
   * Construye los slots de un lugar físico (izquierda/derecha).
   *
   * Las cartas se asocian al lugar usando el mapa `zonaPartidaId → lugar`,
   * que incluye tanto las zonas activas como las que rotaron en el último
   * resultado. Esto garantiza que una carta jugada antes de una rotación
   * siga apareciendo en el lugar correcto después de rotar.
   */
  private construirLugar(estado: EstadoReal, lugar: NombreLugar, mapaZona?: ReadonlyMap<number, NombreLugar>): LugarPartida {
    const zona = estado.zonas[lugar];
    const propio = this.slotsVacios();
    const rival = this.slotsVacios();

    for (const item of estado.cartasMesa) {
      // Si no hay mapa precalculado, filtrar por zonaPartidaId activo (compatibilidad).
      let lugarCarta = mapaZona
        ? (mapaZona.get(item.zonaPartidaId) ?? null)
        : (item.zonaPartidaId === zona.zonaPartidaId ? lugar : null);

      // Fallback: si no se encuentra en mapa, intentar por zona activa
      if (lugarCarta !== lugar && item.zonaPartidaId === zona.zonaPartidaId) {
        lugarCarta = lugar;
      }

      if (lugarCarta !== lugar) {
        continue;
      }

      const slots = item.lado === 'propio' ? propio : rival;
      let slot = item.slot;

      if (slot < 0 || slot >= SLOTS_POR_LADO || slots[slot] !== null) {
        slot = slots.findIndex((actual) => actual === null);
      }

      if (slot >= 0 && slot < SLOTS_POR_LADO) {
        slots[slot] = item.carta;
      }
    }

    return { zona, propio, rival };
  }

  private slotsVacios(): (Carta | null)[] {
    return Array.from({ length: SLOTS_POR_LADO }, () => null);
  }

  private cartaMesaDesdeApi(item: CartaEnMesaApi): CartaMesaVista {
    const carta =
      item.oculta || !item.carta
        ? this.cartaOculta(item.cartaPartidaId)
        : this.cartaDesdeApi(item.carta, {
            cartaPartidaId: item.cartaPartidaId,
            poderActual: item.poderActual,
          });

    return {
      carta,
      zonaPartidaId: item.zonaPartidaId ?? 0,
      lado: item.lado,
      slot: item.indice ?? 0,
    };
  }

  private cartaDesdeApi(
    carta: CartaApi,
    opciones: {
      readonly cartaPartidaId?: number;
      readonly poderActual?: number | null;
      readonly jugable?: boolean;
    } = {},
  ): Carta {
    return {
      id:
        opciones.cartaPartidaId !== undefined
          ? `cp-${opciones.cartaPartidaId}`
          : String(carta.cartaId),
      cartaId: carta.cartaId,
      cartaPartidaId: opciones.cartaPartidaId,
      nombre: carta.nombre || 'Carta',
      imagenUrl: carta.imagenUrl ?? '',
      rareza: this.rarezaDesdeNombre(carta.rareza),
      categoria: categoriaCartaDesdeNombre(carta.categoria),
      atributoIzquierdo: opciones.poderActual ?? carta.poder,
      atributoDerecho: carta.costoCupon,
      obtenida: true,
      jugable: opciones.jugable,
    };
  }

  /** Reverso de una carta que el rival todavía no reveló. */
  private cartaOculta(cartaPartidaId: number): Carta {
    return {
      id: `oculta-${cartaPartidaId}`,
      cartaPartidaId,
      nombre: 'Carta oculta',
      imagenUrl: '',
      rareza: 'comun',
      categoria: CATEGORIA_POR_DEFECTO,
      atributoIzquierdo: 0,
      atributoDerecho: 0,
      obtenida: true,
      oculta: true,
    };
  }

  private rarezaDesdeNombre(valor: string): RarezaCarta {
    const normalizada = normalizar(valor);

    if (normalizada === 'rara') {
      return 'rara';
    }

    if (normalizada === 'epica' || normalizada === 'epicarta') {
      return 'epicarta';
    }

    if (normalizada === 'legendaria') {
      return 'legendaria';
    }

    return 'comun';
  }

  /** Traduce el resultado de la ronda sin recalcular ningún puntaje. */
  private armarResultado(
    resultado: ResultadoRondaApi | null,
    estado: EstadoPartidaApi,
  ): ResultadoRonda | null {
    if (!resultado) {
      return null;
    }

    const nombres = new Map<number, string>();

    estado.zonas.forEach((zona) => nombres.set(zona.zonaPartidaId, zona.nombre));
    resultado.zonasNuevas.forEach((zona) => nombres.set(zona.zonaPartidaId, zona.nombre));

    const zonas: ResultadoZonaRonda[] = resultado.zonas.map((zona) => ({
      zonaPartidaId: zona.zonaPartidaId,
      nombreZona: nombres.get(zona.zonaPartidaId) ?? 'Zona',
      propio: zona.puntajePropio,
      rival: zona.puntajeRival,
      ganador: zona.ganador,
      puntosGanadosPropio: zona.puntosGanadosPropio,
      puntosGanadosRival: zona.puntosGanadosRival,
    }));

    const fin = resultado.fin;
    const ganador = fin?.ganador ?? null;

    return {
      numero: resultado.ronda,
      zonas,
      puntosPropio: resultado.puntosTotalesPropio,
      puntosRival: resultado.puntosTotalesRival,
      terminada: fin !== null,
      ganador,
      motivo: fin?.motivo ?? null,
      gane: ganador === null || ganador === 'empate' ? null : ganador === 'propio',
    };
  }

  /** Cuenta regresiva de la ronda y cierre automático cuando vence el tiempo. */
  private tickReloj(): void {
    if (!this.modoRealSignal()) {
      return;
    }

    const estado = this.estadoRealSignal();

    if (!estado || estado.terminada || estado.listo) {
      return;
    }

    const transcurridos = Math.floor((Date.now() - estado.momentoReferencia) / 1000);
    const restantes = Math.max(0, estado.segundosIniciales - transcurridos);

    this.segundosSignal.set(restantes);

    if (restantes === 0 && !this.rondaCerradaSignal() && !this.confirmandoSignal()) {
      this.rondaCerradaSignal.set(true);
      this.cerrarRonda();
    }
  }

  /** Heartbeat independiente de la visibilidad de la pestaña. */
  private enviarLatido(): void {
    if (!this.modoRealSignal()) {
      return;
    }

    const estado = this.estadoRealSignal();

    if (!estado || estado.terminada) {
      return;
    }

    this.partidaApi
      .enviarLatido(estado.partidaId)
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  /** Polling pausado con la pestaña oculta. */
  private consultarEstado(): void {
    if (!this.modoRealSignal() || this.sincronizando) {
      return;
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    this.sincronizarEstado(false);
  }

  private sincronizarEstado(mostrarError: boolean): void {
    if (!this.modoRealSignal() || this.sincronizando) {
      return;
    }

    const estado = this.estadoRealSignal();

    if (!estado || estado.terminada) {
      return;
    }

    const epoca = this.epoca;
    const partidaId = estado.partidaId;
    const rondaActual = estado.ronda;

    this.sincronizando = true;

    this.partidaApi
      .obtenerEstado(partidaId)
      .pipe(
        finalize(() => {
          if (this.esEpocaActual(epoca)) {
            this.sincronizando = false;
          }
        }),
      )
      .subscribe({
        next: (nuevoEstado) => {
          if (!this.esEpocaActual(epoca) || !this.esPartidaActual(partidaId)) {
            return;
          }

          if (nuevoEstado.ronda < rondaActual) {
            console.warn('[PartidaServicio] Se descartó respuesta de polling con ronda menor', {
              recibido: nuevoEstado.ronda,
              actual: rondaActual,
            });
            return;
          }

          this.aplicarEstado(nuevoEstado);

          if (this.esFinal(nuevoEstado)) {
            this.detenerSincronizacion();
          }
        },
        error: (error: unknown) => {
          if (!this.esEpocaActual(epoca)) {
            return;
          }

          const status = this.statusDe(error);

          if (status === 404 || status === 403) {
            this.borrarPartidaId();
            this.limpiarEstado();
            return;
          }

          if (mostrarError) {
            this.registrarError(error, false);
          }
        },
      });
  }

  /** Devuelve una clave estable para reintentar exactamente la misma acción. */
  private clavePara(tipo: string, firma: string): string {
    const actual = this.clavesEnCurso.get(tipo);

    if (actual?.firma === firma) {
      return actual.clave;
    }

    const base = `${tipo}-${firma}-${this.generarId()}`;
    const clave = base.length > 128 ? base.slice(0, 128) : base;

    this.clavesEnCurso.set(tipo, { firma, clave });

    return clave;
  }

  private olvidarClave(tipo: string): void {
    this.clavesEnCurso.delete(tipo);
  }

  private generarId(): string {
    const cripto = globalThis.crypto;

    if (typeof cripto?.randomUUID === 'function') {
      return cripto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  private esFinal(estado: EstadoPartidaApi): boolean {
    return normalizar(estado.estado) === 'finalizada';
  }

  /** Evita que una respuesta vieja resucite o pise otra partida. */
  private esPartidaActual(partidaId: number): boolean {
    return this.modoRealSignal() && this.estadoRealSignal()?.partidaId === partidaId;
  }

  /** Evita que una respuesta vieja pise el estado de una partida nueva. */
  private esEpocaActual(epoca: number): boolean {
    return epoca === this.epoca;
  }

  private statusDe(error: unknown): number | null {
    const status = (error as { status?: number })?.status;

    return typeof status === 'number' ? status : null;
  }

  private registrarError(error: unknown, resincronizar: boolean): void {
    const mensaje = this.mensajeDeError(error);
    const status = this.statusDe(error);

    this.errorSignal.set(mensaje);
    toast.error(mensaje);

    if (resincronizar && (status === 409 || status === 400)) {
      this.sincronizarEstado(false);
    }
  }

  private limpiarEstado(): void {
    this.epoca += 1;
    this.detenerSincronizacion();
    this.borrarPartidaId();
    this.modoRealSignal.set(false);
    this.estadoRealSignal.set(null);
    this.resultadoSignal.set(null);
    this.deltasSignal.set(DELTAS_VACIOS);
    this.anuncioSignal.set('');
    this.segundosSignal.set(0);
    this.errorSignal.set(null);
    this.rondaCerradaSignal.set(false);
    this.cargandoSignal.set(false);
    this.enviandoCartaSignal.set(false);
    this.confirmandoSignal.set(false);
    this.sincronizando = false;
    this.clavesEnCurso.clear();
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
      const guardado = Number(localStorage.getItem(CLAVE_PARTIDA));

      return Number.isInteger(guardado) && guardado > 0 ? guardado : null;
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
