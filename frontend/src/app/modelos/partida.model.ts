import type { Carta, CategoriaCarta } from './carta.model';

/**
 * Tipos compartidos por los componentes de la pantalla de partida.
 *
 * Viven en `modelos/` y no dentro de un componente porque los consumen varios
 * átomos (slot, chip de jugador, barra de puntos y badge de puntaje).
 *
 * El archivo tiene dos mitades:
 *
 * 1. **Dominio**: los tipos que consume el tablero (lugares, slots, zonas).
 * 2. **Contrato**: los DTOs crudos que devuelve la API de partida, replicando
 *    los nombres en camelCase que usa el backend (`PartidasController` y
 *    `PartidasBotController`). El mapeo de DTO a dominio vive en los servicios,
 *    nunca en los componentes.
 */

/**
 * Lado del tablero al que pertenece una carta.
 *
 * Las cartas pertenecen al LUGAR (izquierda/derecha) y no a la zona: cuando la
 * zona rota, la carta se queda donde está y solo cambia su foto, marco y
 * efecto (secciones 10 y 11).
 */
export type LadoPartida = 'propio' | 'rival';

/** Estado de un slot del tablero. */
export type EstadoSlot = 'vacio' | 'resaltado' | 'ocupado';

/** Resultado del puntaje de una zona, desde la perspectiva de un lado. */
export type EstadoPuntajeZona = 'ganando' | 'perdiendo' | 'empate';

/**
 * Fase de la ronda desde el punto de vista del jugador.
 *
 * `jugando`: el jugador puede bajar cartas.
 * `esperando`: el jugador ya confirmó y espera que se cierre la ronda.
 * `resolviendo`: se está mostrando el resultado de la ronda.
 */
export type EstadoRondaPartida = 'jugando' | 'esperando' | 'resolviendo';

/** Columna del tablero: la zona activa de la izquierda y la de la derecha. */
export type NombreLugar = 'izquierda' | 'derecha';

/** Seis slots por lado; `null` = slot vacío. */
export type SlotsLado = readonly (Carta | null)[];

/** Los dos lugares del tablero, indexados por nombre. */
export type PorLugar<T> = Record<NombreLugar, T>;

/** Un lugar del tablero: su zona activa y los slots de cada lado. */
export interface LugarPartida {
  readonly zona: ZonaTablero;
  readonly rival: SlotsLado;
  readonly propio: SlotsLado;
}

/** Puntaje de una zona visto desde un lado. */
export interface PuntajeLugar {
  readonly propio: number;
  readonly rival: number;
  readonly estadoPropio: EstadoPuntajeZona;
  readonly estadoRival: EstadoPuntajeZona;
}

/** Cuánto cambió el puntaje de cada lado en la última resolución de ronda. */
export interface DeltaLugar {
  readonly propio: number;
  readonly rival: number;
}

/**
 * Efecto de una zona.
 *
 * El backend manda `BonusPorCategoria` con todas las categorías que la zona
 * bonifica (`ZonaCategoria.BonusPoder`). Acá se expone **el efecto principal**
 * (la categoría que más bonifica) porque es lo que muestra el popup, y el
 * diccionario completo queda disponible en `ZonaTablero.bonusPorCategoria`.
 */
export interface EfectoZona {
  readonly categoria: CategoriaCarta;
  readonly bonus: number;
}

/** Zona activa, tal como la muestra el tablero. */
export interface ZonaTablero {
  /** Id de la zona en el catálogo (`Zona.Id`). */
  readonly id: number;
  /** Id de la zona en esta partida (`ZonaPartida.Id`): es el destino al jugar. */
  readonly zonaPartidaId: number;
  readonly nombre: string;
  readonly imagenUrl: string;
  readonly efecto: EfectoZona;
  /** Poder acumulado del jugador en la zona, calculado por el servidor. */
  readonly poderPropio: number;
  /** Poder acumulado del rival en la zona, calculado por el servidor. */
  readonly poderRival: number;
  /** Bonus por `CategoriaId`, tal cual lo manda el servidor. */
  readonly bonusPorCategoria: Readonly<Record<number, number>>;
}

/** Jugador del tablero (chip con nombre y avatar). */
export interface JugadorTablero {
  readonly nombre: string;
  readonly avatarUrl: string | null;
}

/* ────────────────────────────── Contrato de la API ────────────────────────────── */

/** Carta que el servidor tiene en la mano del jugador. */
export interface CartaEnManoApi {
  readonly cartaId: number;
  readonly nombre: string;
  readonly costoMana: number;
  readonly poder: number;
  readonly categoriaId: number;
  readonly estado: string;
}

/** Ronda en curso, con el tiempo que le queda calculado por el servidor. */
export interface RondaActualApi {
  readonly numero: number;
  readonly fechaInicio: string;
  readonly fechaFin: string;
  readonly segundosRestantes: number;
}

/** Estado del jugador que está mirando la partida. */
export interface JugadorEstadoApi {
  readonly usuarioId: number;
  readonly manaActual: number;
  readonly puntosAcumulados: number;
  readonly confirmoRonda: boolean;
  readonly mano: readonly CartaEnManoApi[];
}

