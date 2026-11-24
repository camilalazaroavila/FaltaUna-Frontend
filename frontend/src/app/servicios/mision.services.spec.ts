import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { faltantesPity, type MisionRespuesta } from '@modelos/misiones.model';
import { MisionesService } from './mision.services';

const MISIONES_BACKEND: MisionRespuesta[] = [
  {
    id: 1,
    nombre: 'Abrí 3 sobres',
    periodo: 'DIARIA',
    objetivo: 'ABRIR_SOBRES',
    meta: 3,
    progreso: 3,
    completada: true,
    reclamada: false,
    recompensa: {
      id: 1,
      nombre: 'Sobre General',
      tipo: 'GENERAL',
      categoria: null,
      marca: null,
      logoUrl: null,
    },
    cantidadRecompensa: 1,
  },
  {
    id: 2,
    nombre: 'Abrí 10 sobres esta semana',
    periodo: 'SEMANAL',
    objetivo: 'ABRIR_SOBRES',
    meta: 10,
    progreso: 4,
    completada: false,
    reclamada: false,
    recompensa: {
      id: 2,
      nombre: 'Sobre de Comida',
      tipo: 'CATEGORIA',
      categoria: 'Gastronomía',
      marca: null,
      logoUrl: null,
    },
    cantidadRecompensa: 1,
  },
  {
    id: 3,
    nombre: 'Abrí 25 sobres esta semana',
    periodo: 'SEMANAL',
    objetivo: 'ABRIR_SOBRES',
    meta: 25,
    progreso: 25,
    completada: true,
    reclamada: true,
    recompensa: {
      id: 3,
      nombre: 'Sobre McDonald\'s',
      tipo: 'MARCA',
      categoria: 'Gastronomía',
      marca: 'McDonald\'s',
      logoUrl: 'https://example.com/mcdonalds.png',
    },
    cantidadRecompensa: 1,
  },
];

