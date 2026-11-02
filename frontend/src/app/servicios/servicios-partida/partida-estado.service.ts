import { Injectable, computed, signal } from '@angular/core';
import { SLOTS_POR_LADO } from '@modelos/partida.model';
import type {
  Carta } from '@modelos/carta.model';
import { CARTAS_MOCK } from '@modelos/cartas.mock';
import type {
  DeltaLugar,
  EstadoPuntajeZona,
  EstadoRondaPartida,
  LugarPartida,
  NombreLugar,
  PorLugar,
  PuntajeLugar,
  SlotsLado,
  ZonaTablero,
} from '@modelos/partida.model';
import { JUGADORES_MOCK, ZONAS_MOCK } from '@servicios/servicios-partida/zonas-mock.service';
import { CARTAS_FINALES_TUTORIAL } from '@compartidos/componentes/tutorial/tutorial.escenario';


const NOMBRES_LUGAR: readonly NombreLugar[] = ['izquierda', 'derecha'];

const cartaMock = (id: string): Carta => {
  const carta = CARTAS_MOCK.find((c) => c.id === id);

  if (!carta) {
    throw new Error(`Carta mock inexistente: ${id}`);
  }

  return carta;
};

/** Completa con `null` hasta los 5 slots del lado. */
const slots = (...ids: string[]): SlotsLado => [
  ...ids.map(cartaMock),
  ...Array.from({ length: SLOTS_POR_LADO - ids.length }, () => null),
];

const estadoDe = (propio: number, rival: number): EstadoPuntajeZona =>
  propio > rival ? 'ganando' : propio < rival ? 'perdiendo' : 'empate';

/** Poder de las cartas del lado, más el bonus por cada carta de la categoría del efecto. */
const puntajeLado = (cartas: SlotsLado, zona: ZonaTablero): number =>
  cartas.reduce((total, carta) => {
    if (!carta) {
      return total;
    }

    const bonus = carta.categoria === zona.efecto.categoria ? zona.efecto.bonus : 0;

    return total + carta.atributoIzquierdo + bonus;
  }, 0);

