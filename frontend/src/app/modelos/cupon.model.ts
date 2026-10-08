export type EstadoCupon = 'Disponible' | 'Usado' | 'Vencido';

export type CategoriaCupon =
  | 'gastronomia'
  | 'deco'
  | 'cosmetica'
  | 'indumentaria'
  | 'entretenimiento'
  | 'musica'
  | 'tecnologia';

/** Cupón de descuento de una marca (distinto del "cupón" como recurso de juego). */
export interface CuponDescuento {
  id: number;
  marca: string;
  categoria: CategoriaCupon;
  titulo: string;
  descripcion: string;
  detalles: string;
  /** Código XXXX-XXXX-XXXX. Es lo que contiene el QR. */
  codigo: string;
  vigenteHastaUtc: string;
  estado: EstadoCupon;
}

export interface CanjearCuponSolicitud {
  codigo: string;
}

export interface CanjeExitosoRespuesta {
  marca: string;
  titulo: string;
  descripcion: string;
  fechaCanjeUtc: string;
}

export type MotivoCanjeError = 'no_existe' | 'vencido' | 'usado';

export interface CanjeErrorRespuesta {
  motivo: MotivoCanjeError;
  mensaje: string;
}