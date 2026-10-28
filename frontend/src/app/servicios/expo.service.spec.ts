import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import type {
  ConfiguracionExpo,
  SobreResumen,
  UsuarioResumen,
} from '@modelos/expo.model';
import { ExpoService } from './expo.service';

const URL_EXPO = `${environment.apiUrl}/expo/sobre-regalo`;
const URL_SOBRES = `${environment.apiUrl}/Sobres`;
const URL_USUARIOS = `${environment.apiUrl}/Usuarios`;
const URL_OTORGAR = `${environment.apiUrl}/Sobres/otorgar`;

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

  it('obtenerConfiguracion hace GET a /expo/sobre-regalo', () => {
    let resultado: ConfiguracionExpo | undefined;
    servicio.obtenerConfiguracion().subscribe((r) => (resultado = r));

    const req = http.expectOne(URL_EXPO);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('X-Expo-Key')).toBe(false);

    req.flush({ sobreRegaloId: 2, activo: true });
    expect(resultado).toEqual({ sobreRegaloId: 2, activo: true });
  });

  it('cambiarSobreRegalo hace PUT con el body', () => {
    servicio.cambiarSobreRegalo(3, true).subscribe();

    const req = http.expectOne(URL_EXPO);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ sobreRegaloId: 3, activo: true });

    req.flush({ sobreRegaloId: 3, activo: true });
  });

  it('cambiarSobreRegalo permite desactivar mandando null', () => {
    servicio.cambiarSobreRegalo(null, false).subscribe();

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

  it('obtenerUsuarios hace GET a /Usuarios', () => {
    let resultado: UsuarioResumen[] | undefined;
    servicio.obtenerUsuarios().subscribe((r) => (resultado = r));

    const req = http.expectOne(URL_USUARIOS);
    expect(req.request.method).toBe('GET');

    req.flush([
      {
        id: 7,
        nombreUsuario: 'gonza123',
        email: 'gonza@mail.com',
        rol: 'Usuario',
        fechaRegistro: '2026-10-27T00:00:00Z',
      },
    ]);
    expect(resultado?.[0].nombreUsuario).toBe('gonza123');
  });

  it('otorgarSobre hace POST a /Sobres/otorgar con cantidad 1 por defecto', () => {
    servicio.otorgarSobre(7, 2).subscribe();

    const req = http.expectOne(URL_OTORGAR);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ usuarioId: 7, sobreId: 2, cantidad: 1 });

    req.flush({
      mensaje: 'ok',
      usuarioId: 7,
      sobreId: 2,
      cantidadAgregada: 1,
      cantidadActual: 1,
    });
  });
});
