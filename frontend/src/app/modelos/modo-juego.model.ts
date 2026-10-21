/** Formas de empezar una partida: contra otro jugador, contra la IA o el tutorial. */
export type ModoJuego = 'pvp' | 'ia' | 'tutorial';

const MODOS_JUEGO: readonly ModoJuego[] = ['pvp', 'ia', 'tutorial'];

/** Sirve para validar valores que llegan de afuera (por ejemplo, de la ruta). */
export function esModoJuego(valor: unknown): valor is ModoJuego {
  return MODOS_JUEGO.some((modo) => modo === valor);
}