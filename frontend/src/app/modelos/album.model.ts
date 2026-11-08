import { OpcionSelect } from '@compartidos/componentes/controles/campo-select/campo-select';

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

/** Rareza tal como la devuelve `GET /api/empresa/albumes/rarezas`. */
export interface RarezaApi {
  id: number;
  nombre: string;
  descripcion: string | null;
  orden: number;
  colorFrame: string | null;
}

/** Cupón de la marca (paso 4). Va a `PUT /api/empresa/albumes/{id}/cupon`. */
export interface CuponBorradorSolicitud {
  nombre: string;
  descripcion: string;
  porcentajeDescuento: number;
  /** ISO con hora, ej. `2026-12-01T00:00:00`. */
  fechaInicio: string;
  /** ISO con hora, ej. `2026-12-31T23:59:59`. */
  fechaVencimiento: string;
}

/** Datos comunes del borrador (pasos 2 a 4). Los nombres coinciden con `CrearBorradorAlbumSolicitud` del back. */
export interface DatosBorradorAlbum {
  nombreMarca: string;
  descripcion: string;
  emailContacto: string;
  redSocial: string;
  usuarioRedSocial: string;
  categoriaId: number;
  /** `YYYY-MM-DD` */
  fechaInicio: string;
  /** `YYYY-MM-DD` */
  fechaFin: string;
  logo: File;
  fotoLocal: File;
}

/** `POST /api/empresa/albumes/borrador`: el plan viaja acá (paso 1) y el pago recién se hace al final. */
export interface CrearBorradorSolicitud extends DatosBorradorAlbum {
  planId: number;
  imagenes: File[];
  /** Id de rareza (del back) de cada imagen, en el mismo orden que `imagenes`. */
  rarezaIds: number[];
}

export interface ImagenBorradorRespuesta {
  id: number;
  imagenUrl: string;
  descripcion: string | null;
  rarezaId: number | null;
  rarezaNombre: string | null;
  rarezaColorFrame: string | null;
}

export interface CuponBorradorRespuesta {
  id: number;
  nombre: string;
  descripcion: string | null;
  codigo: string;
  porcentajeDescuento: number;
  fechaInicio: string;
  fechaVencimiento: string;
}

/** Álbum de la empresa en el flujo nuevo (`AlbumEmpresaRespuesta` del back). Estado: Borrador | Publicado. */
export interface AlbumBorradorRespuesta {
  id: number;
  estado: 'Borrador' | 'Publicado';
  puedeEditarContenido: boolean;
  listoParaPagar: boolean;
  nombre: string;
  descripcion: string | null;
  marcaId: number;
  marcaNombre: string;
  marcaEmailContacto: string;
  marcaRedesSociales: string | null;
  categoriaId: number;
  categoriaNombre: string | null;
  logoUrl: string | null;
  fotoLocalUrl: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  imagenes: ImagenBorradorRespuesta[];
  cupon: CuponBorradorRespuesta | null;
}

/** Imagen individual de la colección/álbum devuelta por la API. */
export interface ImagenAlbumRespuesta {
  id: number;
  imagenUrl: string;
  descripcion: string | null;
}

/**
 * Álbum devuelto por la API (`GET /api/Colecciones/mis-colecciones`).
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