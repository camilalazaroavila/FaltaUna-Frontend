import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  CanjeApi,
  CanjeExitosoRespuesta,
  CanjearCuponSolicitud,
  CategoriaCupon,
  CuponDescuento,
  CuponValidado,
  EstadoCupon,
  FiltrosCupones,
  MiCuponApi,
  QrCupon,
  QrCuponApi,
  ValidarQrApi,
} from '@modelos/cupon.model';
import { normalizarUrlImagen } from '@modelos/carta.model';

const CATEGORIA_BACKEND_A_FRONT: Record<string, CategoriaCupon> = {
  'gastronomía': 'gastronomia',
  gastronomia: 'gastronomia',
  indumentaria: 'indumentaria',
  entretenimiento: 'entretenimiento',
  tecnologia: 'tecnologia',
  deco: 'deco',
  decoracion: 'deco',
  cosmetica: 'cosmetica',
  cosmeticos: 'cosmetica',
  musica: 'musica',
};

/** Normaliza el nombre de categoría del backend al tipo del frontend. */
function categoriaDesdeBackend(valor: string | null | undefined): CategoriaCupon | null {
  if (!valor) {
    return null;
  }
  const clave = valor.trim().toLowerCase();
  return CATEGORIA_BACKEND_A_FRONT[clave] ?? null;
}

@Injectable({
  providedIn: 'root',
})
export class CuponesService {
  private readonly api = inject(ApiService);

  /**
   * Cupones del usuario logueado (rol Usuario).
   * Los filtros y el estado los aplica el backend.
   */
  obtenerMisCupones(
    filtros: FiltrosCupones = {},
  ): Observable<CuponDescuento[]> {
    return this.api
      .get<MiCuponApi[]>('Cupones/mis-cupones', {
        params: {
          buscar: filtros.buscar?.trim() || null,
          estado: filtros.estado || null,
        },
      })
      .pipe(map((cupones) => cupones.map((c) => this.aCuponDescuento(c))));
  }

  /**
   * Obtiene el QR del cupón y convierte su imagen en un Blob.
   */
  obtenerQr(cuponId: number): Observable<QrCupon> {
    return this.api
      .get<QrCuponApi>(`Cupones/${cuponId}/qr`)
      .pipe(
        map((qr) => ({
          imagen: this.dataUrlABlob(qr.qrDataUrl),
          token: qr.qrToken,
        })),
      );
  }

  /**
   * Rol Empleado: verifica el QR sin consumir el cupón.
   */
  validar(qrToken: string): Observable<CuponValidado> {
    return this.api
      .post<ValidarQrApi>(
        'Cupones/empleado/validar-qr',
        { qrToken },
      )
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
   * Rol Empleado: canjea el cupón a partir del token del QR.
   */
  canjear(qrToken: string): Observable<CanjeExitosoRespuesta> {
    const solicitud: CanjearCuponSolicitud = { qrToken };

    return this.api
      .post<CanjeApi>(
        'Cupones/empleado/canjear',
        solicitud,
      )
      .pipe(
        map((r) => ({
          marca: r.cupon.marca,
          titulo: r.cupon.nombre,
          descripcion: r.cupon.nombre,
          fechaCanjeUtc: r.fechaUso,
        })),
      );
  }

  private aCuponDescuento(c: MiCuponApi): CuponDescuento {
    const descripcion = c.descripcion || c.nombre;

    return {
      id: c.cuponId,
      marca: c.marca,
      categoria: categoriaDesdeBackend(c.categoria),
      titulo: c.nombre,
      descripcion,
      detalles: `${c.porcentajeDescuento}% de descuento`,
      codigo: c.codigo,
      vigenteHastaUtc: c.fechaVencimiento,
      estado: this.estadoDe(c),
      enlace: c.enlace ?? null,
      porcentajeDescuento: c.porcentajeDescuento,
      tieneQr: c.tieneQr,
      marcaLogoUrl: normalizarUrlImagen(c.marcaLogoUrl),
    };
  }

  private estadoDe(c: MiCuponApi): EstadoCupon {
    const estado = c.estado.toUpperCase();

    if (estado === 'USADO' || estado === 'CANJEADO') {
      return 'Usado';
    }

    if (estado === 'VENCIDO') {
      return 'Vencido';
    }

    return new Date(c.fechaVencimiento).getTime() < Date.now()
      ? 'Vencido'
      : 'Disponible';
  }

  private dataUrlABlob(dataUrl: string): Blob {
    const [cabecera, base64] = dataUrl.split(',');
    const tipo = /data:([^;]+)/.exec(cabecera)?.[1] ?? 'image/png';
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);

    for (let i = 0; i < binario.length; i++) {
      bytes[i] = binario.charCodeAt(i);
    }

    return new Blob([bytes], { type: tipo });
  }
}
