import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import type { ConfiguracionExpo, SobreResumen } from '@modelos/expo.model';

@Injectable({ providedIn: 'root' })
export class ExpoService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/expo`;
  private readonly sobresUrl = `${environment.apiUrl}/Sobres`;

  /** GET /api/expo/sobre-regalo */
  obtenerConfiguracion(): Observable<ConfiguracionExpo> {
    return this.http.get<ConfiguracionExpo>(`${this.apiUrl}/sobre-regalo`);
  }

  /** PUT /api/expo/sobre-regalo */
  cambiarSobreRegalo(
    sobreRegaloId: number | null,
    activo: boolean,
  ): Observable<ConfiguracionExpo> {
    return this.http.put<ConfiguracionExpo>(`${this.apiUrl}/sobre-regalo`, {
      sobreRegaloId,
      activo,
    });
  }

  /** GET /api/Sobres: confirmá la ruta y la forma de la respuesta en SobresController. */
  obtenerSobres(): Observable<SobreResumen[]> {
    return this.http.get<SobreResumen[]>(this.sobresUrl);
  }
}
