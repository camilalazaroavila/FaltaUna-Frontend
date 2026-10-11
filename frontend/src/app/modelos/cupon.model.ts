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

/** El backend identifica el cupón del usuario por el token de su QR (no por el código del cupón). */
export interface CanjearCuponSolicitud {
  qrToken: string;
}

/** Respuesta cruda de GET /Cupones/mis-cupones. */
export interface MiCuponApi {
  cuponId: number;
  marca: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  porcentajeDescuento: number;
  fechaInicio: string;
  fechaVencimiento: string;
  estado: string;
  fechaObtencion: string;
  fechaUso: string | null;
  tieneQr: boolean;
}

/** Respuesta cruda de GET /Cupones/{cuponId}/qr. */
export interface QrCuponApi {
  cuponId: number;
  marca: string;
  nombre: string;
  porcentajeDescuento: number;
  estado: string;
  fechaVencimiento: string;
  qrToken: string;
  qrDataUrl: string;
}

/** QR ya convertido a imagen, junto con el token que lleva adentro. */
export interface QrCupon {
  imagen: Blob;
  token: string;
}

/** Respuesta cruda de POST /Cupones/empleado/canjear. */
export interface CanjeApi {
  exitoso: boolean;
  mensaje: string;
  fechaUso: string;
  cupon: { id: number; marca: string; nombre: string; descuento: number };
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

/** Respuesta cruda de POST /Cupones/empleado/validar-qr (no consume el cupón). */
export interface ValidarQrApi {
  valido: boolean;
  mensaje: string;
  cupon: {
    id: number;
    marca: string;
    nombre: string;
    descripcion: string | null;
    descuento: number;
    codigo: string;
    vencimiento: string;
    usuario: string;
  };
}

/** Cupón verificado por el empleado, a la espera de confirmar el canje. */
export interface CuponValidado {
  marca: string;
  titulo: string;
  descripcion: string;
  descuento: number;
  codigo: string;
  vencimientoUtc: string;
  usuario: string;
}