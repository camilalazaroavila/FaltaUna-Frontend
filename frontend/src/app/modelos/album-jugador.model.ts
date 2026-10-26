import type { Carta, CategoriaCarta, RarezaCarta } from './carta.model';
import {
  categoriaDesdeNombre,
  normalizarNombre,
  type CategoriaSobre,
} from './categoria.model';

/**
 * Modelos de la vista "Álbumes" del jugador.
 *
 * `AlbumesJugadorService` los arma a partir de los endpoints `/api/Albumes`,
 * que ya devuelven el progreso y las favoritas del usuario autenticado.
 *
 * El nombre del archivo lleva el sufijo `-jugador` para no chocar con
 * `album.model.ts`, que describe la creación de colecciones del modo empresa.
 */

/** Resumen de un álbum de marca para el listado lateral por categoría. */
export interface ResumenAlbum {
  readonly id: number;
  readonly marcaNombre: string;
  readonly logoUrl: string | null;
  readonly descripcion: string | null;
  /** `Categoria.Id` de la marca; `null` si la marca todavía no fue categorizada. */
  readonly categoriaId: number | null;
  readonly categoriaNombre: string | null;
  readonly total: number;
  readonly obtenidas: number;
  /** Entero 0..100. Se recalcula en el front si el back no lo envía. */
  readonly porcentaje: number;
}

/** Una carta dentro de un álbum, con su estado de obtención y de favorita. */
export interface CartaAlbum {
  readonly id: string;
  readonly nombre: string;
  readonly imagenUrl: string;
  readonly rareza: RarezaCarta;
  readonly categoria: CategoriaCarta;
  /** `Carta.Poder` del backend (atributo izquierdo del componente `app-carta`). */
  readonly poder: number;
  /** `Carta.costoCupon` del backend (atributo derecho del componente `app-carta`). */
  readonly costoCupon: number;
  readonly obtenida: boolean;
  readonly cantidad: number;
  /** Si el jugador la marcó como "carta que quiero". */
  readonly favorita: boolean;
}

/** Detalle de un álbum: encabezado de marca + progreso + grilla de cartas. */
export interface DetalleAlbum extends ResumenAlbum {
  readonly cartas: readonly CartaAlbum[];
}

/** Categoría del filtro lateral, ya resuelta a la categoría de carta (7). */
export interface CategoriaAlbum {
  readonly id: number;
  readonly nombre: string;
  /** `null` cuando el nombre del backend no matchea ninguna categoría conocida. */
  readonly categoria: CategoriaCarta | null;
}

/**
 * Puente del union de categorías de sobre (6) al union de categorías de carta
 * (7): solo difieren en el nombre, `cosmetica` vs `cosmeticos`.
 */
export function categoriaCartaDesdeSobre(categoria: CategoriaSobre): CategoriaCarta {
  return categoria === 'cosmetica' ? 'cosmeticos' : categoria;
}

/** Alias de backend que corresponden a la categoría de carta `decoracion`. */
const ALIAS_DECORACION = new Set(['decoracion', 'decoraciones', 'deco', 'hogar', 'casa']);

/**
 * Traduce el `Categoria.Nombre` del backend a la categoría de carta (7),
 * incluyendo `decoracion`, que no forma parte del catálogo de sobres. Devuelve
 * `null` ante cualquier nombre desconocido, igual que `categoriaDesdeNombre`.
 */
export function categoriaCartaDesdeNombre(
  nombre: string | null | undefined,
): CategoriaCarta | null {
  const sobre = categoriaDesdeNombre(nombre);
  if (sobre) {
    return categoriaCartaDesdeSobre(sobre);
  }

  if (typeof nombre === 'string' && ALIAS_DECORACION.has(normalizarNombre(nombre))) {
    return 'decoracion';
  }

  return null;
}

/**
 * Adapta una carta de álbum al modelo que consume `app-carta`, que no conoce
 * el álbum ni las favoritas.
 */
export function cartaAlbumACarta(carta: CartaAlbum): Carta {
  return {
    id: carta.id,
    nombre: carta.nombre,
    imagenUrl: carta.imagenUrl,
    rareza: carta.rareza,
    categoria: carta.categoria,
    atributoIzquierdo: carta.poder,
    atributoDerecho: carta.costoCupon,
    obtenida: carta.obtenida,
  };
}
