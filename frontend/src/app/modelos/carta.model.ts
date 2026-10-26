/** Rareza de una carta coleccionable. */
export type RarezaCarta = 'comun' | 'rara' | 'epicarta' | 'legendaria';

const normalizarTexto = (valor: string): string =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function rarezaDesdeNombre(valor: string | null | undefined): RarezaCarta {
  if (typeof valor !== 'string') {
    return 'comun';
  }

  const normalizada = normalizarTexto(valor);

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
  /** Poder base de la carta (solo relevante en mesa). */
  readonly poderBase?: number;
  readonly obtenida: boolean;
  /** Id de la carta en el catálogos cuando viene de una partida. */
  readonly cartaId?: number;
  /** Id de la instancia en la partida: distingue copias repetidas en la mano. */
  readonly cartaPartidaId?: number;
  /** El servidor ya resolvió si la carta se puede jugar en esta ronda. */
  readonly jugable?: boolean;
  /** Carta del rival que todavía no fue revelada. */
  readonly oculta?: boolean;
  /** Efectos sobre categorías que produce la habilidad de la carta. */
  readonly efectosCategoria?: readonly EfectoCategoriaCarta[];
}

/** Efecto sobre una categoría que mejora o empeora el poder. */
export interface EfectoCategoriaCarta {
  readonly tipo: 'sube' | 'baja';
  readonly categoria: CategoriaCarta;
  readonly valor?: number | null;
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

/** Categoría que se usa cuando el backend no manda una categoría reconocible. */
export const CATEGORIA_POR_DEFECTO: CategoriaCarta = 'gastronomia';

/**
 * Equivalencias entre el nombre de categoría del backend (`Categoria.Nombre`,
 * texto libre en la base) y el valor de máquina del modelo de carta.
 *
 * La tabla `categoria` hoy se siembra con `Comida` y `Ropa`, así que esos dos
 * nombres van primero. Los alias siguientes son previsibles del mismo rubro.
 */
const EQUIVALENCIAS_CATEGORIA: Readonly<Record<string, CategoriaCarta>> = {
  comida: 'gastronomia',
  alimentos: 'gastronomia',
  bebida: 'gastronomia',
  bebidas: 'gastronomia',
  gastronomia: 'gastronomia',
  gastronomico: 'gastronomia',
  restaurante: 'gastronomia',
  ropa: 'indumentaria',
  moda: 'indumentaria',
  vestimenta: 'indumentaria',
  indumentaria: 'indumentaria',
  decoracion: 'decoracion',
  decoraciones: 'decoracion',
  cosmeticos: 'cosmeticos',
  cosmetica: 'cosmeticos',
  belleza: 'cosmeticos',
  cuidado_personal: 'cosmeticos',
  entretenimiento: 'entretenimiento',
  entretenimientos: 'entretenimiento',
  musica: 'musica',
  tecnologia: 'tecnologia',
  tecnologias: 'tecnologia',
  electronica: 'tecnologia',
  tecno: 'tecnologia',
};

/**
 * Traduce el nombre de categoría del backend al valor del modelo de carta.
 *
 * Deja el nombre comparable (minúsculas, sin tildes) antes de buscarlo, porque
 * el backend guarda `varchar(50)` en `utf8mb4` y el mismo rubro puede venir
 * escrito de varias formas. Ante un nombre desconocido devuelve
 * `CATEGORIA_POR_DEFECTO`: la tabla acepta cualquier texto y la vista nunca
 * puede quedarse sin categoría.
 */
export function categoriaCartaDesdeNombre(nombre: string | null | undefined): CategoriaCarta {
  if (typeof nombre !== 'string') {
    return CATEGORIA_POR_DEFECTO;
  }

  const limpio = nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!limpio) {
    return CATEGORIA_POR_DEFECTO;
  }

  return EQUIVALENCIAS_CATEGORIA[limpio] ?? CATEGORIA_POR_DEFECTO;
}

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
