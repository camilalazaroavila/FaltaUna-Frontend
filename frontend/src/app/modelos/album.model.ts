import { OpcionSelect } from '@compartidos/componentes/controles/campo-select/campo-select';
import type { RarezaCarta } from '@modelos/carta.model';

/** Casillas de imagen que se muestran en el álbum de marca (máximo permitido). */
export const CARTAS_POR_ALBUM = 12;
/** Tope visual de casillas en la grilla (el plan Premium llega a 30 cartas). */
export const TOPE_CARTAS_ALBUM = 30;
/** Mínimo de imágenes que hay que cargar para poder continuar. Debe coincidir con el backend (CrearColeccion). */
export const MINIMO_IMAGENES = 2;
/** Peso máximo por imagen, en kb. */
export const MAX_KB_IMAGEN = 200;

export const REDES_SOCIALES: OpcionSelect[] = [
  { valor: 'Instagram', etiqueta: 'Instagram', icono: 'phosphorInstagramLogoFill' },
  { valor: 'Facebook', etiqueta: 'Facebook', icono: 'phosphorFacebookLogoFill' },
  { valor: 'TikTok', etiqueta: 'TikTok', icono: 'phosphorTiktokLogoFill' },
  { valor: 'Sitio web', etiqueta: 'Sitio web', icono: 'phosphorGlobeFill' },
];

/**
 * Categorías de respaldo si `GET /api/Categorias` no responde (backend sin ese endpoint).
 * Los ids son los del seed `01_catalogo.sql` (Comida, Ropa): verificá que coincidan con tu tabla `categoria`.
 */
export const CATEGORIAS_RESPALDO: CategoriaApi[] = [
  { id: 1, nombre: 'Comida' },
  { id: 2, nombre: 'Ropa' },
];

/** Categoría de marca tal como la devuelve `GET /api/Categorias`. */
export interface CategoriaApi {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

/** Cupón de descuento que la marca crea en el paso 4 del alta. */
export interface CuponAlbumSolicitud {
  nombre: string;
  descripcion: string;
  porcentajeDescuento: number;
}

/** Datos que se envían al backend para crear el álbum (pasos 2 a 5 del alta). */
export interface CrearAlbumSolicitud {
  referenciaPago: string;
  nombreMarca: string;
  nombreColeccion?: string;
  logo: File;
  fotoLocal: File;
  imagenes: File[];
  /** Rareza elegida para cada imagen, en el mismo orden que `imagenes`. */
  rarezas: RarezaCarta[];
  cupon: CuponAlbumSolicitud;
  descripcion: string;
  redSocial: string;
  usuarioRedSocial: string;
  emailContacto: string;
  categoriaId: number;
  fechaInicio: string;
  fechaFin: string;
}

/** Imagen individual de la colección/álbum devuelta por la API. */
export interface ImagenAlbumRespuesta {
  id: number;
  imagenUrl: string;
  descripcion: string | null;
}

/**
 * Álbum devuelto por la API (`POST /api/Colecciones` o `GET /api/Colecciones/mis-colecciones`).
 * Mantiene el nombre 'AlbumRespuesta' en el frontend pero mapea con la estructura del backend.
 */
export interface AlbumRespuesta {
  id: number;
  nombre: string;
  descripcion: string;
  marcaId: number;
  marcaNombre: string;
  marcaLogoUrl: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  imagenesAlbum: ImagenAlbumRespuesta[];
}