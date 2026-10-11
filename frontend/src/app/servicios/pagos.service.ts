import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
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
  private readonly api = inject(ApiService);

  /**
   * Obtiene la clave pública de Mercado Pago configurada en el backend.
   */
  obtenerConfiguracion(): Observable<ConfiguracionPagoRespuesta> {
    return this.api.get<ConfiguracionPagoRespuesta>('Pagos/configuracion');
  }

  /**
   * Inicia el flujo de suscripción para un plan creando la preferencia en Mercado Pago.
   * Devuelve la URL de Checkout Pro (init_point) y la entidad Pago en estado Pendiente.
   */
  iniciarPago(planId: number): Observable<IniciarPagoRespuesta> {
    const solicitud: IniciarPagoSolicitud = { planId };
    return this.api.post<IniciarPagoRespuesta>('Pagos', solicitud);
  }

  /**
   * Consulta el estado de un pago según su referencia externa.
   */
  obtenerPago(referenciaExterna: string): Observable<PagoRespuesta> {
    return this.api.get<PagoRespuesta>(`Pagos/${encodeURIComponent(referenciaExterna)}`);
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
    return this.api.post<PagoRespuesta>(
      `Pagos/${encodeURIComponent(referenciaExterna)}/confirmar`,
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
