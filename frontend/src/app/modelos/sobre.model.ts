export type TipoSobre = 'GENERAL' | 'CATEGORIA' | 'MARCA';

export interface SobreRespuesta {
  readonly id: number;
  readonly nombre: string;
  readonly tipo: TipoSobre;
  readonly precio: number;
  readonly cantidadCartas: number;
  readonly categoria?: string | null;
  readonly coleccion?: string | null;
  readonly marca?: string | null;
}

export interface CartaObtenidaRespuesta {
  readonly cartaId: number;
  readonly nombre: string;
  readonly cantidad: number;
  readonly imagenUrl?: string | null;
}

export interface AperturaSobreRespuesta {
  readonly id: number;
  readonly sobreId: number;
  readonly fecha: string;
  readonly cartas: readonly CartaObtenidaRespuesta[];
}

export interface AbrirSobreSolicitud {
  readonly usuarioId: number;
}

export interface SobreItemUI {
  readonly id: number | 'diario';
  readonly nombre: string;
  readonly etiqueta: string;
  readonly tipo: TipoSobre;
  readonly precio: number;
  readonly cantidadCartas: number;
  readonly urlImagen: string;
  readonly esDiario: boolean;
  readonly disponible: boolean;
}
