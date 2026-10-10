import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PagosService } from './pagos.service';
import { ApiService } from './api.service';
import {
  ConfiguracionPagoRespuesta,
  IniciarPagoRespuesta,
  PagoRespuesta,
} from '../modelos/pago.model';

describe('PagosService', () => {
  let service: PagosService;
  let api: ApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PagosService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PagosService);
    api = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('obtenerConfiguracion() debe consultar GET /api/Pagos/configuracion', () => {
    const respuestaMock: ConfiguracionPagoRespuesta = {
      publicKey: 'APP_USR-test-public-key',
    };

    service.obtenerConfiguracion().subscribe((res) => {
      expect(res).toEqual(respuestaMock);
      expect(res.publicKey).toBe('APP_USR-test-public-key');
    });

    const req = httpTesting.expectOne(`${api.urlBase}/Pagos/configuracion`);
    expect(req.request.method).toBe('GET');
    req.flush(respuestaMock);
  });

  it('iniciarPago() debe enviar POST a /api/Pagos con planId', () => {
    const mockRespuesta: IniciarPagoRespuesta = {
      urlPago: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123',
      pago: {
        referenciaExterna: 'PAG-123',
        estado: 'Pendiente',
        puedePersonalizar: false,
        monto: 15000,
        moneda: 'ARS',
        plan: {
          id: 1,
          codigo: 'BASICO',
          nombre: 'Básico',
          precio: 15000,
          maxCartas: 12,
          incluyeEstadisticas: false,
          masPublicidad: true,
          disenoPersonalizado: false,
        },
        fechaCreacion: '2026-10-05T12:00:00Z',
      },
    };

    service.iniciarPago(1).subscribe((res) => {
      expect(res.urlPago).toContain('pref_id=123');
      expect(res.pago.referenciaExterna).toBe('PAG-123');
    });

    const req = httpTesting.expectOne(`${api.urlBase}/Pagos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ planId: 1 });
    req.flush(mockRespuesta);
  });

  it('obtenerPago() debe consultar GET /api/Pagos/:referenciaExterna', () => {
    const mockPago: PagoRespuesta = {
      referenciaExterna: 'PAG-XYZ',
      estado: 'Aprobado',
      puedePersonalizar: true,
      monto: 35000,
      moneda: 'ARS',
      plan: {
        id: 2,
        codigo: 'STANDARD',
        nombre: 'Standard',
        precio: 35000,
        maxCartas: 20,
        incluyeEstadisticas: true,
        masPublicidad: true,
        disenoPersonalizado: false,
      },
      fechaCreacion: '2026-10-05T12:00:00Z',
      fechaAprobacion: '2026-10-05T12:05:00Z',
    };

    service.obtenerPago('PAG-XYZ').subscribe((res) => {
      expect(res.estado).toBe('Aprobado');
      expect(res.puedePersonalizar).toBe(true);
    });

    const req = httpTesting.expectOne(`${api.urlBase}/Pagos/PAG-XYZ`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPago);
  });

  it('confirmarPago() debe enviar POST a /api/Pagos/:ref/confirmar', () => {
    const mockPago: PagoRespuesta = {
      referenciaExterna: 'PAG-456',
      estado: 'Aprobado',
      puedePersonalizar: true,
      monto: 60000,
      moneda: 'ARS',
      plan: {
        id: 3,
        codigo: 'PREMIUM',
        nombre: 'Premium',
        precio: 60000,
        maxCartas: 30,
        incluyeEstadisticas: true,
        masPublicidad: true,
        disenoPersonalizado: true,
      },
      fechaCreacion: '2026-10-05T12:00:00Z',
    };

    service.confirmarPago('PAG-456', '987654321').subscribe((res) => {
      expect(res.referenciaExterna).toBe('PAG-456');
    });

    const req = httpTesting.expectOne(
      `${api.urlBase}/Pagos/PAG-456/confirmar`,
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ pagoMercadoPagoId: '987654321' });
    req.flush(mockPago);
  });
});
