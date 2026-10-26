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
    const faltantes = servicio.pityPorCercania().map(faltantesPity);
    expect(faltantes).toEqual([...faltantes].sort((a, b) => a - b));
  });
});
