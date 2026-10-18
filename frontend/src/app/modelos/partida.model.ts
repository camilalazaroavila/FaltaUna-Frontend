/**
 * Tipos compartidos por los componentes de la pantalla de partida.
 *
 * Viven en `modelos/` y no dentro de un componente porque los consumen varios
 * átomos (slot, chip de jugador, barra de puntos y badge de puntaje).
 */

/**
 * Lugar del tablero al que pertenece una carta.
 *
 * Las cartas pertenecen al LUGAR (izquierda/derecha) y no a la zona: cuando la
 * zona rota, la carta se queda donde está y solo cambia su foto, marco y
 * efecto (secciones 10 y 11).
 */
export type LadoPartida = 'propio' | 'rival';

/** Estado de un slot del tablero. */
export type EstadoSlot = 'vacio' | 'resaltado' | 'ocupado' | 'rival-oculto';

/** Resultado del puntaje de una zona, desde la perspectiva de un lado. */
export type EstadoPuntajeZona = 'ganando' | 'perdiendo' | 'empate';
