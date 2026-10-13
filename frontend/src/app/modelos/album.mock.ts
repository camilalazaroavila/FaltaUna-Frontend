import { AlbumConProgreso, CartaDeAlbum } from './album-progreso';
import { Carta } from './carta.model';
import { CARTAS_MOCK } from './cartas.mock';

const comoCartaDeAlbum = (carta: Carta): CartaDeAlbum => ({ ...carta, esFavorita: false });


export const ALBUMES_MOCK: AlbumConProgreso[] = [
    {
        id: 1,
        nombre: 'Grido',
         marcaNombre: 'Grido',
        imagenUrl: 'imagenes/grido.jpg',
        descripcion: 'Ejemplo de album de Grido',
        categoria: 'gastronomia',
        esActivo: true,
        cartas: CARTAS_MOCK.filter((c) => c.categoria === 'gastronomia').map(comoCartaDeAlbum),
    },
    {
        id: 2,
        nombre: 'Zara',
        marcaNombre: 'Zara',
        imagenUrl: 'imagenes/zara.png',
        descripcion: 'Ejemplo de album de Zara',
        categoria: 'indumentaria',
        esActivo: false,
        cartas: CARTAS_MOCK.filter((c) => c.categoria === 'indumentaria').map(comoCartaDeAlbum),
    },
];