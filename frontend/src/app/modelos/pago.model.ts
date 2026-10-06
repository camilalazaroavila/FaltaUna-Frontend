export type EstadoPago =
  | 'Pendiente'
  | 'Aprobado'
  | 'Rechazado'
  | 'Cancelado'
  | 'Reembolsado';

export interface PlanBackend {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  maxCartas: number;
  incluyeEstadisticas: boolean;
  masPublicidad: boolean;
  disenoPersonalizado: boolean;
}

export interface IniciarPagoSolicitud {
  planId: number;
}

export interface IniciarPagoRespuesta {
  urlPago: string;
  pago: PagoRespuesta;
}

export interface PagoRespuesta {
  referenciaExterna: string;
  estado: EstadoPago;
  puedePersonalizar: boolean;
  monto: number;
  moneda: string;
  plan: PlanBackend;
  fechaCreacion: string;
  fechaAprobacion?: string | null;
}

export interface ConfiguracionPagoRespuesta {
  publicKey: string;
}

export interface ConfirmarPagoSolicitud {
  pagoMercadoPagoId: string;
}

export type ResultadoUrlPago = 'exito' | 'pendiente' | 'error';
