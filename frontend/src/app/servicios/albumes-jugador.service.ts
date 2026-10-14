import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ApiService } from './api.service';
import {
  MIN_CARTAS_COLECCION,
  MAX_CARTAS_COLECCION,
  validarCantidadCartasColeccion,
  categoriaCartaDesdeNombre,
  type CategoriaAlbum,
  type CartaAlbum,
  type DetalleAlbum,
  type ResumenAlbum,
} from '../modelos/album-jugador.model';
import { ETIQUETA_CATEGORIA, type CategoriaCarta, type RarezaCarta } from '../modelos/carta.model';

/**
 * Datos de prueba mientras el backend no expone el listado/detalle de álbumes
 * del jugador ni el endpoint de favoritas con JWT. Los métodos públicos ya
 * devuelven `Observable` con la forma HTTP final: al conectar el back solo
 * cambia la implementación, no los componentes.
 */

/** Marcas de prueba: al menos una por categoría, con una sin logo para el fallback. */
interface MarcaMock {
  readonly nombre: string;
  readonly categoria: CategoriaCarta;
  readonly logoUrl: string | null;
  readonly descripcion: string;
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
  { nombre: 'Grido', categoria: 'gastronomia', logoUrl: 'imagenes/grido.jpg', descripcion: 'Los clásicos helados de barrio, ahora en cartas.' },
  { nombre: 'McDonald\'s', categoria: 'gastronomia', logoUrl: 'imagenes/McDonalds.jpg', descripcion: 'Sabores que hicieron historia.' },
  { nombre: 'Coca-Cola', categoria: 'gastronomia', logoUrl: 'imagenes/cocacola.jpg', descripcion: 'La chispa que acompaña cada partido.' },
  { nombre: 'Natura', categoria: 'cosmeticos', logoUrl: null, descripcion: 'Belleza de origen natural.' },
  { nombre: 'Casa Limón', categoria: 'decoracion', logoUrl: null, descripcion: 'Deco cálida para tu casa.' },
  { nombre: 'Zara', categoria: 'indumentaria', logoUrl: 'imagenes/zara.png', descripcion: 'Moda urbana para la cancha.' },
  { nombre: 'Sony', categoria: 'musica', logoUrl: 'imagenes/sony.png', descripcion: 'Sonido que se juega de memoria.' },
  { nombre: 'Google', categoria: 'tecnologia', logoUrl: 'imagenes/google.jpg', descripcion: 'Tecnología para todos los días.' },
  { nombre: 'Lego', categoria: 'entretenimiento', logoUrl: 'imagenes/lego.png', descripcion: 'Armá tu propia historia.' },
];

const IMAGEN_FALLBACK = 'imagenes/Sprite.png';
const RAREZAS_CICLO: readonly RarezaCarta[] = ['comun', 'rara', 'epicarta', 'legendaria', 'comun'];

/** Tamaño determinista por álbum, siempre dentro de [MIN_CARTAS_COLECCION, MAX_CARTAS_COLECCION]. */
const cartasPorAlbum = (indice: number): number =>
  MIN_CARTAS_COLECCION + (indice % (MAX_CARTAS_COLECCION - MIN_CARTAS_COLECCION + 1));

const redondearPorcentaje = (obtenidas: number, total: number): number =>
  total > 0 ? Math.round(Math.min(100, Math.max(0, (obtenidas / total) * 100))) : 0;

/** Cantidad de cartas obtenidas: la última marca queda completa para el canje. */
const obtenidasDeAlbum = (total: number, indice: number): number =>
  indice === MARCAS_MOCK.length - 1 ? total : Math.max(1, Math.floor(total / 2));

const cartasDeAlbum = (marca: MarcaMock, indiceAlbum: number): CartaAlbum[] => {
  const total = cartasPorAlbum(indiceAlbum);
  const obtenidas = obtenidasDeAlbum(total, indiceAlbum - 1);

  return Array.from({ length: total }, (_, i) => {
    const obtenida = i < obtenidas;
    return {
      id: `album-${indiceAlbum}-carta-${i + 1}`,
      nombre: `${marca.nombre} ${i + 1}`,
      imagenUrl: marca.logoUrl ?? IMAGEN_FALLBACK,
      rareza: RAREZAS_CICLO[i % RAREZAS_CICLO.length],
      categoria: marca.categoria,
      poder: 10 + (i % 10) * 5,
      costoMana: 4 + (i % 10) * 3,
      obtenida,
      cantidad: obtenida ? 1 : 0,
      favorita: false,
    };
  });
};

const DETALLE_MOCK: readonly DetalleAlbum[] = MARCAS_MOCK.map((marca, indice) => {
  const cartas = cartasDeAlbum(marca, indice + 1);
  const total = cartas.length;
  const obtenidas = cartas.filter((carta) => carta.obtenida).length;

  return {
    id: indice + 1,
    marcaNombre: marca.nombre,
    logoUrl: marca.logoUrl,
    descripcion: marca.descripcion,
    categoriaId: CATEGORIAS_ALBUM.indexOf(marca.categoria) + 1,
    categoriaNombre: ETIQUETA_CATEGORIA[marca.categoria],
    total,
    obtenidas,
    porcentaje: redondearPorcentaje(obtenidas, total),
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

  /** Detalle de un álbum con sus cartas, favoritas incluidas. Valida rango de 12 a 30 cartas. */
  obtenerDetalleAlbum(id: number): Observable<DetalleAlbum> {
    return this.api.get<DetalleAlbum>(`Colecciones/${id}/album`).pipe(
      catchError(() => {
        const detalle = DETALLE_MOCK.find((album) => album.id === id);
        return detalle
          ? of(this.conFavoritas(detalle))
          : throwError(() => new Error('No encontramos el álbum.'));
      }),
      map((detalle) => {
        if (!validarCantidadCartasColeccion(detalle.total)) {
          throw new Error(
            `La colección tiene una cantidad de cartas inválida (${detalle.total}). Debe estar entre ${MIN_CARTAS_COLECCION} y ${MAX_CARTAS_COLECCION}.`,
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
