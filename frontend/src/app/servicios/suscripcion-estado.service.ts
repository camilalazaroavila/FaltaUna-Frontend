import { Injectable, effect, signal } from '@angular/core';
import { Plan } from '../modelos/plan.model';
import { PagoRespuesta } from '../modelos/pago.model';

const CLAVE_REFERENCIA = 'faltauna_pago_ref';

/**
 * Estado del flujo de suscripción de la empresa (pasos 1 a 5).
 * Guarda el plan elegido y la información del último pago registrado
 * a través de Mercado Pago. La referencia del pago se persiste en
 * sessionStorage para sobrevivir a un F5 durante la creación del álbum.
 */
@Injectable({ providedIn: 'root' })
export class SuscripcionEstado {
  readonly planElegido = signal<Plan | null>(null);
  readonly ultimoPago = signal<PagoRespuesta | null>(null);

  constructor() {
    effect(() => {
      const ref = this.ultimoPago()?.referenciaExterna;
      if (!ref) return;
      try {
        sessionStorage.setItem(CLAVE_REFERENCIA, ref);
      } catch {
        /* almacenamiento no disponible: se sigue en memoria */
      }
    });
  }

  /** Referencia del último pago iniciado en esta sesión del navegador, si existe. */
  referenciaGuardada(): string | null {
    try {
      return sessionStorage.getItem(CLAVE_REFERENCIA);
    } catch {
      return null;
    }
  }
}