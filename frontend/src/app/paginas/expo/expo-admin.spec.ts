import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import { ExpoAdmin } from './expo-admin';

const URL_EXPO = `${environment.apiUrl}/expo/sobre-regalo`;
const URL_SOBRES = `${environment.apiUrl}/Sobres`;

const SOBRES = [
  { id: 1, nombre: 'Sobre común' },
  { id: 2, nombre: 'Sobre épico' },
];

describe('ExpoAdmin', () => {
  let fixture: ComponentFixture<ExpoAdmin>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const boton = (texto: string) =>
    [...el.querySelectorAll('button')].find(
      (b) => b.textContent?.trim() === texto,
    ) as HTMLButtonElement;

  const crear = () => {
    fixture = TestBed.createComponent(ExpoAdmin);
    el = fixture.nativeElement;
    fixture.detectChanges();
  };

  /** Crea el panel y resuelve las dos requests iniciales. */
  const cargarPanel = () => {
    crear();
    http.expectOne(URL_EXPO).flush({ sobreRegaloId: null, activo: false });
    http.expectOne(URL_SOBRES).flush(SOBRES);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExpoAdmin],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    fixture?.destroy();
    http.verify();
  });

  it('carga la configuración y los sobres sin pedir clave', () => {
    crear();

    const req = http.expectOne(URL_EXPO);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('X-Expo-Key')).toBe(false);
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('input')).toBeNull();

    req.flush({ sobreRegaloId: null, activo: false });
    http.expectOne(URL_SOBRES).flush(SOBRES);
    fixture.detectChanges();

    expect(boton('Sobre común')).toBeTruthy();
    expect(boton('Sobre épico')).toBeTruthy();
  });

  it('si falla la carga muestra el error', () => {
    crear();

    http.expectOne(URL_EXPO).flush('', { status: 500, statusText: 'Server Error' });
    http.expectOne(URL_SOBRES).flush(SOBRES);
    fixture.detectChanges();

    expect(el.textContent).toContain('No se pudo conectar con el servidor.');
  });

  it('al tocar un sobre manda PUT con ese id y activo=true', () => {
    cargarPanel();

    boton('Sobre épico').click();

    const put = http.expectOne((r) => r.method === 'PUT' && r.url === URL_EXPO);
    expect(put.request.headers.has('X-Expo-Key')).toBe(false);
    expect(put.request.body).toEqual({ sobreRegaloId: 2, activo: true });

    put.flush({ sobreRegaloId: 2, activo: true });
    fixture.detectChanges();

    expect(el.textContent).toContain('Cargado: Sobre épico');
  });

  it('"Desactivar regalo" manda sobreRegaloId null y activo=false', () => {
    cargarPanel();

    boton('Desactivar regalo').click();

    const put = http.expectOne((r) => r.method === 'PUT' && r.url === URL_EXPO);
    expect(put.request.body).toEqual({ sobreRegaloId: null, activo: false });

    put.flush({ sobreRegaloId: null, activo: false });
    fixture.detectChanges();

    expect(el.textContent).toContain('Regalo desactivado');
  });

  it('si el PUT falla muestra el error', () => {
    cargarPanel();

    boton('Sobre común').click();
    http
      .expectOne((r) => r.method === 'PUT')
      .flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el.textContent).toContain('No se pudo guardar el cambio.');
  });
});
