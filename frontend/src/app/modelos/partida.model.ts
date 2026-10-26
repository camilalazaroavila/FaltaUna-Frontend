import type { Carta, CategoriaCarta, EfectoCategoriaCarta } from './carta.model';

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
 *    `PartidasJuegoController`). El mapeo de DTO a dominio vive en los
 *    servicios, nunca en los componentes.
 */

/**
 * Lado del tablero al que pertenece una carta.
 *
 * Las cartas pertenecen al LUGAR (izquierda/derecha) y no a la zona: cuando la
 * zona rota, la carta se queda donde está y solo cambia su foto, marco y
 * efecto (secciones 10 y 11).
 */
export type LadoPartida = 'propio' | 'rival';

/** Ganador de una zona o de la partida, desde la perspectiva del jugador. */
export type GanadorPartida = LadoPartida | 'empate';

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
 * El contrato actual manda un texto libre (`efecto`) y un tipo. Los campos de
 * categoría y bonus quedan para la maqueta y para cuando el catálogo de zonas
 * exponga esa información.
 */
export interface EfectoZona {
  readonly categoria: CategoriaCarta;
  readonly bonus: number;
  readonly texto?: string;
}

/** Zona activa, tal como la muestra el tablero. */
export interface ZonaTablero {
  /** Id de la zona en el catálogo, o `zonaPartidaId` si el contrato no lo manda. */
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
  /** Bonus por `CategoriaId`, solo disponible en la maqueta. */
  readonly bonusPorCategoria: Readonly<Record<number, number>>;
  /** Zona ganada según el servidor (solo en partida real). */
  readonly ganador?: GanadorPartida;
  /** Efectos visuales de categoría (sube/baja) que la zona aplica a las cartas. */
  readonly efectosCategoria?: readonly EfectoCategoriaCarta[];
}

/** Jugador del tablero (chip con nombre y avatar). */
export interface JugadorTablero {
  readonly nombre: string;
  readonly avatarUrl: string | null;
  readonly esBot?: boolean;
}

/* ────────────────────────────── Contrato de la API ────────────────────────────── */

/** Habilidad de una carta, tal como la expone el contrato. */
export interface HabilidadApi {
  readonly tipo: string;
  readonly momento: string;
  readonly valor: number | null;
  readonly categoriaObjetivo: string | null;
  readonly descripcion: string | null;
}

/** Carta del juego con todos los datos que necesita el tablero. */
export interface CartaApi {
  readonly cartaId: number;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly poder: number;
  readonly costoCupon: number;
  readonly rareza: string;
  readonly categoria: string;
  readonly imagenUrl: string | null;
  readonly habilidad: HabilidadApi | null;
}

/** Carta en la mano, con la disponibilidad ya resuelta por el servidor. */
export interface CartaEnManoApi {
  readonly cartaPartidaId: number;
  readonly carta: CartaApi;
  readonly jugable: boolean;
}

/** Carta sobre la mesa. `oculta` indica que el rival todavía no la reveló. */
export interface CartaEnMesaApi {
  readonly cartaPartidaId: number;
  readonly zonaPartidaId: number | null;
  readonly indice: number | null;
  readonly lado: LadoPartida;
  readonly oculta: boolean;
  readonly carta: CartaApi | null;
  readonly poderActual: number | null;
  readonly lugar?: string;
}

/** Jugador de la partida con sus recursos y puntos calculados por el servidor. */
export interface JugadorPartidaApi {
  readonly jugadorPartidaId: number;
  readonly usuarioId: number | null;
  readonly nombre: string;
  readonly avatarUrl: string | null;
  readonly esBot: boolean;
  readonly puntosTotales: number;
  readonly cuponActual: number;
  readonly cuponMaximo: number;
  readonly listo: boolean;
  readonly cartasEnMano: number;
  readonly cartasEnMazo: number;
}

/** Modificador de categoría que puede mandar el backend estructurado. */
export interface ModificadorCategoriaZonaApi {
  readonly categoria: string;
  readonly bonus?: number;
  readonly valor?: number;
}

/** Zona activa con el poder ya jugado. */
export interface ZonaPartidaApi {
  readonly zonaPartidaId: number;
  readonly nombre: string;
  readonly lugar: string;
  readonly imagenUrl: string | null;
  readonly efecto: string | null;
  readonly tipoEfecto: string;
  readonly puntajePropio: number;
  readonly puntajeRival: number;
  readonly diferencia: number;
  readonly ganador: GanadorPartida;
  readonly cartas: readonly CartaEnMesaApi[];
  readonly modificadores?: readonly ModificadorCategoriaZonaApi[];
}

/** Resultado de una zona en la ronda recién resuelta. */
export interface ResultadoZonaApi {
  readonly zonaPartidaId: number;
  readonly puntajePropio: number;
  readonly puntajeRival: number;
  readonly diferencia: number;
  readonly puntosGanadosPropio: number;
  readonly puntosGanadosRival: number;
  readonly ganador: GanadorPartida;
}

