import { Injectable, signal } from '@angular/core';
import { Plan } from '../modelos/plan.model';

/**
 * Estado del flujo de suscripción de la empresa (pasos 1 a 5).
 * Por ahora solo guarda el plan elegido; los pasos siguientes (marca, pago,
 * colección) van a sumar más datos acá.
 */
@Injectable({ providedIn: 'root' })
export class SuscripcionEstado {
  readonly planElegido = signal<Plan | null>(null);
}