describe('MisionesService', () => {
  let servicio: MisionesService;
  let http: HttpTestingController;

  const pedidoDeMisiones = () => (req: { method: string; url: string }) =>
    req.method === 'GET' && req.url.endsWith('/api/Misiones');

  const cargar = (respuestas: MisionRespuesta[] = MISIONES_BACKEND): void => {
    servicio.cargarMisiones().subscribe();
    http.expectOne(pedidoDeMisiones()).flush(respuestas);
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(MisionesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('mapea las misiones del backend y apaga el estado de carga', () => {
    expect(servicio.cargando()).toBe(false);

    servicio.cargarMisiones().subscribe();
    expect(servicio.cargando()).toBe(true);

    http.expectOne(pedidoDeMisiones()).flush(MISIONES_BACKEND);

    expect(servicio.cargando()).toBe(false);
    expect(servicio.error()).toBeNull();
    expect(servicio.misiones().length).toBe(3);

    const primera = servicio.misiones()[0];
    expect(primera.titulo).toBe('Abrí 3 sobres');
    expect(primera.periodicidad).toBe('diaria');
    expect(primera.tipo).toBe('sobres_abiertos');
    expect(primera.actual).toBe(3);
    expect(primera.objetivo).toBe(3);
    expect(primera.estado).toBe('completada');
    expect(primera.recompensa).toEqual({
      tipo: 'generico',
      sobreId: 1,
      nombre: 'Sobre General',
    });
  });

  it('conserva el id del sobre de categoría y el de marca', () => {
    cargar();

    const comida = servicio.misiones().find((m) => m.id === 2)?.recompensa;
    expect(comida).toEqual({
      tipo: 'categoria',
      sobreId: 2,
      nombre: 'Sobre de Comida',
      categoria: 'gastronomia',
    });

    const marca = servicio.misiones().find((m) => m.id === 3)?.recompensa;
    expect(marca).toEqual({
      tipo: 'marca',
      sobreId: 3,
      nombre: 'McDonald\'s',
      logoUrl: 'https://example.com/mcdonalds.png',
      categoria: 'gastronomia',
    });
  });

  it('marca como reclamada la misión que ya viene reclamada del backend', () => {
    cargar();

    expect(servicio.misiones().find((m) => m.id === 3)?.estado).toBe('reclamada');
    expect(servicio.misiones().find((m) => m.id === 2)?.estado).toBe('en_curso');
  });

  it('filtra las misiones por periodicidad', () => {
    cargar();

    expect(servicio.misionesDe('diaria').map((m) => m.id)).toEqual([1]);
    expect(servicio.misionesDe('semanal').map((m) => m.id)).toEqual([2, 3]);
    expect(servicio.misionesDe('permanente')).toEqual([]);
  });

  it('expone el error del backend y vacía la lista si falla la carga', () => {
    servicio.cargarMisiones().subscribe({ error: () => undefined });

    http
      .expectOne(pedidoDeMisiones())
      .flush({ mensaje: 'No pudimos cargar las misiones.' }, { status: 500, statusText: 'Server Error' });

    expect(servicio.cargando()).toBe(false);
    expect(servicio.error()).toBe('No pudimos cargar las misiones.');
    expect(servicio.misiones()).toEqual([]);
  });

  it('muestra un mensaje amigable cuando el servidor no responde (status 0)', () => {
    servicio.cargarMisiones().subscribe({ error: () => undefined });

    http
      .expectOne(pedidoDeMisiones())
      .error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(servicio.error()).toContain('No pudimos conectarnos con el servidor');
    expect(servicio.error()).not.toContain('Http failure response');
  });

  it('reclama una misión y la marca como reclamada', () => {
    cargar();

    servicio.reclamar(1).subscribe();
    const pedido = http.expectOne(
      (req) => req.method === 'POST' && req.url.endsWith('/api/Misiones/1/reclamar'),
    );
    expect(pedido.request.body).toEqual({});
    pedido.flush({ sobreId: 1, sobre: 'Sobre General', cantidad: 1 });

    expect(servicio.misiones().find((m) => m.id === 1)?.estado).toBe('reclamada');
  });

  it('propaga el mensaje del backend al reclamar', () => {
    cargar();

    let mensaje: string | null = null;
    servicio.reclamar(1).subscribe({
      error: (error: Error) => (mensaje = error.message),
    });

    http
      .expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/Misiones/1/reclamar'))
      .flush(
        { mensaje: 'La misión todavía no está completada.' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(mensaje).toBe('La misión todavía no está completada.');
    expect(servicio.misiones().find((m) => m.id === 1)?.estado).toBe('completada');
  });

  it('ordena el PT System de menos a más faltantes', () => {
    servicio.cargarPity().subscribe();
    http
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/Sobres/pity'))
      .flush([
        { tipo: 'GENERAL', contador: 10, umbral: 40, sobresRestantes: 30, porcentaje: 25, garantizada: false },
        { tipo: 'CATEGORIA', contador: 18, umbral: 20, sobresRestantes: 2, porcentaje: 90, garantizada: false },
        { tipo: 'MARCA', contador: 5, umbral: 10, sobresRestantes: 5, porcentaje: 50, garantizada: false },
      ]);

    const faltantes = servicio.pityPorCercania().map(faltantesPity);
    expect(faltantes).toEqual([2, 5, 30]);
  });

  it('cargarPity mapea la respuesta del backend y actualiza los signals', () => {
    expect(servicio.cargandoPity()).toBe(false);

    servicio.cargarPity().subscribe();
    expect(servicio.cargandoPity()).toBe(true);

    http
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/Sobres/pity'))
      .flush([
        { tipo: 'MARCA', contador: 10, umbral: 10, sobresRestantes: 0, porcentaje: 100, garantizada: true },
        { tipo: 'GENERAL', contador: 0, umbral: 40, sobresRestantes: 40, porcentaje: 0, garantizada: false },
        { tipo: 'CATEGORIA', contador: 5, umbral: 20, sobresRestantes: 15, porcentaje: 25, garantizada: false },
      ]);

    expect(servicio.cargandoPity()).toBe(false);
    expect(servicio.errorPity()).toBeNull();
    const lista = servicio.pity();
    expect(lista.length).toBe(3);
    expect(lista[0].tipo).toBe('GENERAL');
    expect(lista[1].tipo).toBe('CATEGORIA');
    expect(lista[2].tipo).toBe('MARCA');
    expect(lista[2].garantizada).toBe(true);
  });

  it('mapea PERMANENTE y los 4 objetivos nuevos; un objetivo desconocido queda no disponible', () => {
    const extras: MisionRespuesta[] = [
      { ...MISIONES_BACKEND[0], id: 10, periodo: 'PERMANENTE' as MisionRespuesta['periodo'], objetivo: 'INICIAR_SESION' as MisionRespuesta['objetivo'] },
      { ...MISIONES_BACKEND[0], id: 11, periodo: 'PERMANENTE' as MisionRespuesta['periodo'], objetivo: 'JUGAR_PARTIDAS' as MisionRespuesta['objetivo'] },
      { ...MISIONES_BACKEND[0], id: 12, periodo: 'PERMANENTE' as MisionRespuesta['periodo'], objetivo: 'COMPLETAR_ALBUM' as MisionRespuesta['objetivo'] },
      { ...MISIONES_BACKEND[0], id: 13, periodo: 'PERMANENTE' as MisionRespuesta['periodo'], objetivo: 'COMPLETAR_TUTORIAL' as MisionRespuesta['objetivo'] },
      { ...MISIONES_BACKEND[0], id: 14, objetivo: 'OBJETIVO_DESCONOCIDO' as MisionRespuesta['objetivo'] },
    ];
    cargar(extras);

    expect(servicio.misionesDe('permanente').map((m) => [m.tipo, m.disponible])).toEqual([
      ['inicio_sesion', true],
      ['partidas_jugadas', true],
      ['completar_album', true],
      ['completar_tutorial', true],
    ]);
    expect(servicio.misiones().find((m) => m.id === 14)?.disponible).toBe(false);
  });

  it('cargarResumen calcula offsetRelojMs y falla en silencio devolviendo null', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-14T12:00:00.000Z'));

    servicio.cargarResumen().subscribe();
    http
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/Misiones/resumen'))
      .flush({
        fechaServidorUtc: '2026-11-14T12:05:00.000Z',
        diaria: { proximoReinicioUtc: '2026-11-15T00:00:00.000Z' },
        semanal: { proximoReinicioUtc: '2026-11-21T00:00:00.000Z' },
        bonoDiario: null,
      });

    expect(servicio.offsetRelojMs()).toBe(5 * 60 * 1000);
    expect(servicio.resumen()?.diaria?.proximoReinicioUtc).toBe('2026-11-15T00:00:00.000Z');

    let resultado: unknown = 'pendiente';
    servicio.cargarResumen().subscribe((res) => (resultado = res));
    http
      .expectOne((req) => req.method === 'GET' && req.url.endsWith('/api/Misiones/resumen'))
      .flush({}, { status: 404, statusText: 'Not Found' });

    expect(resultado).toBeNull();
    expect(servicio.resumen()).toBeNull();
    expect(servicio.error()).toBeNull();

    jest.useRealTimers();
  });

  it('reclamarTodas reclama en secuencia y resincroniza al final', () => {
    let respuestaFinal: readonly number[] | null = null;
    servicio.reclamarTodas([1, 2]).subscribe((res) => {
      respuestaFinal = res.misionesReclamadasIds;
    });

    // Solo debe haberse disparado el primer POST (secuencial, nunca en paralelo)
    http.expectNone((req) => req.url.endsWith('/api/Misiones/2/reclamar'));
    http
      .expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/Misiones/1/reclamar'))
      .flush({ sobreId: 1, sobre: 'Sobre 1', cantidad: 1 });

    http
      .expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/Misiones/2/reclamar'))
      .flush({ sobreId: 2, sobre: 'Sobre 2', cantidad: 1 });

    http.expectOne(pedidoDeMisiones()).flush(MISIONES_BACKEND);
    expect(respuestaFinal).toEqual([1, 2]);
  });

  it('reclamarTodas frena ante un error y resincroniza', () => {
    let fallo = false;
    servicio.reclamarTodas([1, 2]).subscribe({
      error: () => (fallo = true),
    });

    http
      .expectOne((req) => req.method === 'POST' && req.url.endsWith('/api/Misiones/1/reclamar'))
      .flush({ mensaje: 'Error' }, { status: 500, statusText: 'Error' });

    http.expectNone((req) => req.url.endsWith('/api/Misiones/2/reclamar'));
    http.expectOne(pedidoDeMisiones()).flush(MISIONES_BACKEND);
    expect(fallo).toBe(true);
  });
});
