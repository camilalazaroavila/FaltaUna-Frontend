import { Injectable, signal } from '@angular/core';
import { Plan } from '../modelos/plan.model';
import { PagoRespuesta } from '../modelos/pago.model';

/**
 * Estado del flujo de suscripción de la empresa (pasos 1 a 5).
 * Guarda el plan elegido y la información del último pago registrado
 * a través de Mercado Pago.
 */
@Injectable({ providedIn: 'root' })
export class SuscripcionEstado {
  readonly planElegido = signal<Plan | null>(null);
  readonly ultimoPago = signal<PagoRespuesta | null>(null);
}
