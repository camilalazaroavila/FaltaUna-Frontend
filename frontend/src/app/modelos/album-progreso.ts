import { Carta } from "./carta.model";

export interface CartaDeAlbum extends Carta{}

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

export interface CartaObtenidaRespuesta
{
   readonly cartaId: number;
   readonly nombre: string;
   readonly cantidad: number;
   readonly imagenUrl: string | null;
}  