import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
    CanjeCodigoSobreRespuesta,
    CanjearCodigoSobreSolicitud,
    CodigoSobreApi,
    CodigoSobreGenerado,
} from '@modelos/codigo-sobre.model';

/**
 * Códigos de sobre que regala el empleado de una marca en el local.
 * El empleado genera un QR y un código corto; el usuario los canjea y el sobre
 * llega a su inventario. El servidor valida todo (vencimiento, uso único, límite diario).
 */
@Injectable({
    providedIn: 'root',
})
export class CodigosSobreService {
    private readonly api = inject(ApiService);

    /** Rol Empleado: genera un código nuevo para el sobre de su marca (vence a los 120 s). */
    generar(): Observable<CodigoSobreGenerado> {
        return this.api.post<CodigoSobreApi>('CodigosSobre/generar').pipe(
            map((respuesta) => ({
                marca: respuesta.marca,
                sobre: respuesta.sobre,
                codigo: respuesta.codigo,
                qrDataUrl: respuesta.qrDataUrl,
                vencimientoUtc: respuesta.fechaVencimiento,
                duracionSegundos: respuesta.segundosRestantes,
            })),
        );
    }

    /** Rol Usuario: canjea el contenido del QR o el código corto tipeado. */
    canjear(codigo: string): Observable<CanjeCodigoSobreRespuesta> {
        const cuerpo: CanjearCodigoSobreSolicitud = { codigo };
        return this.api.post<CanjeCodigoSobreRespuesta>('CodigosSobre/canjear', cuerpo);
    }
}