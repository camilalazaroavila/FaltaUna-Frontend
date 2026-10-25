import { Injectable, signal } from '@angular/core';

export const CLAVE_TUTORIAL_COMPLETADO = 'tutorialCompletado';

@Injectable({ providedIn: 'root' })
export class ProgresoJuegoService {
  private readonly estadoTutorialCompletado = signal(this.leerTutorialGuardado());

  /** `true` cuando el jugador ya terminó el tutorial y puede jugar contra otros jugadores. */
  readonly tutorialCompletado = this.estadoTutorialCompletado.asReadonly();

  /** Hay que llamarlo cuando el jugador termina el tutorial. */
  marcarTutorialCompletado(): void {
    this.estadoTutorialCompletado.set(true);
    this.guardarTutorialCompletado();
  }

  // TODO: el progreso real tiene que venir del backend. El localStorage es un reemplazo
  // temporal que permite ver los dos estados del menú mientras no exista el tutorial.
  private leerTutorialGuardado(): boolean {
    try {
      return localStorage.getItem(CLAVE_TUTORIAL_COMPLETADO) === 'true';
    } catch {
      return false;
    }
  }

  private guardarTutorialCompletado(): void {
    try {
      localStorage.setItem(CLAVE_TUTORIAL_COMPLETADO, 'true');
    } catch {
      // Sin almacenamiento disponible (por ejemplo, ventana privada): queda solo en memoria.
    }
  }
}