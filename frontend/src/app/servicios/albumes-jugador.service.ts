import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import {
  categoriaCartaDesdeNombre,
  type CartaAlbum,
  type DetalleAlbum,
  type ResumenAlbum,
} from '@modelos/album-jugador.model';
import {
  CATEGORIA_POR_DEFECTO,
  normalizarUrlImagen,
  rarezaDesdeNombre,
} from '@modelos/carta.model';
import { esCartaSinMarca } from '@modelos/catalogo-cartas-imagenes';

/** Contrato del backend para el resumen de un álbum (`GET /api/Albumes`). */
interface AlbumResumenApi {
  readonly id: number;
  readonly marcaNombre: string;
  readonly logoUrl: string | null;
  readonly descripcion: string | null;
  readonly categoriaId: number | null;
  readonly categoriaNombre: string | null;
  readonly total: number;
  readonly obtenidas: number;
  readonly porcentaje: number;
}

/** Contrato del backend para una carta dentro de un álbum. */
interface AlbumCartaApi {
  readonly cartaId: number;
  readonly nombre: string;
  readonly imagenUrl: string | null;
  readonly rareza: string;
  readonly rarezaOrden: number;
  readonly categoria: string | null;
  readonly poder: number;
  readonly costoCupon: number;
  readonly cantidad: number;
  readonly obtenida: boolean;
  readonly favorita: boolean;
}

/** Contrato del backend para el detalle (`GET /api/Albumes/{id}`). */
interface AlbumDetalleApi extends AlbumResumenApi {
  readonly cartas: readonly AlbumCartaApi[];
}

const esAlbumConMarcaValida = (
  album: AlbumResumenApi | null | undefined,
): album is AlbumResumenApi =>
  Boolean(
    album &&
      typeof album.marcaNombre === 'string' &&
      album.marcaNombre.trim().length > 0 &&
      album.total > 0,
  );

const mapearResumen = (album: AlbumResumenApi): ResumenAlbum => ({
  id: album.id,
  marcaNombre: album.marcaNombre.trim(),
  logoUrl: album.logoUrl,
  descripcion: album.descripcion,
  categoriaId: album.categoriaId,
  categoriaNombre: album.categoriaNombre,
  total: album.total,
  obtenidas: album.obtenidas,
  porcentaje: album.porcentaje,
});

const mapearCarta = (carta: AlbumCartaApi): CartaAlbum => ({
  id: String(carta.cartaId),
  nombre: carta.nombre,
  imagenUrl: normalizarUrlImagen(carta.imagenUrl) ?? '',
  rareza: rarezaDesdeNombre(carta.rareza),
  categoria: categoriaCartaDesdeNombre(carta.categoria) ?? CATEGORIA_POR_DEFECTO,
  poder: carta.poder,
  costoCupon: carta.costoCupon,
  obtenida: carta.obtenida,
  cantidad: carta.cantidad,
  favorita: carta.favorita,
});

/**
 * Servicio de la vista "Álbumes" del jugador.
 *
 * Consume `ApiService` (único punto con `HttpClient` y `environment`) contra los
 * endpoints `/api/Albumes`, que ya devuelven el progreso del usuario
 * autenticado y el estado de sus cartas favoritas.
 */
@Injectable({ providedIn: 'root' })
export class AlbumesJugadorService {
  private readonly api = inject(ApiService);

  /**
   * Álbumes activos que ya tienen cartas y una marca válida, con el progreso del jugador.
   * El listado completo se carga una sola vez: el filtro por categoría y la
   * búsqueda se resuelven en el componente.
   */
  listarAlbumes(): Observable<ResumenAlbum[]> {
    return this.api
      .get<AlbumResumenApi[]>('Albumes')
      .pipe(
        map((albumes) => (albumes ?? []).filter(esAlbumConMarcaValida).map(mapearResumen)),
      );
  }

  /** Detalle de un álbum con sus cartas válidas y el estado de favoritas del jugador. */
  obtenerDetalleAlbum(id: number): Observable<DetalleAlbum> {
    return this.api.get<AlbumDetalleApi>(`Albumes/${id}`).pipe(
      map((detalle) => ({
        ...mapearResumen(detalle),
        cartas: (detalle.cartas ?? [])
          .filter((carta) => !esCartaSinMarca(carta))
          .map(mapearCarta),
      })),
    );
  }

  /** Marca una carta como "carta que quiero". Idempotente en el backend. */
  marcarFavorita(cartaId: string): Observable<void> {
    return this.api.post<void>(`CartaFavorita/${cartaId}`);
  }

  /** Desmarca una carta de "cartas que quiero". Idempotente en el backend. */
  desmarcarFavorita(cartaId: string): Observable<void> {
    return this.api.delete<void>(`CartaFavorita/${cartaId}`);
  }
}
