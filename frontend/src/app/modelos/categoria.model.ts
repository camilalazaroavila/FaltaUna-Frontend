/**
 * Catálogo cerrado de las categorías cuyos sobres llevan un icono en el centro.
 *
 * El union sale de la constante y no al revés para que agregar una categoría sea
 * agregar una línea acá: los `Record<CategoriaSobre, …>` del resto del proyecto
 * (etiquetas, alias del backend, iconos) pasan a reclamarla en tiempo de
 * compilación, así que ningún mapa puede quedarse sin su entrada.
 */
export const CATEGORIAS_SOBRE = [
  'tecnologia',
  'cosmetica',
  'entretenimiento',
  'gastronomia',
  'indumentaria',
  'musica',
] as const;

/** Categoría de sobre. Sin acentos ni mayúsculas: es un valor de máquina. */
export type CategoriaSobre = (typeof CATEGORIAS_SOBRE)[number];

/**
 * Cómo se escribe cada categoría para una persona. Es lo único que se muestra y
 * lo único que entra en el `aria-label`, así que acá van tildes y mayúscula.
 */
export const ETIQUETAS_CATEGORIA: Record<CategoriaSobre, string> = {
  tecnologia: 'Tecnología',
  cosmetica: 'Cosmética',
  entretenimiento: 'Entretenimiento',
  gastronomia: 'Gastronomía',
  indumentaria: 'Indumentaria',
  musica: 'Música',
};

/**
 * Traducción del `Categoria.Nombre` del backend (`varchar(50)`, sin índice
 * único) al valor del input `categoria`, con la clave YA normalizada por
 * `normalizarNombre`.
 *
 * El backend hoy siembra dos filas: `Comida` y `Ropa`. Las otras cuatro
 * categorías del sobre no tienen contraparte en la base: la tabla acepta los
 * alias por si aparecen, pero `null` es la respuesta honesta mientras tanto.
 * Los alias son generosos a propósito, porque el nombre es texto libre y no hay
 * catálogo que lo restrinja.
 */
export const NOMBRES_CATEGORIA_BACKEND: Readonly<Record<string, CategoriaSobre>> = {
  // Únicos nombres que aparecen en las semillas actuales.
  comida: 'gastronomia',
  ropa: 'indumentaria',
  // Equivalencias previsibles del mismo rubro.
  alimentos: 'gastronomia',
  bebida: 'gastronomia',
  bebidas: 'gastronomia',
  gastronomia: 'gastronomia',
  gastronomico: 'gastronomia',
  restaurante: 'gastronomia',
  moda: 'indumentaria',
  vestimenta: 'indumentaria',
  ropa_deportes: 'indumentaria',
  indumentaria: 'indumentaria',
  // Categorías sin fila en el backend todavía.
  tecno: 'tecnologia',
  tecnologia: 'tecnologia',
  tecnologias: 'tecnologia',
  electronica: 'tecnologia',
  electrodomesticos: 'tecnologia',
  cosmetica: 'cosmetica',
  cosmeticos: 'cosmetica',
  belleza: 'cosmetica',
  cuidado_personal: 'cosmetica',
  entretenimiento: 'entretenimiento',
  entretenimientos: 'entretenimiento',
  musica: 'musica',
};

/**
 * Deja el nombre comparable: minúsculas, sin tildes y sin espacios extra.
 *
 * El backend guarda `varchar(50)` en `utf8mb4`, así que puede venir
 * `Cosmética`, `COSMETICA` o `cosmetica ` y las tres son la misma categoría.
 * Se usa `NFD` + filtrado de diacríticos en lugar de una tabla de reemplazos
 * para no tener que mantenerla.
 */
const normalizarNombre = (nombre: string): string =>
  nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

/**
 * Traduce el nombre de categoría del backend al valor del input `categoria`.
 *
 * Devuelve `null` ante cualquier nombre desconocido, y también ante `null`,
 * `undefined`, una cadena vacía o un valor que no sea texto: el sobre cae
 * entonces al grafotipo genérico, que es el comportamiento correcto para un
 * catálogo que el backend puede ampliar en cualquier momento
 * (`categoria.Nombre` no es una enumeración en la base, es texto libre).
 */
export const categoriaDesdeNombre = (nombre: string | null | undefined): CategoriaSobre | null => {
  if (typeof nombre !== 'string') {
    return null;
  }

  const limpio = nombre.trim();
  if (!limpio) {
    return null;
  }

  return NOMBRES_CATEGORIA_BACKEND[normalizarNombre(limpio)] ?? null;
};