/** Estado inicial de la maqueta, reutilizado al restaurar el tablero. */
const crearLugaresIniciales = (): PorLugar<LugarPartida> => ({
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

const crearManoInicial = (): readonly Carta[] =>
  ['c-015', 'c-016', 'c-018', 'c-028', 'c-029'].map(cartaMock);

const DELTAS_VACIOS: PorLugar<DeltaLugar> = {
  izquierda: { propio: 0, rival: 0 },
  derecha: { propio: 0, rival: 0 },
};

/**
 * Datos que necesita el tutorial para armar su ronda guiada sobre el mock.
 * No cambia reglas de negocio: solo reemplaza el estado de la maqueta.
 */
export interface EscenarioPartidaTutorial {
  readonly lugares: PorLugar<LugarPartida>;
  readonly mano: readonly Carta[];
  readonly turno: number;
  readonly segundos: number;
  readonly cupones: number;
  readonly barraPropia: number;
  readonly barraRival: number;
}

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

  private readonly estadoLugares = signal<PorLugar<LugarPartida>>(crearLugaresIniciales());

  private readonly estadoDeltas = signal<PorLugar<DeltaLugar>>({ ...DELTAS_VACIOS });
  private readonly estadoRotaciones = signal(0);
  private readonly estadoAnuncio = signal('');
  private temporizadorGuionado?: ReturnType<typeof setTimeout>;
  private readonly estadoRonda = signal<EstadoRondaPartida>('jugando');

  readonly lugares = this.estadoLugares.asReadonly();
  readonly deltas = this.estadoDeltas.asReadonly();
  /** Se incrementa en cada rotación. */
  readonly rotaciones = this.estadoRotaciones.asReadonly();
  /** Texto para la región aria-live. */
  private readonly estadoTerminada = signal(false);
  readonly terminada = this.estadoTerminada.asReadonly();
  readonly anuncio = this.estadoAnuncio.asReadonly();
  readonly estadoRondaMock = this.estadoRonda.asReadonly();
  readonly resolviendo = computed(() => this.estadoRonda() === 'resolviendo');

  // ── MOCK: valores fijos, sin cálculo de victoria por 100 (§10 pendiente) ──
  private readonly estadoTurno = signal(3);
  private readonly estadoSegundos = signal(28);
  /** El máximo del cupón es el turno actual (A confirmar con §10). */
  private readonly estadoCupones = signal(3);
  private readonly estadoCuponMaximo = signal(3);
  private readonly estadoBarraPropia = signal(42);
  private readonly estadoBarraRival = signal(18);

  readonly turno = this.estadoTurno.asReadonly();
  readonly segundosRestantes = this.estadoSegundos.asReadonly();
  readonly cuponesPropio = this.estadoCupones.asReadonly();
  readonly cuponMaximo = this.estadoCuponMaximo.asReadonly();
  readonly barraPropia = this.estadoBarraPropia.asReadonly();
  readonly barraRival = this.estadoBarraRival.asReadonly();
  readonly jugadores = JUGADORES_MOCK;
  /** MOCK: mano del jugador. `jugarCarta()` saca la carta de acá y la baja al tablero. */
  private readonly estadoManoPropia = signal<readonly Carta[]>(crearManoInicial());
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

  /** Retira una carta del tablero y la devuelve a la mano. */
  retirarCarta(carta: Carta): boolean {
    const lugares = this.estadoLugares();
    for (const lugar of ['izquierda', 'derecha'] as const) {
      const propios = lugares[lugar].propio;
      const idx = propios.findIndex((c) => c?.id === carta.id);
      if (idx !== -1) {
        const nuevosPropios = propios.map((c, i) => (i === idx ? null : c));
        this.estadoLugares.update((l) => ({
          ...l,
          [lugar]: { ...l[lugar], propio: nuevosPropios },
        }));
        this.estadoManoPropia.update((m) => [...m, carta]);
        this.estadoAnuncio.set(`${carta.nombre} volvió a tu mano.`);
        return true;
      }
    }
    return false;
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

  /**
   * MOCK: reemplaza la maqueta por el escenario guionado del tutorial.
   *
   * Es aditivo: no toca las reglas de `jugarCarta()` ni de la partida real.
   */
  prepararEscenarioTutorial(escenario: EscenarioPartidaTutorial): void {
    this.limpiarTemporizadorGuionado();
    this.estadoLugares.set(escenario.lugares);
    this.estadoManoPropia.set(escenario.mano);
    this.estadoTurno.set(escenario.turno);
    this.estadoSegundos.set(escenario.segundos);
    this.estadoCupones.set(escenario.cupones);
    this.estadoCuponMaximo.set(escenario.cupones);
    this.estadoBarraPropia.set(escenario.barraPropia);
    this.estadoBarraRival.set(escenario.barraRival);
    this.estadoDeltas.set({ ...DELTAS_VACIOS });
    this.estadoRotaciones.set(0);
    this.estadoRonda.set('jugando');
    this.estadoTerminada.set(false);
    this.estadoAnuncio.set('Tutorial: ronda de práctica.');
  }

  /**
   * MOCK: cierra la ronda del tutorial. El bot revela una carta y, después de
   * una pausa, se actualizan los marcadores con los puntos de cada zona por diferencia.
   */
  cerrarRondaGuionadaTutorial(cartaRival: Carta, lugar: NombreLugar): void {
    this.limpiarTemporizadorGuionado();
    this.estadoRonda.set('resolviendo');
    this.estadoAnuncio.set(`El bot juega ${cartaRival.nombre}.`);

    this.temporizadorGuionado = setTimeout(() => {
      this.estadoLugares.update((lugares) => {
        const rival = lugares[lugar].rival;
        const indiceLibre = rival.findIndex((carta) => carta === null);
        const destino = indiceLibre === -1 ? rival.length - 1 : indiceLibre;
        const nuevosRival = rival.map((carta, i) => (i === destino ? cartaRival : carta));

        return { ...lugares, [lugar]: { ...lugares[lugar], rival: nuevosRival } };
      });

      const puntos = this.puntajes();

      // Puntuación por diferencia en cada zona
      const difIzq = puntos.izquierda.propio - puntos.izquierda.rival;
      const difDer = puntos.derecha.propio - puntos.derecha.rival;

      const deltaPropioIzq = difIzq > 0 ? difIzq : 0;
      const deltaRivalIzq = difIzq < 0 ? Math.abs(difIzq) : 0;
      const deltaPropioDer = difDer > 0 ? difDer : 0;
      const deltaRivalDer = difDer < 0 ? Math.abs(difDer) : 0;

      const sumaPropia = deltaPropioIzq + deltaPropioDer;
      const sumaRival = deltaRivalIzq + deltaRivalDer;

      this.estadoBarraPropia.set(sumaPropia);
      this.estadoBarraRival.set(sumaRival);
      this.estadoDeltas.set({
        izquierda: { propio: deltaPropioIzq, rival: deltaRivalIzq },
        derecha: { propio: deltaPropioDer, rival: deltaRivalDer },
      });
      this.estadoTurno.set(2);
      this.estadoCupones.set(2);
      this.estadoCuponMaximo.set(2);
      this.estadoRonda.set('jugando');
      this.estadoAnuncio.set('Ronda guiada completada. Así se suman los puntos por diferencia.');
      this.temporizadorGuionado = undefined;
    }, 1200);
  }

  /**
   * MOCK: salta la partida a las rondas decisivas 5 y 6 con 5 cupones,
   * cartas reales con habilidades y puntuación previa para jugar hasta ganar.
   */
  saltarARondasDecisivasTutorial(): void {
    this.limpiarTemporizadorGuionado();
    this.estadoTurno.set(5);
    this.estadoCupones.set(5);
    this.estadoCuponMaximo.set(5);
    this.estadoBarraPropia.set(58);
    this.estadoBarraRival.set(40);
    this.estadoManoPropia.set([...CARTAS_FINALES_TUTORIAL]);
    this.rotarZonas();
    this.estadoRonda.set('jugando');
    this.estadoTerminada.set(false);
    this.estadoAnuncio.set('¡Ronda 5 de 6! Tenés 5 cupones. Bajá tus mejores cartas.');
  }

  /**
   * MOCK: simula el turno del bot en el juego libre / rondas finales.
   * El bot juega una carta, se calculan deltas por diferencia y avanza
   * a la siguiente ronda (o culmina en victoria al terminar ronda 6).
   */
  simularTurnoPracticaBot(): void {
    this.limpiarTemporizadorGuionado();
    this.estadoRonda.set('resolviendo');
    const turnoActual = this.estadoTurno();
    this.estadoAnuncio.set('El bot está jugando su carta...');

    const cartasBotPool: readonly Carta[] = [
      {
        id: 'c-bot-1',
        nombre: 'Cine Royal',
        imagenUrl: 'imagenes/lego.png',
        rareza: 'comun',
        categoria: 'entretenimiento',
        atributoIzquierdo: 2,
        atributoDerecho: 3,
        obtenida: true,
        jugable: true,
        descripcionHabilidad: 'Aporte de entretenimiento del rival.',
      },
      {
        id: 'c-bot-2',
        nombre: 'Grido Frutilla',
        imagenUrl: 'imagenes/grido.jpg',
        rareza: 'comun',
        categoria: 'gastronomia',
        atributoIzquierdo: 2,
        atributoDerecho: 3,
        obtenida: true,
        jugable: true,
        descripcionHabilidad: 'Delicioso helado que suma poder.',
      },
    ];

    this.temporizadorGuionado = setTimeout(() => {
      const cartaBot = cartasBotPool[turnoActual % cartasBotPool.length];
      const lugares = this.estadoLugares();
      const lugarElegido: NombreLugar =
        lugares.derecha.rival.some((c) => c === null) ? 'derecha' : 'izquierda';

      this.estadoLugares.update((lugs) => {
        const rival = lugs[lugarElegido].rival;
        const indiceLibre = rival.findIndex((carta) => carta === null);
        const destino = indiceLibre === -1 ? rival.length - 1 : indiceLibre;
        const nuevosRival = rival.map((carta, i) => (i === destino ? cartaBot : carta));
        return { ...lugs, [lugarElegido]: { ...lugs[lugarElegido], rival: nuevosRival } };
      });

      const puntos = this.puntajes();
      const difIzq = puntos.izquierda.propio - puntos.izquierda.rival;
      const difDer = puntos.derecha.propio - puntos.derecha.rival;

      const deltaPropioIzq = difIzq > 0 ? difIzq : 0;
      const deltaRivalIzq = difIzq < 0 ? Math.abs(difIzq) : 0;
      const deltaPropioDer = difDer > 0 ? difDer : 0;
      const deltaRivalDer = difDer < 0 ? Math.abs(difDer) : 0;

      const sumaPropia = deltaPropioIzq + deltaPropioDer;
      const sumaRival = deltaRivalIzq + deltaRivalDer;

      const nuevaBarraPropia = this.estadoBarraPropia() + sumaPropia;
      const nuevaBarraRival = this.estadoBarraRival() + sumaRival;

      this.estadoBarraPropia.set(nuevaBarraPropia);
      this.estadoBarraRival.set(nuevaBarraRival);
      this.estadoDeltas.set({
        izquierda: { propio: deltaPropioIzq, rival: deltaRivalIzq },
        derecha: { propio: deltaPropioDer, rival: deltaRivalDer },
      });

      const siguienteTurno = turnoActual + 1;
      if (siguienteTurno > 6 || nuevaBarraPropia >= 100) {
        this.estadoTerminada.set(true);
        this.estadoRonda.set('jugando');
        this.estadoAnuncio.set('¡Victoria! Has superado al bot.');
      } else {
        this.estadoTurno.set(siguienteTurno);
        this.estadoCupones.set(siguienteTurno);
        this.estadoCuponMaximo.set(siguienteTurno);
        this.rotarZonas();
        this.estadoRonda.set('jugando');
        this.estadoAnuncio.set(`Ronda final ${siguienteTurno} de 6. ¡Tenés ${siguienteTurno} cupones!`);
      }
      this.temporizadorGuionado = undefined;
    }, 1200);
  }

  /** MOCK: devuelve la maqueta a su estado original al salir del tutorial. */
  restaurarEscenario(): void {
    this.limpiarTemporizadorGuionado();
    this.estadoLugares.set(crearLugaresIniciales());
    this.estadoManoPropia.set(crearManoInicial());
    this.estadoTurno.set(3);
    this.estadoSegundos.set(28);
    this.estadoCupones.set(3);
    this.estadoCuponMaximo.set(3);
    this.estadoBarraPropia.set(42);
    this.estadoBarraRival.set(18);
    this.estadoDeltas.set({ ...DELTAS_VACIOS });
    this.estadoRotaciones.set(0);
    this.estadoRonda.set('jugando');
    this.estadoTerminada.set(false);
    this.estadoAnuncio.set('');
  }

  private limpiarTemporizadorGuionado(): void {
    if (this.temporizadorGuionado === undefined) {
      return;
    }

    clearTimeout(this.temporizadorGuionado);
    this.temporizadorGuionado = undefined;
  }

  /** MOCK: rendirse. */
  rendirse(): void {
    this.estadoAnuncio.set('Te rendiste.');
  }

  /** MOCK: abandonar. */
  abandonar(): void {
    this.estadoAnuncio.set('Abandonaste la partida.');
  }
}