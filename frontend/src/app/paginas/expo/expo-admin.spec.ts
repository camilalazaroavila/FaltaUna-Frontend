import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import { ExpoAdmin } from './expo-admin';

const URL_EXPO = `${environment.apiUrl}/expo/sobre-regalo`;
const URL_SOBRES = `${environment.apiUrl}/Sobres`;
const CLAVE_STORAGE = 'expo-clave';
const CLAVE = 'clave-de-prueba-1234';

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

  const escribirClaveYEnviar = (clave: string) => {
    (el.querySelector('input') as HTMLInputElement).value = clave;
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
  };

  /** Entra al panel con clave válida y resuelve las dos requests iniciales. */
  const entrarAlPanel = () => {
    escribirClaveYEnviar(CLAVE);
    http.expectOne(URL_EXPO).flush({ sobreRegaloId: null, activo: false });
    http.expectOne(URL_SOBRES).flush(SOBRES);
    fixture.detectChanges();
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [ExpoAdmin],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('sin clave guardada muestra el formulario de clave', () => {
    crear();

    expect(el.querySelector('form')).not.toBeNull();
    expect(el.textContent).toContain('Clave de la expo');
  });

  it('con una clave incorrecta (401) muestra el error y no guarda la clave', () => {
    crear();
    escribirClaveYEnviar('clave-mala');

    http.expectOne(URL_EXPO).flush('', { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(el.textContent).toContain('Clave incorrecta.');
    expect(el.querySelector('form')).not.toBeNull();
    expect(sessionStorage.getItem(CLAVE_STORAGE)).toBeNull();
  });

  it('con la clave correcta manda el header, guarda la clave y lista los sobres', () => {
    crear();
    escribirClaveYEnviar(CLAVE);

    const req = http.expectOne(URL_EXPO);
    expect(req.request.headers.get('X-Expo-Key')).toBe(CLAVE);
    req.flush({ sobreRegaloId: null, activo: false });
    http.expectOne(URL_SOBRES).flush(SOBRES);
    fixture.detectChanges();

    expect(el.querySelector('form')).toBeNull();
    expect(sessionStorage.getItem(CLAVE_STORAGE)).toBe(CLAVE);
    expect(boton('Sobre común')).toBeTruthy();
    expect(boton('Sobre épico')).toBeTruthy();
  });

  it('si ya hay clave guardada entra directo sin pedirla', () => {
    sessionStorage.setItem(CLAVE_STORAGE, CLAVE);
    crear();

    http.expectOne(URL_EXPO).flush({ sobreRegaloId: null, activo: false });
    http.expectOne(URL_SOBRES).flush(SOBRES);
    fixture.detectChanges();

    expect(el.querySelector('form')).toBeNull();
    expect(boton('Sobre común')).toBeTruthy();
  });

  it('al tocar un sobre manda PUT con ese id y activo=true', () => {
    crear();
    entrarAlPanel();

    boton('Sobre épico').click();

    const put = http.expectOne((r) => r.method === 'PUT' && r.url === URL_EXPO);
    expect(put.request.headers.get('X-Expo-Key')).toBe(CLAVE);
    expect(put.request.body).toEqual({ sobreRegaloId: 2, activo: true });

    put.flush({ sobreRegaloId: 2, activo: true });
    fixture.detectChanges();

    expect(el.textContent).toContain('Cargado: Sobre épico');
  });

  it('"Desactivar regalo" manda sobreRegaloId null y activo=false', () => {
    crear();
    entrarAlPanel();

    boton('Desactivar regalo').click();

    const put = http.expectOne((r) => r.method === 'PUT' && r.url === URL_EXPO);
    expect(put.request.body).toEqual({ sobreRegaloId: null, activo: false });

    put.flush({ sobreRegaloId: null, activo: false });
    fixture.detectChanges();

    expect(el.textContent).toContain('Regalo desactivado');
  });

  it('si el PUT devuelve 401 muestra que la clave dejó de ser válida', () => {
    crear();
    entrarAlPanel();

    boton('Sobre común').click();
    http
      .expectOne((r) => r.method === 'PUT')
      .flush('', { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(el.textContent).toContain('La clave dejó de ser válida.');
  });

  it('"Salir" borra la clave guardada y vuelve al formulario', () => {
    crear();
    entrarAlPanel();

    boton('Salir').click();
    fixture.detectChanges();

    expect(sessionStorage.getItem(CLAVE_STORAGE)).toBeNull();
    expect(el.querySelector('form')).not.toBeNull();
  });
});