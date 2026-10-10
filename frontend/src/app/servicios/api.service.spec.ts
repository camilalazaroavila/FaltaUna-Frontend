import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ApiService, ParametrosConsulta, unirUrl } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('unirUrl', () => {
    it('une base y ruta sin barras duplicadas', () => {
      expect(unirUrl('http://localhost:5142/api', '/Pagos')).toBe('http://localhost:5142/api/Pagos');
      expect(unirUrl('http://localhost:5142/api/', 'Pagos')).toBe('http://localhost:5142/api/Pagos');
      expect(unirUrl('http://localhost:5142/api', 'Pagos')).toBe('http://localhost:5142/api/Pagos');
      expect(unirUrl('http://localhost:5142/api/', '/Pagos')).toBe('http://localhost:5142/api/Pagos');
    });

    it('devuelve la base sin barra final cuando la ruta está vacía', () => {
      expect(unirUrl('http://localhost:5142/api/', '')).toBe('http://localhost:5142/api');
    });
  });

  it('urlBase no termina en barra y urlHub está definido', () => {
    expect(service.urlBase.endsWith('/')).toBe(false);
    expect(service.urlBase.length).toBeGreaterThan(0);
    expect(service.urlHub.length).toBeGreaterThan(0);
  });

  it('get arma la URL relativa y omite parámetros nulos o indefinidos', () => {
    const params: ParametrosConsulta = { a: 1, b: null, c: undefined, d: 'x' };

    service.get<{ ok: boolean }>('Pagos/configuracion', { params }).subscribe();

    const req = httpTesting.expectOne(`${service.urlBase}/Pagos/configuracion?a=1&d=x`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('a')).toBe('1');
    expect(req.request.params.get('d')).toBe('x');
    expect(req.request.params.has('b')).toBe(false);
    expect(req.request.params.has('c')).toBe(false);
    req.flush({ ok: true });
  });

  it('get acepta rutas con barra inicial', () => {
    service.get<unknown[]>('/Usuarios').subscribe();

    const req = httpTesting.expectOne(`${service.urlBase}/Usuarios`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('post envía el cuerpo y las cabeceras', () => {
    service.post<{ id: number }>('Pagos', { planId: 3 }, { headers: { 'X-Test': 'uno' } }).subscribe();

    const req = httpTesting.expectOne(`${service.urlBase}/Pagos`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ planId: 3 });
    expect(req.request.headers.get('X-Test')).toBe('uno');
    req.flush({ id: 1 });
  });

  it('put envía el cuerpo por PUT', () => {
    service.put<unknown>('Usuarios/1', { nombre: 'Ana' }).subscribe();

    const req = httpTesting.expectOne(`${service.urlBase}/Usuarios/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nombre: 'Ana' });
    req.flush({});
  });

  it('patch envía el cuerpo por PATCH', () => {
    service.patch<unknown>('Usuarios/1', { activo: true }).subscribe();

    const req = httpTesting.expectOne(`${service.urlBase}/Usuarios/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ activo: true });
    req.flush({});
  });

  it('delete no envía cuerpo', () => {
    service.delete<unknown>('Usuarios/1').subscribe();

    const req = httpTesting.expectOne(`${service.urlBase}/Usuarios/1`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toBeNull();
    req.flush({});
  });
});
