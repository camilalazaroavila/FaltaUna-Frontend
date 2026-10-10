import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  AbrirSobreSolicitud,
  AperturaSobreRespuesta,
  SobreRespuesta,
} from '../modelos/sobre.model';

@Injectable({
  providedIn: 'root',
})
export class SobresService {
  private readonly api = inject(ApiService);

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
