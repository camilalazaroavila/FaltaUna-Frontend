import { Injectable, computed, signal } from '@angular/core';
import type { EstadoBotonListo } from '@compartidos/componentes/partida/boton-listo/boton-listo';
import type { Carta } from '@modelos/carta.model';
import { CARTAS_MOCK } from '@modelos/cartas.mock';
import type { EstadoPuntajeZona } from '@modelos/partida.model';
import { JUGADORES_MOCK, ZONAS_MOCK } from '@servicios/servicios-partida/zonas-mock.service';
import type { ZonaMock } from '@servicios/servicios-partida/zonas-mock.service';

export type NombreLugar = 'izquierda' | 'derecha';

/** Seis slots por lado; `null` = slot vacío. */
export type SlotsLado = readonly (Carta | null)[];

export interface LugarPartida {
  readonly zona: ZonaMock;
  readonly rival: SlotsLado;
  readonly propio: SlotsLado;
}

export interface PuntajeLugar {
  readonly propio: number;
  readonly rival: number;
  readonly estadoPropio: EstadoPuntajeZona;
  readonly estadoRival: EstadoPuntajeZona;
}

export interface DeltaLugar {
  readonly propio: number;
  readonly rival: number;
}

type PorLugar<T> = Record<NombreLugar, T>;

const NOMBRES_LUGAR: readonly NombreLugar[] = ['izquierda', 'derecha'];
const SLOTS_POR_LADO = 6;

const cartaMock = (id: string): Carta => {
  const carta = CARTAS_MOCK.find((c) => c.id === id);

  if (!carta) {
    throw new Error(`Carta mock inexistente: ${id}`);
  }

  return carta;
};

/** Completa con `null` hasta los 6 slots del lado. */
const slots = (...ids: string[]): SlotsLado => [
  ...ids.map(cartaMock),
  ...Array.from({ length: SLOTS_POR_LADO - ids.length }, () => null),
];

const estadoDe = (propio: number, rival: number): EstadoPuntajeZona =>
  propio > rival ? 'ganando' : propio < rival ? 'perdiendo' : 'empate';

/** Poder de las cartas del lado, más el bonus por cada carta de la categoría del efecto. */
const puntajeLado = (cartas: SlotsLado, zona: ZonaMock): number =>
  cartas.reduce((total, carta) => {
    if (!carta) {
      return total;
    }

    const bonus = carta.categoria === zona.efecto.categoria ? zona.efecto.bonus : 0;

    return total + carta.atributoIzquierdo + bonus;
  }, 0);

const barajar = <T>(items: readonly T[], azar: () => number): T[] => {
  const copia = [...items];

  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }

  return copia;
};

/**
 * MOCK: estado de la partida. Sin backend, sin timers y sin resolución de
 * turno (regla pendiente, context.md §10). Las cartas pertenecen al LUGAR:
 * al rotar las zonas se quedan donde están y solo cambia la zona.
 * El bonus de zona (+bonus por carta de la categoría del efecto) es mock (§11).
 */
@Injectable({ providedIn: 'root' })
export class PartidaEstadoService {
  /** Inyectable para tests: devuelve un número en [0, 1). */
  azar: () => number = Math.random;

  private readonly estadoLugares = signal<PorLugar<LugarPartida>>({
    izquierda: {
      zona: ZONAS_MOCK[0],
      rival: slots('c-004', 'c-040'),
      propio: slots('c-006', 'c-046'),
    },
    derecha: {
      zona: ZONAS_MOCK[1],
      rival: slots('c-003'),
      propio: slots('c-025', 'c-026'),
    },
  });

  private readonly estadoDeltas = signal<PorLugar<DeltaLugar>>({
    izquierda: { propio: 0, rival: 0 },
    derecha: { propio: 0, rival: 0 },
  });
  private readonly estadoRotaciones = signal(0);
  private readonly estadoAnuncio = signal('');
  private readonly estadoRonda = signal<EstadoBotonListo>('jugando');

  readonly lugares = this.estadoLugares.asReadonly();
  readonly deltas = this.estadoDeltas.asReadonly();
  /** Se incrementa en cada rotación. */
  readonly rotaciones = this.estadoRotaciones.asReadonly();
  /** Texto para la región aria-live. */
  readonly anuncio = this.estadoAnuncio.asReadonly();
  readonly estadoRondaMock = this.estadoRonda.asReadonly();
  readonly resolviendo = computed(() => this.estadoRonda() === 'resolviendo');

