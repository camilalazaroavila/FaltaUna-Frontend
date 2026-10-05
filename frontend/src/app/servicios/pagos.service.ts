import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ConfiguracionPagoRespuesta,
  ConfirmarPagoSolicitud,
  IniciarPagoRespuesta,
  IniciarPagoSolicitud,
  PagoRespuesta,
} from '../modelos/pago.model';

@Injectable({
  providedIn: 'root',
})
export class PagosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Obtiene la clave pública de Mercado Pago configurada en el backend.
   */
  obtenerConfiguracion(): Observable<ConfiguracionPagoRespuesta> {
    return this.http.get<ConfiguracionPagoRespuesta>(
      `${this.apiUrl}/Pagos/configuracion`,
    );
  }

  /**
   * Inicia el flujo de suscripción para un plan creando la preferencia en Mercado Pago.
   * Devuelve la URL de Checkout Pro (init_point) y la entidad Pago en estado Pendiente.
   */
  iniciarPago(planId: number): Observable<IniciarPagoRespuesta> {
    const solicitud: IniciarPagoSolicitud = { planId };
    return this.http.post<IniciarPagoRespuesta>(
      `${this.apiUrl}/Pagos`,
      solicitud,
    );
  }

  /**
   * Consulta el estado de un pago según su referencia externa.
   */
  obtenerPago(referenciaExterna: string): Observable<PagoRespuesta> {
    return this.http.get<PagoRespuesta>(
      `${this.apiUrl}/Pagos/${encodeURIComponent(referenciaExterna)}`,
    );
  }

  /**
   * Confirma y sincroniza el pago consultando a la API de Mercado Pago con el payment_id.
   * Plan B de webhook cuando el usuario retorna al frontend.
   */
  confirmarPago(
    referenciaExterna: string,
    pagoMercadoPagoId: string,
  ): Observable<PagoRespuesta> {
    const solicitud: ConfirmarPagoSolicitud = { pagoMercadoPagoId };
    return this.http.post<PagoRespuesta>(
      `${this.apiUrl}/Pagos/${encodeURIComponent(referenciaExterna)}/confirmar`,
      solicitud,
    );
  }

  /**
   * Redirige al checkout oficial de Mercado Pago.
   */
  redirigirACheckout(urlPago: string): void {
    if (urlPago) {
      window.location.assign(urlPago);
    }
  }
}
