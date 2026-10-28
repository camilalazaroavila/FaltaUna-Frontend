import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import { ExpoAdmin } from './expo-admin';

const URL_EXPO = `${environment.apiUrl}/expo/sobre-regalo`;
const URL_SOBRES = `${environment.apiUrl}/Sobres`;
const URL_USUARIOS = `${environment.apiUrl}/Usuarios`;
const URL_OTORGAR = `${environment.apiUrl}/Sobres/otorgar`;

const SOBRES = [
  { id: 1, nombre: 'Sobre común' },
  { id: 2, nombre: 'Sobre épico' },
];

const USUARIOS = [
  {
    id: 7,
    nombreUsuario: 'gonza123',
    email: 'gonza@mail.com',
    rol: 'Usuario',
    fechaRegistro: '2026-10-27T00:00:00Z',
  },
  {
    id: 8,
    nombreUsuario: 'maria',
    email: 'maria@mail.com',
    rol: 'Usuario',
    fechaRegistro: '2026-10-27T00:00:00Z',
  },
];

const ENTREGA = {
  mensaje: 'Sobre otorgado correctamente al usuario.',
  usuarioId: 7,
  sobreId: 2,
  cantidadAgregada: 1,
  cantidadActual: 1,
};

describe('ExpoAdmin', () => {
  let fixture: ComponentFixture<ExpoAdmin>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const crear = () => {
    fixture = TestBed.createComponent(ExpoAdmin);
    el = fixture.nativeElement;
    fixture.detectChanges();
  };

  /** Crea el panel y resuelve las tres requests iniciales. */
  const cargarPanel = (config: { sobreRegaloId: number | null; activo: boolean } = {
    sobreRegaloId: null,
    activo: false,
  }) => {
    crear();
    http.expectOne(URL_EXPO).flush(config);
    http.expectOne(URL_SOBRES).flush(SOBRES);
    http.expectOne(URL_USUARIOS).flush(USUARIOS);
    fixture.detectChanges();
  };

  const botonConTexto = (texto: string) =>
    [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes(texto),
    ) as HTMLButtonElement;

  /** Tarjeta de premio de la grilla del paso 1. */
  const carta = (nombre: string) =>
    [
      ...(el.querySelector('section.grid')?.querySelectorAll('button') ?? []),
    ].find((b) => b.textContent?.includes(nombre)) as HTMLButtonElement;

  /** Resultado del buscador de usuarios. */
  const usuario = (nombre: string) =>
    [...el.querySelectorAll('li button')].find((b) =>
      b.textContent?.includes(nombre),
    ) as HTMLButtonElement;

  const escribir = (texto: string) => {
    const input = el.querySelector('#buscar-usuario') as HTMLInputElement;
    input.value = texto;
    input.dispatchEvent(new Event('input'));
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

  it('carga configuración, sobres y usuarios sin pedir clave', () => {
    crear();

    const req = http.expectOne(URL_EXPO);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.has('X-Expo-Key')).toBe(false);
    expect(el.querySelector('input[type="password"]')).toBeNull();
    expect(el.querySelector('form')).toBeNull();

    const aviso = el.querySelector('[role="note"]');
    expect(aviso?.textContent).toContain('DIRECTO');

    req.flush({ sobreRegaloId: null, activo: false });
    http.expectOne(URL_SOBRES).flush(SOBRES);
    http.expectOne(URL_USUARIOS).flush(USUARIOS);
    fixture.detectChanges();

    expect(carta('Sobre común')).toBeTruthy();
    expect(carta('Sobre épico')).toBeTruthy();
    expect(el.querySelector('#buscar-usuario')).toBeTruthy();
  });

  it('tocar un premio solo lo selecciona: no manda nada al servidor', () => {
    cargarPanel();

    carta('Sobre épico').click();
    fixture.detectChanges();

    expect(carta('Sobre épico').getAttribute('aria-pressed')).toBe('true');
    http.expectNone((r) => r.method === 'PUT' || r.method === 'POST');
  });

  it('"Dejar para el próximo registro" manda PUT con el sobre elegido', () => {
    cargarPanel();

    carta('Sobre épico').click();
    fixture.detectChanges();
    botonConTexto('Dejar el sobre elegido para el próximo registro').click();

    const put = http.expectOne((r) => r.method === 'PUT' && r.url === URL_EXPO);
    expect(put.request.body).toEqual({ sobreRegaloId: 2, activo: true });

    put.flush({ sobreRegaloId: 2, activo: true });
    fixture.detectChanges();

    expect(el.textContent).toContain('Pendiente para el próximo registro: Sobre épico.');
  });

  it('sin sobre elegido no deja dejar el regalo para el próximo registro', () => {
    cargarPanel();

    const boton = botonConTexto('Dejar el sobre elegido para el próximo registro');
    expect(boton.disabled).toBe(true);
  });

  it('busca usuarios por nombre o email', () => {
    cargarPanel();

    escribir('gonza');
    expect(usuario('gonza123')).toBeTruthy();
    expect(usuario('maria')).toBeFalsy();

    escribir('maria@');
    expect(usuario('maria')).toBeTruthy();
    expect(usuario('gonza123')).toBeFalsy();
  });

  it('entrega el sobre elegido al usuario elegido', () => {
    cargarPanel();

    carta('Sobre épico').click();
    escribir('gonza');
    usuario('gonza123').click();
    fixture.detectChanges();

    expect(el.textContent).toContain('¿Entregar Sobre épico a gonza123?');

    botonConTexto('CONFIRMAR ENTREGA').click();

    const post = http.expectOne((r) => r.method === 'POST' && r.url === URL_OTORGAR);
    expect(post.request.body).toEqual({ usuarioId: 7, sobreId: 2, cantidad: 1 });

    post.flush(ENTREGA);
    fixture.detectChanges();

    expect(el.textContent).toContain('Entregado: Sobre épico a gonza123.');
    expect(el.textContent).toContain('Entregas de esta sesión');
    expect(el.querySelector('#buscar-usuario')).toHaveProperty('value', '');
  });

  it('si la entrega falla muestra el error y no pierde la selección', () => {
    cargarPanel();

    carta('Sobre común').click();
    escribir('gonza');
    usuario('gonza123').click();
    fixture.detectChanges();

    botonConTexto('CONFIRMAR ENTREGA').click();
    http
      .expectOne((r) => r.method === 'POST' && r.url === URL_OTORGAR)
      .flush('', { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(el.textContent).toContain('No se pudo entregar el sobre. Probá de nuevo.');
    expect(el.textContent).toContain('¿Entregar Sobre común a gonza123?');
  });

  it('no ofrece confirmar la entrega si no hay sobre elegido', () => {
    cargarPanel();

    escribir('gonza');
    usuario('gonza123').click();
    fixture.detectChanges();

    expect(el.textContent).toContain('Elegí primero un sobre en el paso 1.');
    expect(botonConTexto('CONFIRMAR ENTREGA')).toBeFalsy();
  });

  it('"Desactivar regalo" manda sobreRegaloId null y activo=false', () => {
    cargarPanel({ sobreRegaloId: 1, activo: true });

    botonConTexto('Desactivar regalo').click();

    const put = http.expectOne((r) => r.method === 'PUT' && r.url === URL_EXPO);
    expect(put.request.body).toEqual({ sobreRegaloId: null, activo: false });

    put.flush({ sobreRegaloId: null, activo: false });
    fixture.detectChanges();

    expect(el.textContent).toContain('Regalo desactivado');
  });

  it('marca como PENDIENTE el sobre que va a recibir el próximo registro', () => {
    cargarPanel({ sobreRegaloId: 1, activo: true });

    expect(carta('Sobre común').textContent).toContain('PENDIENTE');
    expect(carta('Sobre épico').textContent).not.toContain('PENDIENTE');
  });

  it('si falla la carga de la configuración muestra el error', () => {
    crear();

    http.expectOne(URL_EXPO).flush('', { status: 500, statusText: 'Server Error' });
    http.expectOne(URL_SOBRES).flush(SOBRES);
    http.expectOne(URL_USUARIOS).flush(USUARIOS);
    fixture.detectChanges();

    expect(el.textContent).toContain('No se pudo conectar con el servidor.');
  });
});