  // ── MOCK: valores fijos, sin cálculo de victoria por 100 (§10 pendiente) ──
  readonly turno = signal(3).asReadonly();
  readonly segundosRestantes = signal(28).asReadonly();
  /** El máximo del cupón es el turno actual (A confirmar con §10). */
  readonly cuponesPropio = signal(3).asReadonly();
  readonly barraPropia = signal(42).asReadonly();
  readonly barraRival = signal(18).asReadonly();
  readonly jugadores = JUGADORES_MOCK;
  /** MOCK: mano del jugador. `jugarCarta()` saca la carta de acá y la baja al tablero. */
  private readonly estadoManoPropia = signal<readonly Carta[]>(
    ['c-015', 'c-016', 'c-018', 'c-028', 'c-029'].map(cartaMock),
  );
  readonly manoPropia = this.estadoManoPropia.asReadonly();
  /** MOCK: cuántas cartas le quedan al rival en la mano. */
  readonly cartasManoRival = signal(3).asReadonly();

  readonly puntajes = computed<PorLugar<PuntajeLugar>>(() => {
    const lugares = this.estadoLugares();
    const calcular = (lugar: LugarPartida): PuntajeLugar => {
      const propio = puntajeLado(lugar.propio, lugar.zona);
      const rival = puntajeLado(lugar.rival, lugar.zona);

      return {
        propio,
        rival,
        estadoPropio: estadoDe(propio, rival),
        estadoRival: estadoDe(rival, propio),
      };
    };

    return { izquierda: calcular(lugares.izquierda), derecha: calcular(lugares.derecha) };
  });

  /**
   * Cambia la zona de cada lugar por otra distinta del pool, sin tocar las
   * cartas, y guarda cuánto cambió el puntaje de cada lado.
   */
  rotarZonas(): void {
    const antes = this.puntajes();
    const enUso = new Set(NOMBRES_LUGAR.map((n) => this.estadoLugares()[n].zona.id));
    const [nuevaIzquierda, nuevaDerecha] = barajar(
      ZONAS_MOCK.filter((zona) => !enUso.has(zona.id)),
      this.azar,
    );

    this.estadoLugares.update((lugares) => ({
      izquierda: { ...lugares.izquierda, zona: nuevaIzquierda },
      derecha: { ...lugares.derecha, zona: nuevaDerecha },
    }));

    const despues = this.puntajes();
    const delta = (n: NombreLugar): DeltaLugar => ({
      propio: despues[n].propio - antes[n].propio,
      rival: despues[n].rival - antes[n].rival,
    });

    this.estadoDeltas.set({ izquierda: delta('izquierda'), derecha: delta('derecha') });
    this.estadoRotaciones.update((n) => n + 1);
    this.estadoAnuncio.set(
      `La zona izquierda cambió a ${nuevaIzquierda.nombre}. La zona derecha cambió a ${nuevaDerecha.nombre}.`,
    );
  }

  /**
   * MOCK: baja una carta de la mano a un slot propio vacío del lugar indicado.
   *
   * Es la ÚNICA vía para jugar una carta: la usan el drag and drop y el botón
   * de jugar de cada slot disponible. Valida antes de tocar el estado:
   *
   *  1. es el turno del jugador (`estadoRonda === 'jugando'`);
   *  2. la carta sigue en la mano (evita jugarla dos veces por eventos
   *     duplicados o interacciones simultáneas);
   *  3. el slot destino es propio y está vacío.
   *
   * `context.md` deja pendientes el límite de cartas jugables por ronda y el
   * costo/cupón, así que NO se validan acá. Devuelve `true` si se jugó y
   * `false` si alguna validación falló (el drag vuelve la carta a la mano).
   */
  jugarCarta(carta: Carta, lugar: NombreLugar, indice: number): boolean {
    if (this.estadoRonda() !== 'jugando') {
      return false;
    }

    const mano = this.estadoManoPropia();
    const posicionMano = mano.findIndex((enMano) => enMano.id === carta.id);

    if (posicionMano === -1) {
      return false;
    }

    const propios = this.estadoLugares()[lugar].propio;

    if (indice < 0 || indice >= propios.length || propios[indice] !== null) {
      return false;
    }

    const nuevosPropios = propios.map((slot, i) => (i === indice ? carta : slot));

    this.estadoLugares.update((lugares) => ({
      ...lugares,
      [lugar]: { ...lugares[lugar], propio: nuevosPropios },
    }));
    this.estadoManoPropia.set(mano.filter((_, i) => i !== posicionMano));
    this.estadoAnuncio.set(`Jugaste ${carta.nombre} en la zona ${lugar}.`);

    return true;
  }

  /** Publica un texto en la región aria-live (avisos de la partida). */
  anunciar(mensaje: string): void {
    this.estadoAnuncio.set(mensaje);
  }

  /** MOCK: el jugador tocó "Finalizar turno" y espera al rival. */
  marcarListo(): void {
    this.estadoRonda.set('esperando');
  }

  /** MOCK: ambos terminaron; se calcula y se animan las zonas (galería). */
  marcarResolviendo(): void {
    this.estadoRonda.set('resolviendo');
  }

  /** MOCK: vuelve a "jugando" (galería). */
  reiniciarRonda(): void {
    this.estadoRonda.set('jugando');
  }
}