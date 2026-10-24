import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  AbrirSobreSolicitud,
  AperturaSobreRespuesta,
  EstadoSobreDiarioRespuesta,
  SobreRespuesta,
} from '@modelos/sobre.model';

export interface SobresDisponiblesEstado {
  readonly actuales: number;
  readonly maximo: number;
}

@Injectable({
  providedIn: 'root',
})
export class SobresService {
  private readonly api = inject(ApiService);

  private readonly _sobresDisponibles = signal<SobresDisponiblesEstado>({
    actuales: 0,
    maximo: 2,
  });
  readonly sobresDisponibles = this._sobresDisponibles.asReadonly();

  /** Obtiene el catálogo completo de sobres disponibles del backend */
  obtenerSobres(): Observable<SobreRespuesta[]> {
    return this.api.get<SobreRespuesta[]>('Sobres');
  }

  /** Obtiene el estado de sobres diarios del backend */
  obtenerEstadoDiario(usuarioId: number): Observable<EstadoSobreDiarioRespuesta> {
    return this.api.get<EstadoSobreDiarioRespuesta>(`Sobres/diario/${usuarioId}`).pipe(
      tap((estado) => {
        this._sobresDisponibles.set({
          actuales: estado.cargasDisponibles,
          maximo: estado.cargasMaximas,
        });
      }),
    );
  }

  /** Actualiza el estado de sobres diarios desde el backend */
  cargarEstadoDiario(usuarioId: number): Observable<EstadoSobreDiarioRespuesta> {
    return this.obtenerEstadoDiario(usuarioId);
  }

  /** Abre un sobre específico por su ID */
  abrirSobre(sobreId: number, usuarioId: number): Observable<AperturaSobreRespuesta> {
    const cuerpo: AbrirSobreSolicitud = { usuarioId };
    return this.api.post<AperturaSobreRespuesta>(`Sobres/${sobreId}/abrir`, cuerpo);
  }

  /** Reclama y abre el sobre diario gratuito del usuario */
  reclamarSobreDiario(usuarioId: number): Observable<AperturaSobreRespuesta> {
    const cuerpo: AbrirSobreSolicitud = { usuarioId };
    return this.api.post<AperturaSobreRespuesta>('Sobres/diario', cuerpo).pipe(
      tap(() => {
        // El estado se refrescará desde el componente tras la apertura
      }),
    );
  }
}
