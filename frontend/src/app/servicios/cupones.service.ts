import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CanjeExitosoRespuesta,
  CanjearCuponSolicitud,
  CuponDescuento,
} from '../modelos/cupon.model';

@Injectable({
  providedIn: 'root',
})
export class CuponesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Cupones del usuario logueado. */
  obtenerMisCupones(): Observable<CuponDescuento[]> {
    return this.http.get<CuponDescuento[]>(`${this.apiUrl}/Cupones/mis-cupones`);
  }

  /**
   * Imagen PNG del QR del cupón. Se pide como Blob (y no con un <img src>) para que
   * el interceptor agregue el JWT, ya que el endpoint está protegido.
   */
  obtenerQr(codigo: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/Cupones/${encodeURIComponent(codigo)}/qr`, {
      responseType: 'blob',
    });
  }

  /** Rol Empleado: valida y consume el cupón. Los rechazos llegan como HttpErrorResponse. */
  canjear(codigo: string): Observable<CanjeExitosoRespuesta> {
    const solicitud: CanjearCuponSolicitud = { codigo };
    return this.http.post<CanjeExitosoRespuesta>(`${this.apiUrl}/Cupones/canjear`, solicitud);
  }
}