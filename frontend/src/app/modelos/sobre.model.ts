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
  /** Logo de la marca (`marca.LogoUrl`). Opcional: si el backend aún no lo envía, se usa el mapa provisorio del flujo. */
  readonly logoUrl?: string | null;
}

export interface CartaObtenidaRespuesta {
  readonly cartaId: number;
  readonly nombre: string;
  readonly cantidad: number;
  readonly imagenUrl?: string | null;
  readonly rareza?: string | null;
  readonly poder?: number | null;
  readonly costoMana?: number | null;
  readonly categoria?: string | null;
  readonly marca?: string | null;
  readonly marcaNombre?: string | null;
  readonly marcaId?: number | null;
  readonly coleccionId?: number | null;
  readonly coleccionActiva?: boolean | null;
}

export interface EstadoSobreDiarioRespuesta {
  readonly cargasDisponibles: number;
  readonly cargasMaximas: number;
  readonly proximaRecarga?: string | null;
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

/**
 * Sobre listo para mostrar. Ya no lleva `urlImagen`: el aspecto lo dibuja
 * `app-sobre-marca` a partir de `tipo`, `categoria`, `marca` y `logoUrl`.
 */
export interface SobreItemUI {
  readonly id: number | string;
  readonly nombre: string;
  readonly etiqueta: string;
  readonly tipo: TipoSobre;
  readonly precio: number;
  readonly cantidadCartas: number;
  readonly esDiario: boolean;
  readonly disponible: boolean;
  readonly categoria?: string | null;
  readonly marca?: string | null;
  readonly logoUrl?: string | null;
  abierto?: boolean;
}
