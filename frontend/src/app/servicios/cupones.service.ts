import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CanjeApi,
  CanjeExitosoRespuesta,
  CanjearCuponSolicitud,
  CategoriaCupon,
  CuponDescuento,
  CuponValidado,
  EstadoCupon,
  MiCuponApi,
  QrCupon,
  QrCuponApi,
  ValidarQrApi,
} from '../modelos/cupon.model';

/**
 * El backend todavía no manda la categoría del cupón, así que se deduce de la marca.
 * Una marca que no esté acá cae en 'gastronomia'.
 */
const CATEGORIA_POR_MARCA: Record<string, CategoriaCupon> = {
  'mcdonald\'s': 'gastronomia',
  'burger king': 'gastronomia',
  mostaza: 'gastronomia',
  grido: 'gastronomia',
  freddo: 'gastronomia',
  havanna: 'gastronomia',
  'levi\'s': 'indumentaria',
  zara: 'indumentaria',
  adidas: 'indumentaria',
  nike: 'indumentaria',
  hoyts: 'entretenimiento',
  cinemark: 'entretenimiento',
  samsung: 'tecnologia',
  musimundo: 'tecnologia',
};

@Injectable({
  providedIn: 'root',
})
export class CuponesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Cupones del usuario logueado (rol Usuario). */
  obtenerMisCupones(): Observable<CuponDescuento[]> {
    return this.http
      .get<MiCuponApi[]>(`${this.apiUrl}/Cupones/mis-cupones`)
      .pipe(map((cupones) => cupones.map((c) => this.aCuponDescuento(c))));
  }

  /**
   * QR del cupón. El backend lo devuelve como JSON (data URL + token); acá se convierte
   * en imagen para que la pantalla lo muestre y se descargue como siempre.
   */
  obtenerQr(cuponId: number): Observable<QrCupon> {
    return this.http.get<QrCuponApi>(`${this.apiUrl}/Cupones/${cuponId}/qr`).pipe(
      map((qr) => ({
        imagen: this.dataUrlABlob(qr.qrDataUrl),
        token: qr.qrToken,
      })),
    );
  }

  /**
   * Rol Empleado: verifica el token del QR SIN consumir el cupón. Si es válido devuelve
   * el detalle para confirmarlo; si no, llega un HttpErrorResponse con el motivo.
   */
  validar(qrToken: string): Observable<CuponValidado> {
    return this.http
      .post<ValidarQrApi>(`${this.apiUrl}/Cupones/empleado/validar-qr`, { qrToken })
      .pipe(
        map(({ cupon }) => ({
          marca: cupon.marca,
          titulo: cupon.nombre,
          descripcion: cupon.descripcion || cupon.nombre,
          descuento: cupon.descuento,
          codigo: cupon.codigo,
          vencimientoUtc: cupon.vencimiento,
          usuario: cupon.usuario,
        })),
      );
  }

  /**
   * Rol Empleado: consume el cupón a partir del token del QR
   * (acepta también el contenido completo "FALTAUNA:COUPON:<token>").
   * Los rechazos llegan como HttpErrorResponse.
   */
  canjear(qrToken: string): Observable<CanjeExitosoRespuesta> {
    const solicitud: CanjearCuponSolicitud = { qrToken };
    return this.http.post<CanjeApi>(`${this.apiUrl}/Cupones/empleado/canjear`, solicitud).pipe(
      map((r) => ({
        marca: r.cupon.marca,
        titulo: r.cupon.nombre,
        descripcion: r.cupon.nombre,
        fechaCanjeUtc: r.fechaUso,
      })),
    );
  }

  private aCuponDescuento(c: MiCuponApi): CuponDescuento {
    return {
      id: c.cuponId,
      marca: c.marca,
      categoria: CATEGORIA_POR_MARCA[c.marca.toLowerCase()] ?? 'gastronomia',
      titulo: c.nombre,
      descripcion: c.descripcion || c.nombre,
      detalles: `${c.porcentajeDescuento}% de descuento`,
      codigo: c.codigo,
      vigenteHastaUtc: c.fechaVencimiento,
      estado: this.estadoDe(c),
    };
  }

  private estadoDe(c: MiCuponApi): EstadoCupon {
    const estado = c.estado.toUpperCase();
    if (estado === 'USADO' || estado === 'CANJEADO') return 'Usado';
    if (estado === 'VENCIDO') return 'Vencido';
    // Un cupón "Disponible" cuya fecha ya pasó se muestra como vencido.
    return new Date(c.fechaVencimiento).getTime() < Date.now() ? 'Vencido' : 'Disponible';
  }

  private dataUrlABlob(dataUrl: string): Blob {
    const [cabecera, base64] = dataUrl.split(',');
    const tipo = /data:([^;]+)/.exec(cabecera)?.[1] ?? 'image/png';
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    return new Blob([bytes], { type: tipo });
  }
}