/** Efecto aplicado durante la resolución de una ronda. */
export interface EfectoRondaApi {
  readonly cartaPartidaId: number | null;
  readonly zonaPartidaId: number | null;
  readonly momento: string;
  readonly delta: number;
  readonly descripcion: string | null;
  readonly orden: number;
}

/** Fin de la partida: ganador textual y motivo definido por el servidor. */
export interface ResultadoPartidaApi {
  readonly partidaId: number;
  readonly ganador: GanadorPartida | null;
  readonly motivo: string | null;
  readonly puntosPropio: number;
  readonly puntosRival: number;
  readonly fechaFin: string | null;
}

/** Resultado completo de una ronda resuelta. */
export interface ResultadoRondaApi {
  readonly ronda: number;
  readonly cartasReveladas: readonly CartaEnMesaApi[];
  readonly efectos: readonly EfectoRondaApi[];
  readonly zonas: readonly ResultadoZonaApi[];
  readonly puntosTotalesPropio: number;
  readonly puntosTotalesRival: number;
  readonly zonasNuevas: readonly ZonaPartidaApi[];
  readonly cartaRobada: CartaEnManoApi | null;
  readonly cuponNuevoPropio: number;
  readonly cuponNuevoRival: number;
  readonly fin: ResultadoPartidaApi | null;
}

/**
 * Estado completo de la partida.
 *
 * Es la única fuente de verdad: puntajes, cupones, fase, ganador y mano ya
 * vienen resueltos por el servidor.
 */
export interface EstadoPartidaApi {
  readonly partidaId: number;
  readonly estado: string;
  readonly modo: string;
  readonly ronda: number;
  readonly rondasTotales: number;
  readonly fase: string;
  readonly finDeRonda: string | null;
  readonly puntosMaximos: number;
  readonly jugadorPropio: JugadorPartidaApi;
  readonly rival: JugadorPartidaApi;
  readonly zonas: readonly ZonaPartidaApi[];
  readonly cartasEnMesa: readonly CartaEnMesaApi[];
  readonly manoPropia: readonly CartaEnManoApi[];
  readonly ultimoResultado: ResultadoRondaApi | null;
  readonly segundosRestantes: number;
  readonly segundosTotales?: number;
  readonly duracionRonda?: number;
  readonly tiempoTotalRonda?: number;
}

/** Respuesta liviana del heartbeat. */
export interface HeartbeatApi {
  readonly ahora: string;
}

/** Cuerpo de `POST /api/Partidas/bot`. */
export interface IniciarPartidaBotRequest {
  readonly mazoId?: number;
  readonly mazoUsuario1Id?: number;
}

/** Cuerpo de `POST /api/Partidas/{id}/jugar`. */
export interface JugarCartaRequestApi {
  readonly cartaId: number;
  readonly cartaPartidaId?: number;
  readonly zonaPartidaId: number;
  readonly indice?: number;
  readonly numeroRonda?: number;
}

/** Cuerpo de `POST /api/Partidas/{id}/finalizar`. */
export interface FinalizarPartidaRequestApi {
  readonly ronda?: number;
  readonly numeroRonda?: number;
}

/**
 * Respuesta de `finalizar`: `200` devuelve el resultado de la ronda y `202`
 * devuelve el estado cuando todavía se espera al rival.
 */
export type FinalizarPartidaRespuestaApi = ResultadoRondaApi | EstadoPartidaApi;

/* ───────────────────────────── Resultado de ronda ───────────────────────────── */

/** Cómo terminó una zona en la ronda recién resuelta. */
export interface ResultadoZonaRonda {
  readonly zonaPartidaId: number;
  readonly nombreZona: string;
  /** Poder del jugador en la zona. */
  readonly propio: number;
  /** Poder del rival en la zona. */
  readonly rival: number;
  readonly ganador: GanadorPartida;
  readonly puntosGanadosPropio: number;
  readonly puntosGanadosRival: number;
}

/** Carta jugada por el rival revelada al resolver la ronda. */
export interface CartaReveladaRival {
  readonly nombre: string;
  readonly poder: number;
  readonly nombreZona: string;
}

/** Resultado de la ronda, listo para mostrar. */
export interface ResultadoRonda {
  readonly numero: number;
  readonly zonas: readonly ResultadoZonaRonda[];
  readonly puntosPropio: number;
  readonly puntosRival: number;
  /** La partida terminó con esta ronda. */
  readonly terminada: boolean;
  /** Ganador textual que manda el servidor (`null` si sigue en curso). */
  readonly ganador: GanadorPartida | null;
  /** Motivo del fin de partida, tal cual lo manda el servidor. */
  readonly motivo: string | null;
  /** `null` cuando la partida sigue en curso o terminó empatada. */
  readonly gane: boolean | null;
  /** Cartas reveladas del rival en esta resolución. */
  readonly cartasReveladasRival: readonly CartaReveladaRival[];
}
