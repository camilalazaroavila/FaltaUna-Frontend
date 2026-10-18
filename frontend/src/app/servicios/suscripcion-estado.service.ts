import { Injectable, effect, inject, signal } from '@angular/core';
import { AuthService } from '@servicios/auth.service';
import { Plan } from '@modelos/plan.model';
import { PagoRespuesta } from '@modelos/pago.model';

const CLAVE_REFERENCIA = 'faltauna_pago_ref';
const CLAVE_ALTA = 'faltauna_alta_completada';

/**
 * Estado del flujo de suscripción de la empresa (pasos 1 a 5).
 * Guarda el plan elegido y la información del último pago registrado
 * a través de Mercado Pago. La referencia del pago se persiste en
 * sessionStorage para sobrevivir a un F5 durante la creación del álbum.
 */
@Injectable({ providedIn: 'root' })
export class SuscripcionEstado {
  private readonly auth = inject(AuthService);

  readonly planElegido = signal<Plan | null>(null);
  readonly ultimoPago = signal<PagoRespuesta | null>(null);

  constructor() {
    effect(() => {
      const referencia = this.ultimoPago()?.referenciaExterna;
      if (referencia) this.recordarReferencia(referencia);
    });
  }

  /**
   * Recuerda la referencia del pago en curso para poder revalidarlo contra el
   * backend después de un F5 (lo usa `pagoAprobadoGuard`). Es idempotente.
   */
  recordarReferencia(referencia: string): void {
    try {
      sessionStorage.setItem(CLAVE_REFERENCIA, referencia);
    } catch {
      /* almacenamiento no disponible: se sigue en memoria */
    }
  }

  /** Referencia del último pago iniciado en esta sesión del navegador, si existe. */
  referenciaGuardada(): string | null {
    try {
      return sessionStorage.getItem(CLAVE_REFERENCIA);
    } catch {
      return null;
    }
  }

  altaCompletada(): boolean {
    try {
      return localStorage.getItem(this.claveAlta()) === '1';
    } catch {
      return false;
    }
  }

  /**
   * Marca el alta como completada. Se llama al crear el álbum (paso final).
   */
  marcarAltaCompletada(): void {
    try {
      localStorage.setItem(this.claveAlta(), '1');
    } catch {
      /* almacenamiento no disponible: el backend sigue siendo la fuente de verdad */
    }
  }

  /**
   * Descarta la marca local cuando el backend confirma que el alta NO está
   * completa. Evita que un id de usuario reutilizado arrastre el indicador de
   * una cuenta anterior y deje entrar a una empresa nueva.
   */
  limpiarAltaCompletada(): void {
    try {
      localStorage.removeItem(this.claveAlta());
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private claveAlta(): string {
    const id = this.auth.usuarioActual()?.id;
    return id ? `${CLAVE_ALTA}_${id}` : CLAVE_ALTA;
  }
}