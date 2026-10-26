import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from './api.service';
import {
  esCantidadAlbumValida,
  categoriaCartaDesdeNombre,
  type CantidadAlbum,
  type CategoriaAlbum,
  type CartaAlbum,
  type DetalleAlbum,
  type ResumenAlbum,
} from '@modelos/album-jugador.model';
import { CARTAS_MOCK, type CartaConMarca } from '@modelos/cartas.mock';
import { ETIQUETA_CATEGORIA, type CategoriaCarta } from '@modelos/carta.model';

/**
 * Datos de prueba mientras el backend no expone el listado/detalle de álbumes
 * del jugador ni el endpoint de favoritas con JWT. Los métodos públicos ya
 * devuelven `Observable` con la forma HTTP final: al conectar el back solo
 * cambia la implementación, no los componentes.
 *
 * Las cartas de cada álbum NO se duplican acá: salen del mismo mock que usa
 * "Mis cartas" (`CARTAS_MOCK`), agrupadas por su marca. Así las dos vistas
 * muestran exactamente la misma carta (id, nombre, rareza, imagen y categoría).
 */

/** Marcas de prueba: al menos una por categoría, con una sin logo para el fallback. */
interface MarcaMock {
  readonly nombre: string;
  readonly categoria: CategoriaCarta;
  readonly logoUrl: string | null;
  readonly descripcion: string;
  /** Total de cartas de la colección: uno de 12, 20 o 30. */
  readonly cartas: CantidadAlbum;
}

/** Las 7 categorías de carta, en el orden que usa el filtro. */
const CATEGORIAS_ALBUM: readonly CategoriaCarta[] = [
  'gastronomia',
  'cosmeticos',
  'decoracion',
  'indumentaria',
  'entretenimiento',
  'musica',
  'tecnologia',
];

const MARCAS_MOCK: readonly MarcaMock[] = [
  { nombre: 'Grido', categoria: 'gastronomia', logoUrl: 'imagenes/grido.jpg', descripcion: 'Los clásicos helados de barrio, ahora en cartas.', cartas: 12 },
  { nombre: 'McDonald\'s', categoria: 'gastronomia', logoUrl: 'imagenes/McDonalds.jpg', descripcion: 'Sabores que hicieron historia.', cartas: 20 },
  { nombre: 'Coca-Cola', categoria: 'gastronomia', logoUrl: 'imagenes/cocacola.jpg', descripcion: 'La chispa que acompaña cada partido.', cartas: 30 },
  { nombre: 'Natura', categoria: 'cosmeticos', logoUrl: null, descripcion: 'Belleza de origen natural.', cartas: 12 },
  { nombre: 'Casa Limón', categoria: 'decoracion', logoUrl: null, descripcion: 'Deco cálida para tu casa.', cartas: 20 },
  { nombre: 'Zara', categoria: 'indumentaria', logoUrl: 'imagenes/zara.png', descripcion: 'Moda urbana para la cancha.', cartas: 30 },
  { nombre: 'Sony', categoria: 'musica', logoUrl: 'imagenes/sony.png', descripcion: 'Sonido que se juega de memoria.', cartas: 12 },
  { nombre: 'Google', categoria: 'tecnologia', logoUrl: 'imagenes/google.jpg', descripcion: 'Tecnología para todos los días.', cartas: 20 },
  { nombre: 'Lego', categoria: 'entretenimiento', logoUrl: 'imagenes/lego.png', descripcion: 'Armá tu propia historia.', cartas: 30 },
];

const IMAGEN_FALLBACK = 'imagenes/Sprite.png';

const redondearPorcentaje = (obtenidas: number, total: number): number =>
  total > 0 ? Math.round(Math.min(100, Math.max(0, (obtenidas / total) * 100))) : 0;

/** Adapta una carta de "Mis cartas" al modelo de la grilla del álbum. */
const cartaDeMarcaACartaAlbum = (carta: CartaConMarca): CartaAlbum => ({
  id: carta.id,
  nombre: carta.nombre,
  imagenUrl: carta.imagenUrl,
  rareza: carta.rareza,
  categoria: carta.categoria,
  costoCupon: carta.atributoDerecho,
  poder: carta.atributoIzquierdo,
  obtenida: carta.obtenida,
  cantidad: carta.obtenida ? 1 : 0,
  favorita: false,
});

/**
 * Cartas conocidas de una marca: las de `CARTAS_MOCK` que le pertenecen, sin
 * repetir (por id). Su estado `obtenida` es el de "Mis cartas".
 */
const cartasConocidasDeMarca = (nombreMarca: string): CartaAlbum[] => {
  const vistas = new Set<string>();
  const cartas: CartaAlbum[] = [];

  for (const carta of CARTAS_MOCK) {
    if (carta.marca !== nombreMarca || vistas.has(carta.id)) {
      continue;
    }
    vistas.add(carta.id);
    cartas.push(cartaDeMarcaACartaAlbum(carta));
  }

  return cartas;
};

/**
 * Completa el álbum hasta `total` con slots vacíos sin identidad de carta: solo
 * llevan una etiqueta de posición para el `aria-label`.
 */
