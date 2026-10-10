import { OpcionSelect } from '../compartidos/componentes/campo-select/campo-select';

/** Cantidad de cartas (imágenes) que forman el álbum de marca. */
export const CARTAS_POR_ALBUM = 12;
/** Peso máximo por imagen, en kb. */
export const MAX_KB_IMAGEN = 200;

export const REDES_SOCIALES: OpcionSelect[] = [
  { valor: 'Instagram', etiqueta: 'Instagram', icono: 'phosphorInstagramLogoFill' },
  { valor: 'Facebook', etiqueta: 'Facebook', icono: 'phosphorFacebookLogoFill' },
  { valor: 'TikTok', etiqueta: 'TikTok', icono: 'phosphorTiktokLogoFill' },
  { valor: 'Sitio web', etiqueta: 'Sitio web', icono: 'phosphorGlobeFill' },
];

export const CATEGORIAS_MARCA: OpcionSelect[] = [
  { valor: 'Cocina', etiqueta: 'Cocina', icono: 'phosphorHamburgerFill' },
  { valor: 'Indumentaria', etiqueta: 'Indumentaria', icono: 'phosphorTShirtFill' },
  { valor: 'Accesorios', etiqueta: 'Accesorios', icono: 'phosphorWatchFill' },
  { valor: 'Tecnología', etiqueta: 'Tecnología' },
  { valor: 'Cosmética', etiqueta: 'Cosmética' },
  { valor: 'Entretenimiento', etiqueta: 'Entretenimiento' },
  { valor: 'Música', etiqueta: 'Música' },
  { valor: 'Decoración', etiqueta: 'Decoración' },
];

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
  categoria: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface AlbumRespuesta {
  id: number;
  nombreMarca: string;
}