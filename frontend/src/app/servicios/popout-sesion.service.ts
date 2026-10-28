import { Injectable } from '@angular/core';

const CLAVE = 'expoPopoutPendiente';

@Injectable({ providedIn: 'root' })
export class PopoutSesionService {
  /** Llamar cuando el login sale bien. */
  marcarPendiente(): void {
    try { sessionStorage.setItem(CLAVE, '1'); } catch { /* modo privado, etc. */ }
  }

  consumirPendiente(): boolean {
    try {
      const pendiente = sessionStorage.getItem(CLAVE) === '1';
      sessionStorage.removeItem(CLAVE);
      return pendiente;
    } catch {
      return false;
    }
  }
}