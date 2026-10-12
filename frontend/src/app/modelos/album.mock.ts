import { AlbumConProgreso } from "./album-progreso";
import { CARTAS_MOCK } from "./cartas.mock";

export const ALBUMES_MOCK: AlbumConProgreso[] = [
    {
        id: 1,
        nombre: 'Album 1',
        marcaNombre: 'Marca 1',
        imagenUrl: 'imagenes/grido.jpg',
        descripcion: 'Descripcion 1',
        categoria: 'Categoria 1',
        esActivo: true,
        cartas: CARTAS_MOCK,
    },
    {
        id: 2,
        nombre: 'Album 2',
        marcaNombre: 'Marca 2',
        imagenUrl: 'imagenes/grido.jpg',
        descripcion: 'Descripcion 2',
        categoria: 'Categoria 2',
        esActivo: false,
        cartas: CARTAS_MOCK,
    },
];