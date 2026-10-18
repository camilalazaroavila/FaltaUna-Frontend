import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AbrirSobreSolicitud,
  AperturaSobreRespuesta,
  SobreRespuesta,
} from '@modelos/sobre.model';

export interface SobresDisponiblesEstado {
  readonly actuales: number;
  readonly maximo: number;
}

const CLAVE_SOBRES_DISPONIBLES = 'faltauna_sobres_disponibles';
const ESTADO_INICIAL_SOBRES: SobresDisponiblesEstado = {
  actuales: 2,
  maximo: 2,
};

@Injectable({
  providedIn: 'root',
})
export class SobresService {
  private readonly api = inject(ApiService);

  private readonly _sobresDisponibles = signal<SobresDisponiblesEstado>(
    this.obtenerSobresIniciales(),
  );
  readonly sobresDisponibles = this._sobresDisponibles.asReadonly();

  /** Descuenta un sobre gratuito y persiste el estado */
  consumirSobreGratuito(): void {
    this._sobresDisponibles.update((estado) => {
      const nuevo = {
        ...estado,
        actuales: Math.max(0, estado.actuales - 1),
      };
      this.guardarSobresEnStorage(nuevo);
      return nuevo;
    });
  }

  /** Restablece los sobres gratuitos a 2/2 */
  restablecerSobresGratuitos(): void {
    this._sobresDisponibles.set(ESTADO_INICIAL_SOBRES);
    this.guardarSobresEnStorage(ESTADO_INICIAL_SOBRES);
  }

  private obtenerSobresIniciales(): SobresDisponiblesEstado {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const guardado = localStorage.getItem(CLAVE_SOBRES_DISPONIBLES);
        if (guardado) {
          const parsed = JSON.parse(guardado);
          if (typeof parsed?.actuales === 'number' && typeof parsed?.maximo === 'number') {
            return parsed;
          }
        }
      }
    } catch {
      // Ignorar fallos de acceso a localStorage
    }
    return ESTADO_INICIAL_SOBRES;
  }

  private guardarSobresEnStorage(estado: SobresDisponiblesEstado): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CLAVE_SOBRES_DISPONIBLES, JSON.stringify(estado));
      }
    } catch {
      // Ignorar fallos de acceso a localStorage
    }
  }

  /** Obtiene el catálogo completo de sobres disponibles del backend */
  obtenerSobres(): Observable<SobreRespuesta[]> {
    return this.api.get<SobreRespuesta[]>('Sobres');
  }

  /** Abre un sobre específico por su ID */
  abrirSobre(sobreId: number, usuarioId: number): Observable<AperturaSobreRespuesta> {
    const cuerpo: AbrirSobreSolicitud = { usuarioId };
    return this.api.post<AperturaSobreRespuesta>(`Sobres/${sobreId}/abrir`, cuerpo);
  }

  /** Reclama y abre el sobre diario gratuito del usuario */
  reclamarSobreDiario(usuarioId: number): Observable<AperturaSobreRespuesta> {
    const cuerpo: AbrirSobreSolicitud = { usuarioId };
    return this.api.post<AperturaSobreRespuesta>('Sobres/diario', cuerpo);
  }
}