const cartasDeAlbum = (marca: MarcaMock, idAlbum: number): CartaAlbum[] => {
  const conocidas = cartasConocidasDeMarca(marca.nombre).slice(0, marca.cartas);
  const faltantes = marca.cartas - conocidas.length;

  const vacias: CartaAlbum[] = Array.from({ length: Math.max(0, faltantes) }, (_, i) => ({
    id: `slot-${idAlbum}-${i + 1}`,
    nombre: `Carta ${conocidas.length + i + 1}`,
    imagenUrl: IMAGEN_FALLBACK,
    rareza: 'comun',
    categoria: marca.categoria,
    poder: 0,
    costoCupon: 0,
    obtenida: false,
    cantidad: 0,
    favorita: false,
  }));

  return [...conocidas, ...vacias];
};

const DETALLE_MOCK: readonly DetalleAlbum[] = MARCAS_MOCK.map((marca, indice) => {
  const id = indice + 1;
  const cartas = cartasDeAlbum(marca, id);
  const obtenidas = cartas.filter((carta) => carta.obtenida).length;

  return {
    id,
    marcaNombre: marca.nombre,
    logoUrl: marca.logoUrl,
    descripcion: marca.descripcion,
    categoriaId: CATEGORIAS_ALBUM.indexOf(marca.categoria) + 1,
    categoriaNombre: ETIQUETA_CATEGORIA[marca.categoria],
    total: marca.cartas,
    obtenidas,
    porcentaje: redondearPorcentaje(obtenidas, marca.cartas),
    cartas,
  };
});

const CATEGORIAS_MOCK: readonly CategoriaAlbum[] = CATEGORIAS_ALBUM.map((categoria, indice) => ({
  id: indice + 1,
  nombre: ETIQUETA_CATEGORIA[categoria],
  categoria,
}));

/**
 * Servicio de la vista "Álbumes" del jugador.
 *
 * Consume `ApiService` (único punto con `HttpClient` y `environment`) con rutas
 * relativas a `/api`. Cada método intenta el backend y, si falla, devuelve datos
 * de prueba: así la vista es demostrable antes de que el back implemente el
 * contrato acordado.
 */
@Injectable({ providedIn: 'root' })
export class AlbumesJugadorService {
  private readonly api = inject(ApiService);

  /** Favoritas de prueba en memoria, para que sobrevivan al reabrir el detalle. */
  private readonly favoritasMock = new Set<string>();

  /**
   * Categorías de marca. Traduce `Categoria.Nombre` del backend a la categoría
   * de carta (7, decoración incluida) y descarta las que no reconoce.
   */
  listarCategorias(): Observable<CategoriaAlbum[]> {
    return this.api.get<{ id: number; nombre: string }[]>('Categorias').pipe(
      map((categorias) =>
        categorias
          .map((categoria) => ({
            id: categoria.id,
            nombre: categoria.nombre,
            categoria: categoriaCartaDesdeNombre(categoria.nombre),
          }))
          .filter((categoria) => categoria.categoria !== null),
      ),
      catchError(() => of([...CATEGORIAS_MOCK])),
    );
  }

  /** Resúmenes de álbumes, opcionalmente filtrados por categoría de la marca. */
  listarAlbumes(categoriaId: number | null = null): Observable<ResumenAlbum[]> {
    return this.api
      .get<ResumenAlbum[]>('Colecciones/albumes', { params: { categoriaId } })
      .pipe(catchError(() => of(this.albumesMock(categoriaId))));
  }

  /** Detalle de un álbum con sus cartas, favoritas incluidas. Valida que el total sea 12, 20 o 30. */
  obtenerDetalleAlbum(id: number): Observable<DetalleAlbum> {
    return this.api.get<DetalleAlbum>(`Colecciones/${id}/album`).pipe(
      catchError(() => {
        const detalle = DETALLE_MOCK.find((album) => album.id === id);
        return detalle
          ? of(this.conFavoritas(detalle))
          : throwError(() => new Error('No encontramos el álbum.'));
      }),
      map((detalle) => {
        if (!esCantidadAlbumValida(detalle.total)) {
          throw new Error(
            `La colección tiene una cantidad de cartas inválida (${detalle.total}). Debe ser 12, 20 o 30.`,
          );
        }
        return detalle;
      }),
    );
  }

  /** Marca una carta como "carta que quiero". Idempotente en el backend. */
  marcarFavorita(cartaId: string): Observable<void> {
    return this.api.post<void>(`CartaFavorita/${cartaId}`).pipe(
      catchError(() => {
        this.favoritasMock.add(cartaId);
        return of(undefined);
      }),
    );
  }

  /** Desmarca una carta de "cartas que quiero". Idempotente en el backend. */
  desmarcarFavorita(cartaId: string): Observable<void> {
    return this.api.delete<void>(`CartaFavorita/${cartaId}`).pipe(
      catchError(() => {
        this.favoritasMock.delete(cartaId);
        return of(undefined);
      }),
    );
  }

  private albumesMock(categoriaId: number | null): ResumenAlbum[] {
    return DETALLE_MOCK.filter(
      (album) => categoriaId === null || album.categoriaId === categoriaId,
    ).map((album) => ({
      id: album.id,
      marcaNombre: album.marcaNombre,
      logoUrl: album.logoUrl,
      descripcion: album.descripcion,
      categoriaId: album.categoriaId,
      categoriaNombre: album.categoriaNombre,
      total: album.total,
      obtenidas: album.obtenidas,
      porcentaje: album.porcentaje,
    }));
  }

  private conFavoritas(detalle: DetalleAlbum): DetalleAlbum {
    if (this.favoritasMock.size === 0) {
      return detalle;
    }

    return {
      ...detalle,
      cartas: detalle.cartas.map((carta) => ({
        ...carta,
        favorita: this.favoritasMock.has(carta.id),
      })),
    };
  }
}
