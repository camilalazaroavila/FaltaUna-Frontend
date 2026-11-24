
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstadisticasEmpresaRespuesta } from '@app/paginas/empresa-estadisticas/empresa-estadisticas';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })

export class EstadisticasEmpresaService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/EstadisticasEmpresa`;


    obtenerEstadisticas(marcaId?: number): Observable<EstadisticasEmpresaRespuesta> {
        return this.http.get<EstadisticasEmpresaRespuesta>(`${this.apiUrl}/estadisticas`, {
            params: marcaId != null ? { marcaId: String(marcaId) } : {},
        });

    }

}
