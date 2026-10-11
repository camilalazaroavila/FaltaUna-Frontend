/** Rareza de una carta coleccionable. */
export type RarezaCarta = 'comun' | 'rara' | 'epicarta' | 'legendaria';

/** Categoría comercial de la marca representada en la carta. */
export type CategoriaCarta =
  | 'gastronomia'
  | 'cosmeticos'
  | 'decoracion'
  | 'indumentaria'
  | 'entretenimiento'
  | 'musica'
  | 'tecnologia';

/**
 * Modelo de una carta coleccionable.
 *
 * El componente `app-carta` recibe una instancia de esta interfaz por @Input
 * y no depende de ningún servicio; cuando el backend esté listo, la vista
 * que consuma el componente simplemente le pasará datos reales.
 */
export interface Carta {
  readonly id: string;
  readonly nombre: string;
  readonly imagenUrl: string;
  readonly rareza: RarezaCarta;
  readonly categoria: CategoriaCarta;
  readonly atributoIzquierdo: number;
  readonly atributoDerecho: number;
  readonly obtenida: boolean;
}

/** Cantidad de estrellas según rareza (orden ascendente de poder). */
export const ESTRELLAS_POR_RAREZA: Record<RarezaCarta, number> = {
  comun: 1,
  rara: 2,
  epicarta: 3,
  legendaria: 4,
};

/** Etiqueta legible para cada rareza (accesibilidad y UI). */
export const ETIQUETA_RAREZA: Record<RarezaCarta, string> = {
  comun: 'Común',
  rara: 'Rara',
  epicarta: 'Epicarta',
  legendaria: 'Legendaria',
};

/** Etiqueta legible para cada categoría (sidebar y aria-labels). */
export const ETIQUETA_CATEGORIA: Record<CategoriaCarta, string> = {
  gastronomia: 'Gastronomía',
  cosmeticos: 'Cosméticos',
  decoracion: 'Decoración',
  indumentaria: 'Indumentaria',
  entretenimiento: 'Entretenimiento',
  musica: 'Música',
  tecnologia: 'Tecnología',
};
