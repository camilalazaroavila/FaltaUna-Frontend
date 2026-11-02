import { Injectable, computed, signal } from '@angular/core';
import { PASOS_TUTORIAL } from './tutorial.pasos';
import type { EventoTutorial, PasoTutorial } from './tutorial.model';

/**
 * Estado del tutorial guiado de la partida.
 *
 * No conoce el tablero ni la partida: solo avanza por el guion y espera que
 * quien lo consume llame a `notificar()` cuando el jugador completa la acción
 * pedida. El overlay y la página del tutorial son los únicos consumidores.
 */
@Injectable({ providedIn: 'root' })
export class TutorialServicio {
  private readonly indiceSignal = signal(0);
  private readonly activoSignal = signal(false);
  private readonly completadoSignal = signal(false);
  private readonly eventoSignal = signal<EventoTutorial | null>(null);
  private readonly accionIniciadaSignal = signal(false);

  readonly pasos = PASOS_TUTORIAL;
  readonly total = PASOS_TUTORIAL.length;
  readonly indice = this.indiceSignal.asReadonly();
  readonly activo = this.activoSignal.asReadonly();
  readonly completado = this.completadoSignal.asReadonly();
  readonly paso = computed<PasoTutorial>(() => this.pasos[this.indiceSignal()]);
  readonly esPrimero = computed(() => this.indiceSignal() === 0);
  readonly esUltimo = computed(() => this.indiceSignal() === this.total - 1);
  /** Marca si la acción del paso actual ha comenzado (ej. popup de carta abierto). */
  readonly accionIniciada = this.accionIniciadaSignal.asReadonly();

  /** `true` si el paso no pide acción o si la acción ya se completó. */
  readonly esperaCumplida = computed(() => {
    const espera = this.paso().espera;
    if (!espera) {
      return true;
    }
    const evento = this.eventoSignal();
    if (!evento) {
      return false;
    }
    return (
      espera === evento ||
      (espera === 'carta-jugada' && evento === 'jugar-carta') ||
      (espera === 'jugar-carta' && evento === 'carta-jugada') ||
      (espera === 'turno-finalizado' && evento === 'finalizar-turno') ||
      (espera === 'finalizar-turno' && evento === 'turno-finalizado')
    );
  });

  iniciar(): void {
    this.indiceSignal.set(0);
    this.eventoSignal.set(null);
    this.accionIniciadaSignal.set(false);
    this.completadoSignal.set(false);
    this.activoSignal.set(true);
  }

  siguiente(): void {
    if (!this.activoSignal() || !this.esperaCumplida()) {
      return;
    }

    if (this.esUltimo()) {
      this.completar();
      return;
    }

    this.indiceSignal.update((indice) => indice + 1);
    this.eventoSignal.set(null);
    this.accionIniciadaSignal.set(false);
  }

  atras(): void {
    if (!this.activoSignal() || this.esPrimero()) {
      return;
    }

    this.indiceSignal.update((indice) => indice - 1);
    this.eventoSignal.set(null);
    this.accionIniciadaSignal.set(false);
  }

  /** Marca el inicio de la acción del paso (ej: abrir popup de carta o arrastrar). */
  iniciarAccion(): void {
    if (!this.activoSignal()) {
      return;
    }
    this.accionIniciadaSignal.set(true);
  }

  /** Cancela o revierte el inicio de la acción si el usuario la interrumpió. */
  cancelarAccion(): void {
    if (!this.activoSignal()) {
      return;
    }
    this.accionIniciadaSignal.set(false);
  }

  /** Avisa que el jugador completó una acción del tablero. */
  notificar(evento: EventoTutorial): void {
    if (!this.activoSignal()) {
      return;
    }

    const espera = this.paso().espera;
    const coincide =
      espera === evento ||
      (espera === 'carta-jugada' && evento === 'jugar-carta') ||
      (espera === 'jugar-carta' && evento === 'carta-jugada') ||
      (espera === 'turno-finalizado' && evento === 'finalizar-turno') ||
      (espera === 'finalizar-turno' && evento === 'turno-finalizado');

    if (!coincide) {
      return;
    }

    this.eventoSignal.set(espera ?? evento);
  }

  completar(): void {
    this.activoSignal.set(false);
    this.completadoSignal.set(true);
    this.accionIniciadaSignal.set(false);
  }

  salir(): void {
    this.activoSignal.set(false);
    this.accionIniciadaSignal.set(false);
  }
}
