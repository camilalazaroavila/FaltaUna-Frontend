import { Injectable, signal } from '@angular/core';

export const CLAVE_TUTORIAL_COMPLETADO = 'tutorialCompletado';

@Injectable({ providedIn: 'root' })
export class ProgresoJuegoService {
  private readonly estadoTutorialCompletado = signal(this.leerTutorialGuardado());


  readonly tutorialCompletado = this.estadoTutorialCompletado.asReadonly();

  marcarTutorialCompletado(): void {
    this.estadoTutorialCompletado.set(true);
    this.guardarTutorialCompletado();
  }
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
    }
  }
}