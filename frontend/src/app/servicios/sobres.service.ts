import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AbrirSobreSolicitud,
  AperturaSobreRespuesta,
  SobreRespuesta,
} from '../modelos/sobre.model';

@Injectable({
  providedIn: 'root',
})
export class SobresService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/Sobres`;

  /** Obtiene el catálogo completo de sobres disponibles del backend */
  obtenerSobres(): Observable<SobreRespuesta[]> {
    return this.http.get<SobreRespuesta[]>(this.apiUrl);
  }

  /** Abre un sobre específico por su ID */
  abrirSobre(sobreId: number, usuarioId: number): Observable<AperturaSobreRespuesta> {
    const cuerpo: AbrirSobreSolicitud = { usuarioId };
    return this.http.post<AperturaSobreRespuesta>(`${this.apiUrl}/${sobreId}/abrir`, cuerpo);
  }

  /** Reclama y abre el sobre diario gratuito del usuario */
  reclamarSobreDiario(usuarioId: number): Observable<AperturaSobreRespuesta> {
    const cuerpo: AbrirSobreSolicitud = { usuarioId };
    return this.http.post<AperturaSobreRespuesta>(`${this.apiUrl}/diario`, cuerpo);
  }
}
