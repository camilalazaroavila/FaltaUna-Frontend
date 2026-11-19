import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { CuponesService } from './cupones.service';
import { ApiService } from './api.service';
import type {
  CuponDescuento,
  MiCuponApi,
} from '@modelos/cupon.model';

const CUPON_API: MiCuponApi[] = [
  {
    cuponId: 1,
    marca: 'Grido',
    categoria: 'Gastronomía',
    nombre: 'Helado 2x1',
    descripcion: '2x1 en cucuruchos',
    codigo: 'GRIDO-1',
    porcentajeDescuento: 30,
    fechaInicio: '2026-01-01T00:00:00Z',
    fechaVencimiento: '2027-12-31T00:00:00Z',
    estado: 'Disponible',
    fechaObtencion: '2026-01-10T00:00:00Z',
    fechaUso: null,
    tieneQr: true,
  },
  {
    cuponId: 2,
    marca: 'Zara',
    categoria: null,
    nombre: '20% off',
    descripcion: '20% off en prendas',
    codigo: 'ZARA-1',
    porcentajeDescuento: 20,
    fechaInicio: '2026-01-01T00:00:00Z',
    fechaVencimiento: '2025-12-31T00:00:00Z',
    estado: 'Vencido',
    fechaObtencion: '2026-01-10T00:00:00Z',
    fechaUso: null,
    tieneQr: true,
  },
  {
    cuponId: 3,
    marca: 'Nike',
    categoria: 'Indumentaria',
    nombre: 'Descuento Nike',
    descripcion: '10% off en calzado',
    codigo: 'NIKE-1',
    porcentajeDescuento: 10,
    fechaInicio: '2026-01-01T00:00:00Z',
    fechaVencimiento: '2027-12-31T00:00:00Z',
    estado: 'Usado',
    fechaObtencion: '2026-01-10T00:00:00Z',
    fechaUso: '2026-02-01T00:00:00Z',
    tieneQr: true,
  },
];

describe('CuponesService', () => {
  let service: CuponesService;
  let api: { get: jest.Mock; post: jest.Mock };

  beforeEach(() => {
    api = {
      get: jest.fn(),
      post: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CuponesService,
        { provide: ApiService, useValue: api },
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CuponesService);
  });

  describe('obtenerMisCupones', () => {
    it('llama al backend con los filtros de búsqueda y estado', () => {
      api.get.mockReturnValue(of(CUPON_API));

      service.obtenerMisCupones({ buscar: 'grido', estado: 'Disponible' }).subscribe();

      expect(api.get).toHaveBeenCalledWith('Cupones/mis-cupones', {
        params: { buscar: 'grido', estado: 'Disponible' },
      });
    });

    it('no envía parámetros nulos o vacíos', () => {
      api.get.mockReturnValue(of(CUPON_API));

      service.obtenerMisCupones({}).subscribe();

      expect(api.get).toHaveBeenCalledWith('Cupones/mis-cupones', {
        params: { buscar: null, estado: null },
      });
    });

    it('mapea la respuesta del backend a CuponDescuento[]', () => {
      api.get.mockReturnValue(of(CUPON_API));

      let resultado: CuponDescuento[] = [];
      service.obtenerMisCupones().subscribe((c) => (resultado = c));

      expect(resultado).toHaveLength(3);
      expect(resultado[0]).toEqual(
        expect.objectContaining({
          id: 1,
          marca: 'Grido',
          categoria: 'gastronomia',
          titulo: 'Helado 2x1',
          descripcion: '2x1 en cucuruchos',
          detalles: '30% de descuento',
          codigo: 'GRIDO-1',
          vigenteHastaUtc: '2027-12-31T00:00:00Z',
          estado: 'Disponible',
          enlace: null,
          porcentajeDescuento: 30,
        })
      );
    });

    it('mapea categoría nula a null', () => {
      api.get.mockReturnValue(of([CUPON_API[1]]));

      let resultado: CuponDescuento[] = [];
      service.obtenerMisCupones().subscribe((c) => (resultado = c));

      expect(resultado[0].categoria).toBeNull();
    });

    it('mapea estado Vencido del backend a Vencido', () => {
      api.get.mockReturnValue(of([CUPON_API[1]]));

      let resultado: CuponDescuento[] = [];
      service.obtenerMisCupones().subscribe((c) => (resultado = c));

      expect(resultado[0].estado).toBe('Vencido');
    });

    it('mapea estado Usado del backend a Usado', () => {
      api.get.mockReturnValue(of([CUPON_API[2]]));

      let resultado: CuponDescuento[] = [];
      service.obtenerMisCupones().subscribe((c) => (resultado = c));

      expect(resultado[0].estado).toBe('Usado');
    });

    it('propaga errores del backend', () => {
      api.get.mockReturnValue(throwError(() => new Error('Error de red')));

      let error: unknown = null;
      service.obtenerMisCupones().subscribe({
        error: (e) => (error = e),
      });

      expect(error).not.toBeNull();
    });
  });

  describe('obtenerQr', () => {
    it('llama al endpoint QR y devuelve imagen y token', () => {
      const qrApi = {
        cuponId: 1,
        marca: 'Grido',
        nombre: 'Helado 2x1',
        porcentajeDescuento: 30,
        estado: 'Disponible',
        fechaVencimiento: '2027-12-31T00:00:00Z',
        qrToken: 'tok123',
        qrDataUrl: 'data:image/png;base64,iVBORw0KGgo',
      };
      api.get.mockReturnValue(of(qrApi));

      let resultado: { imagen: Blob; token: string } | null = null;
      service.obtenerQr(1).subscribe((q) => (resultado = q));

      expect(api.get).toHaveBeenCalledWith('Cupones/1/qr');
      expect(resultado?.imagen).toEqual(expect.any(Blob));
      expect(resultado?.token).toBe('tok123');
    });
  });

  describe('validar', () => {
    it('llama al endpoint de validación QR del empleado', () => {
      const resp = {
        valido: true,
        mensaje: 'QR válido.',
        cupon: {
          id: 1,
          marca: 'Grido',
          nombre: 'Helado 2x1',
          descripcion: '2x1',
          descuento: 30,
          codigo: 'GRIDO-1',
          vencimiento: '2027-12-31T00:00:00Z',
          usuario: 'juan',
        },
      };
      api.post.mockReturnValue(of(resp));

      service.validar('tok123').subscribe();

      expect(api.post).toHaveBeenCalledWith('Cupones/empleado/validar-qr', {
        qrToken: 'tok123',
      });
    });
  });

  describe('canjear', () => {
    it('llama al endpoint de canje del empleado', () => {
      const resp = {
        exitoso: true,
        mensaje: 'Cupón canjeado correctamente.',
        fechaUso: '2026-02-01T00:00:00Z',
        cupon: { id: 1, marca: 'Grido', nombre: 'Helado 2x1', descuento: 30 },
      };
      api.post.mockReturnValue(of(resp));

      service.canjear('tok123').subscribe();

      expect(api.post).toHaveBeenCalledWith('Cupones/empleado/canjear', {
        qrToken: 'tok123',
      });
    });
  });
});