/** Estado del rival. El servidor todavía no manda cuántas cartas tiene en mano. */
export interface RivalEstadoApi {
  readonly usuarioId: number;
  readonly esBot: boolean;
  readonly manaActual: number;
  readonly puntosAcumulados: number;
}

/**
 * Zona activa con el poder ya jugado.
 *
 * `bonusPorCategoria` llega como `Dictionary<int, int>`: en JSON las claves
 * quedan como strings ("1", "2"), así que el tipo es `Record<string, number>`.
 */
export interface ZonaEstadoApi {
  readonly zonaPartidaId: number;
  readonly zonaId: number;
  readonly nombre: string;
  readonly posicionInicial: string;
  readonly poderPropio: number;
  readonly poderRival: number;
  readonly bonusPorCategoria: Readonly<Record<string, number>>;
}

/** Estado completo de la partida: es lo que devuelve `GET .../bot/estado`. */
export interface PartidaEstadoApi {
  readonly partidaId: number;
  readonly estado: string;
  readonly puntosObjetivo: number;
  readonly rondaActual: RondaActualApi;
  readonly miJugador: JugadorEstadoApi;
  readonly rival: RivalEstadoApi;
  readonly zonas: readonly ZonaEstadoApi[];
  readonly ganadorId: number | null;
  readonly fechaFin: string | null;
}

/** Zona revelada al empezar la partida. */
export interface ZonaReveladaApi {
  readonly id: number;
  readonly nombre: string;
  readonly posicionInicial: string;
}

/** Carta de la mano al empezar la partida (aún sin costo ni poder). */
export interface CartaEnManoInicialApi {
  readonly cartaId: number;
  readonly posicionMazo: number;
  readonly estado: string;
  readonly nombre: string;
}

/** Mano propia al empezar la partida. */
export interface ManoPropiaApi {
  readonly usuarioId: number;
  readonly mazoId: number;
  readonly manaActual: number;
  readonly cartas: readonly CartaEnManoInicialApi[];
}

/** Rival al empezar la partida. */
export interface RivalApi {
  readonly usuarioId: number;
  readonly mazoId: number;
}

/** Respuesta de `POST /api/Partidas/bot`. */
export interface PartidaIniciadaApi {
  readonly partidaId: number;
  readonly estado: string;
  readonly zonasReveladas: readonly ZonaReveladaApi[];
  readonly manoPropia: ManoPropiaApi;
  readonly rival: RivalApi;
}

/** Resultado de una zona en la ronda recién resuelta. */
export interface ResultadoZonaApi {
  readonly zonaPartidaId: number;
  readonly poderJugador1: number;
  readonly poderJugador2: number;
}

/**
 * Resultado de la ronda.
 *
 * Ojo: `poderJugador1` y `poderJugador2` siguen el orden de `Partida.Manos`
 * (ordenado por `UsuarioId`), no "vos" y "el rival". Para saber cuál es el
 * propio hay que comparar `miJugador.usuarioId` con `rival.usuarioId`.
 */
export interface ResultadoRondaApi {
  readonly numeroRonda: number;
  readonly zonas: readonly ResultadoZonaApi[];
  readonly partidaTerminada: boolean;
  readonly ganadorId: number | null;
}

/** Respuesta de `POST .../bot/jugar-carta`. */
export interface JugarCartaRespuestaApi {
  readonly manaRestante: number;
  readonly estado: PartidaEstadoApi;
}

/**
 * Respuesta de `POST .../bot/confirmar-fin-ronda` y de `.../cerrar-ronda-vencida`.
 *
 * Cuando al rival todavía no confirmó viene `esperandoRival: true` y
 * `resultado: null`; contra el bot el servidor siempre cierra la ronda.
 * `cerrar-ronda-vencida` no manda el campo, por eso es opcional.
 */
export interface ConfirmarFinDeRondaRespuestaApi {
  readonly resultado: ResultadoRondaApi | null;
  readonly esperandoRival?: boolean;
  readonly estado: PartidaEstadoApi;
}

/** Categoría del catálogo (`GET /api/Categorias`). */
export interface CategoriaApi {
  readonly id: number;
  readonly nombre: string;
  readonly descripcion: string | null;
}

/* ───────────────────────────── Resultado de ronda ───────────────────────────── */

/** Cómo terminó una zona en la ronda recién resuelta. */
export interface ResultadoZonaRonda {
  readonly zonaPartidaId: number;
  readonly nombreZona: string;
  /** Poder del jugador en la zona. */
  readonly propio: number;
  /** Poder del rival en la zona. */
  readonly rival: number;
}

/**
 * Resultado de la ronda, listo para mostrar.
 *
 * `poderJugador1` y `poderJugador2` del backend siguen el orden de
 * `Partida.Manos` (por `UsuarioId`), así que el servicio ya los traduce a
 * "propio" y "rival" antes de armar este tipo.
 */
export interface ResultadoRonda {
  readonly numero: number;
  readonly zonas: readonly ResultadoZonaRonda[];
  readonly puntosPropio: number;
  readonly puntosRival: number;
  /** La partida terminó con esta ronda. */
  readonly terminada: boolean;
  readonly ganadorId: number | null;
  /** `null` cuando la partida terminó empatada. */
  readonly gane: boolean | null;
}

