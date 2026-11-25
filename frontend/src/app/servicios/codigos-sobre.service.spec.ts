import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { CodigosSobreService } from './codigos-sobre.service';
import {
    CanjeCodigoSobreRespuesta,
    CodigoSobreApi,
    CodigoSobreGenerado,
} from '@modelos/codigo-sobre.model';

describe('CodigosSobreService', () => {
    let service: CodigosSobreService;
    let httpTesting: HttpTestingController;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });

        service = TestBed.inject(CodigosSobreService);
        httpTesting = TestBed.inject(HttpTestingController);
        baseUrl = `${TestBed.inject(ApiService).urlBase}/CodigosSobre`;
    });

    afterEach(() => {
        httpTesting.verify();
    });

    it('generar hace POST /CodigosSobre/generar y adapta la respuesta', () => {
        const respuestaApi: CodigoSobreApi = {
            marca: 'McDonald\'s',
            sobre: 'Sobre McDonald\'s',
            codigo: 'WBWV-KC8Q',
            qrToken: 'ABC123',
            qrDataUrl: 'data:image/png;base64,iVBORw0K',
            fechaVencimiento: '2026-11-20T15:02:00Z',
            segundosRestantes: 120,
        };

        let generado: CodigoSobreGenerado | undefined;
        service.generar().subscribe((resultado) => (generado = resultado));

        const peticion = httpTesting.expectOne(`${baseUrl}/generar`);
        expect(peticion.request.method).toBe('POST');
        peticion.flush(respuestaApi);

        expect(generado).toEqual({
            marca: 'McDonald\'s',
            sobre: 'Sobre McDonald\'s',
            codigo: 'WBWV-KC8Q',
            qrDataUrl: 'data:image/png;base64,iVBORw0K',
            vencimientoUtc: '2026-11-20T15:02:00Z',
            duracionSegundos: 120,
        });
    });

    it('canjear hace POST /CodigosSobre/canjear con el código y devuelve la respuesta', () => {
        const respuesta: CanjeCodigoSobreRespuesta = {
            mensaje: '¡Listo! Sumaste "Sobre McDonald\'s" a tu inventario.',
            marca: 'McDonald\'s',
            sobreId: 3,
            sobre: 'Sobre McDonald\'s',
        };

        let canjeado: CanjeCodigoSobreRespuesta | undefined;
        service.canjear('WBWV-KC8Q').subscribe((resultado) => (canjeado = resultado));

        const peticion = httpTesting.expectOne(`${baseUrl}/canjear`);
        expect(peticion.request.method).toBe('POST');
        expect(peticion.request.body).toEqual({ codigo: 'WBWV-KC8Q' });
        peticion.flush(respuesta);

        expect(canjeado).toEqual(respuesta);
    });
});