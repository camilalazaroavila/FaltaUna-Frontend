import { OpcionSelect } from '../compartidos/componentes/campo-select/campo-select';

/** Cantidad de cartas (imágenes) que forman el álbum de marca. Debe coincidir con el backend (CrearColeccion). */
export const CARTAS_POR_ALBUM = 2;
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

/** Datos que se envían al backend para crear el álbum (paso 3 + paso 4). */
export interface CrearAlbumSolicitud {
  referenciaPago: string;
  nombreMarca: string;
  logo: File;
  imagenes: File[];
  descripcion: string;
  redSocial: string;
  usuarioRedSocial: string;
  emailContacto: string;
  categoriaId: number;
  fechaInicio: string;
  fechaFin: string;
}

/** Colección creada (`POST /api/Colecciones`). */
export interface AlbumRespuesta {
  id: number;
  nombre: string;
  marcaId: number;
  marcaNombre: string;
}