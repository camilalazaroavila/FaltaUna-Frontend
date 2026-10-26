import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import type { ConfiguracionExpo, SobreResumen } from '@modelos/expo.model';
import { ExpoService } from './expo.service';

const URL_EXPO = `${environment.apiUrl}/expo/sobre-regalo`;
const URL_SOBRES = `${environment.apiUrl}/Sobres`;

describe('ExpoService', () => {
  let servicio: ExpoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(ExpoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtenerConfiguracion hace GET con el header X-Expo-Key', () => {
    let resultado: ConfiguracionExpo | undefined;
    servicio.obtenerConfiguracion('mi-clave').subscribe((r) => (resultado = r));

    const req = http.expectOne(URL_EXPO);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('X-Expo-Key')).toBe('mi-clave');

    req.flush({ sobreRegaloId: 2, activo: true });
    expect(resultado).toEqual({ sobreRegaloId: 2, activo: true });
  });

  it('cambiarSobreRegalo hace PUT con el body y el header', () => {
    servicio.cambiarSobreRegalo('mi-clave', 3, true).subscribe();

    const req = http.expectOne(URL_EXPO);
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('X-Expo-Key')).toBe('mi-clave');
    expect(req.request.body).toEqual({ sobreRegaloId: 3, activo: true });

    req.flush({ sobreRegaloId: 3, activo: true });
  });

  it('cambiarSobreRegalo permite desactivar mandando null', () => {
    servicio.cambiarSobreRegalo('mi-clave', null, false).subscribe();

    const req = http.expectOne(URL_EXPO);
    expect(req.request.body).toEqual({ sobreRegaloId: null, activo: false });

    req.flush({ sobreRegaloId: null, activo: false });
  });

  it('obtenerSobres hace GET a /Sobres', () => {
    let resultado: SobreResumen[] | undefined;
    servicio.obtenerSobres().subscribe((r) => (resultado = r));

    const req = http.expectOne(URL_SOBRES);
    expect(req.request.method).toBe('GET');

    req.flush([{ id: 1, nombre: 'Sobre común' }]);
    expect(resultado).toEqual([{ id: 1, nombre: 'Sobre común' }]);
  });
});