import { Carta } from './carta.model';

export interface CartaDeAlbum extends Carta
{
   esFavorita: boolean;
}

export interface AlbumConProgreso
{
   readonly id: number;
   readonly nombre: string;
   readonly marcaNombre: string;
   readonly imagenUrl: string;
   readonly descripcion: string;
   readonly categoria: string;
   readonly esActivo: boolean;
   readonly cartas: readonly CartaDeAlbum[];
}

/*
 `cantidad` es siempre 1 en este endpoint: no indica tenencia, solo se usa `cartaId`.
 */
export interface CartaObtenidaRespuesta
{
   readonly cartaId: number;
   readonly nombre: string;
   readonly cantidad: number;
   readonly imagenUrl: string | null;
}  