import type { Carta, RarezaCarta } from './carta.model';
/** Cantidad exacta de cartas que debe tener una baraja terminada. */
export const TAMANIO_BARAJA = 12;
/** Rarezas en orden de poder ascendente, para listar los conteos siempre igual. */
export const RAREZAS_BARAJA: readonly RarezaCarta[] = ['comun', 'rara', 'epicarta', 'legendaria'];
/**
 * Composición obligatoria definida por el backend.
 */
export const LIMITES_BARAJA: Record<RarezaCarta, number> = {
  comun: 5,
  rara: 4,
  epicarta: 2,
  legendaria: 1,
};
/** Plural legible por rareza, para los mensajes de límite. */
const PLURAL_RAREZA: Record<RarezaCarta, string> = {
  comun: 'comunes',
  rara: 'raras',
  epicarta: 'epicartas',
  legendaria: 'legendarias',
};
export interface ConteoRareza {
  readonly rareza: RarezaCarta;
  readonly seleccionadas: number;
  readonly maximo: number;
}
export interface EstadoBaraja {
  readonly cartas: readonly Carta[];
  readonly total: number;
  readonly objetivo: number;
  readonly completa: boolean;
  readonly faltantes: number;
  readonly conteos: readonly ConteoRareza[];
  readonly puedeConfirmar: boolean;
  readonly puedeAgregar: boolean;
}
export interface ResultadoSeleccion {
  readonly permitido: boolean;
  readonly motivo?: string;
}
/** Cuenta cuántas cartas hay de cada rareza y contra qué tope compiten. */
export function contarPorRareza(
  seleccion: readonly Carta[],
  limites: Record<RarezaCarta, number> = LIMITES_BARAJA,
): ConteoRareza[] {
  return RAREZAS_BARAJA.map((rareza) => ({
    rareza,
    seleccionadas: seleccion.filter((carta) => carta.rareza === rareza).length,
    maximo: limites[rareza],
  }));
}
/** Deriva todo el estado de la baraja a partir de las cartas elegidas. */
export function calcularEstadoBaraja(
  seleccion: readonly Carta[],
  limites: Record<RarezaCarta, number> = LIMITES_BARAJA,
): EstadoBaraja {
  const total = seleccion.length;
  const conteos = contarPorRareza(seleccion, limites);
  const completa =
    total === TAMANIO_BARAJA &&
    conteos.every((conteo) => conteo.seleccionadas === conteo.maximo);
  return {
    cartas: [...seleccion],
    total,
    objetivo: TAMANIO_BARAJA,
    completa,
    faltantes: Math.max(0, TAMANIO_BARAJA - total),
    conteos,
    puedeConfirmar: completa,
    puedeAgregar: total < TAMANIO_BARAJA,
  };
}
/**
 * Valida si una carta puede sumarse a la selección. No contempla el caso de
 * "ya está seleccionada" (eso lo resuelve la vista al alternar).
 */
export function puedeSeleccionar(
  carta: Carta,
  seleccion: readonly Carta[],
  limites: Record<RarezaCarta, number> = LIMITES_BARAJA,
): ResultadoSeleccion {
  if (seleccion.length >= TAMANIO_BARAJA) {
    return { permitido: false, motivo: `La baraja ya tiene sus ${TAMANIO_BARAJA} cartas.` };
  }
  const conteo = seleccion.filter((c) => c.rareza === carta.rareza).length;
  const maximo = limites[carta.rareza];
  if (conteo >= maximo) {
    return {
      permitido: false,
      motivo: `Ya alcanzaste el máximo de ${maximo} ${PLURAL_RAREZA[carta.rareza]}.`,
    };
  }
  return { permitido: true };
}