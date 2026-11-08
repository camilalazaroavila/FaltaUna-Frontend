import urlIconPelea from '@svgs/IconPelea.svg';
import urlIconoMisCartas from '@svgs/Icon_misCartas.svg';
import urlIconoAlbum from '@svgs/Icon_Album.svg';
import urlIconoIntercambio from '@svgs/Icon_Intercambio.svg';
import urlIconoDescuento from '@svgs/Icon_Descuento.svg';
import urlIconoQr from '@svgs/Icon_Qr.svg';

export interface DestinoNavegacionOla {
  readonly id: string;
  readonly etiqueta: string;
  readonly ruta?: string;
  readonly rutasCoincidentes?: readonly string[];
  readonly icono?: string;
  readonly urlIcono?: string;
  readonly esIconoMulticolor?: boolean;
  readonly deshabilitado?: boolean;
  readonly tieneIndicador?: boolean;
}

/**
 * Fuente única de los 6 destinos reales de Falta Una para ambas orientaciones
 * (mobile y desktop).
 */
export const DESTINOS_NAVEGACION_OLA: readonly DestinoNavegacionOla[] = [
  {
    id: 'cartas',
    etiqueta: 'Mis cartas',
    ruta: '/usuario/mis-cartas',
    rutasCoincidentes: ['/usuario/mis-cartas', '/usuario/mi-baraja'],
    urlIcono: urlIconoMisCartas,
  },
  {
    id: 'misiones',
    etiqueta: 'Misiones',
    ruta: '/usuario/misiones',
    rutasCoincidentes: ['/usuario/misiones'],
    icono: 'phosphorTrophyFill',
  },
  {
    id: 'albumes',
    etiqueta: 'Álbumes',
    ruta: '/usuario/albumes',
    rutasCoincidentes: ['/usuario/albumes'],
    urlIcono: urlIconoAlbum,
  },
  {
    id: 'intercambios',
    etiqueta: 'Intercambio',
    ruta: '/usuario/intercambio',
    rutasCoincidentes: ['/usuario/intercambio'],
    urlIcono: urlIconoIntercambio,
  },
  {
    id: 'qr',
    etiqueta: 'Canje',
    urlIcono: urlIconoQr,
    deshabilitado: true,
  },
  {
    id: 'cupones',
    etiqueta: 'Mis cupones',
    ruta: '/usuario/cupones',
    rutasCoincidentes: ['/usuario/cupones'],
    urlIcono: urlIconoDescuento,
  },
];

/**
 * Acción principal Jugar: ícono de pelea (`IconPelea.svg`).
 */
export const ACCION_JUGAR_OLA: DestinoNavegacionOla = {
  id: 'jugar',
  etiqueta: 'Jugar',
  ruta: '/usuario/jugar',
  rutasCoincidentes: ['/usuario/jugar', '/juego/ia', '/juego/jugador', '/juego/tutorial'],
  urlIcono: urlIconPelea,
  esIconoMulticolor: true,
};

