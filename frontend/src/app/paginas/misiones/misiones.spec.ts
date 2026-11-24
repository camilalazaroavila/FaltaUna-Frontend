import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import type {
  Mision,
  Periodicidad,
  ProgresoPity,
  ResumenMisionesRespuesta,
} from '@modelos/misiones.model';
import { Misiones } from './misiones';
import { MisionesService } from '@servicios/mision.services';
import { SobresService } from '@servicios/sobres.service';
import { AuthService } from '@servicios/auth.service';
import { SonidoService } from '@servicios/sonido.service';

const crearMision = (parcial: Partial<Mision> = {}): Mision => ({
  id: 1,
  titulo: 'Abrí 2 sobres',
  tipo: 'sobres_abiertos',
  periodicidad: 'diaria',
  actual: 1,
  objetivo: 2,
  estado: 'en_curso',
  recompensa: { tipo: 'generico' },
  disponible: true,
  ...parcial,
});

const crearResumen = (
  parcial: Partial<ResumenMisionesRespuesta> = {},
): ResumenMisionesRespuesta => ({
  fechaServidorUtc: '2026-11-14T18:00:00Z',
  diaria: { proximoReinicioUtc: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() },
  semanal: { proximoReinicioUtc: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
  bonoDiario: {
    totalRequeridas: 4,
    completadas: 2,
    disponible: false,
    reclamado: false,
    recompensa: {
      id: 0,
      nombre: 'Sobre estándar',
      tipo: 'GENERAL',
      categoria: null,
      marca: null,
      logoUrl: null,
    },
    cantidadRecompensa: 1,
  },
  ...parcial,
});

describe('Misiones (página)', () => {
  let fixture: ComponentFixture<Misiones>;
  let misionesSignal: ReturnType<typeof signal<readonly Mision[]>>;
  let resumenSignal: ReturnType<typeof signal<ResumenMisionesRespuesta | null>>;
  let servicioMock: {
    cargarMisiones: jest.Mock;
    cargarResumen: jest.Mock;
    reclamar: jest.Mock;
    reclamarBono: jest.Mock;
    reclamarTodas: jest.Mock;
    cargando: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    misiones: ReturnType<typeof signal<readonly Mision[]>>;
    pity: ReturnType<typeof signal<readonly ProgresoPity[]>>;
    pityPorCercania: ReturnType<typeof signal<readonly ProgresoPity[]>>;
    resumen: ReturnType<typeof signal<ResumenMisionesRespuesta | null>>;
    offsetRelojMs: ReturnType<typeof signal<number>>;
    misionesDe: (p: Periodicidad) => readonly Mision[];
  };

  beforeEach(async () => {
    misionesSignal = signal<readonly Mision[]>([]);
    resumenSignal = signal<ResumenMisionesRespuesta | null>(null);

    servicioMock = {
      cargarMisiones: jest.fn(() => of(void 0)),
      cargarResumen: jest.fn(() => of(null)),
      reclamar: jest.fn(() => of({ sobreId: 1, sobre: 'General', cantidad: 1 })),
      reclamarBono: jest.fn(() => of({ sobreId: 1, nombre: 'Bono', cantidad: 1 })),
      reclamarTodas: jest.fn(() => of({ misionesReclamadasIds: [], recompensas: [] })),
      cargando: signal(false),
      error: signal<string | null>(null),
      misiones: misionesSignal,
      pity: signal<readonly ProgresoPity[]>([]),
      pityPorCercania: signal<readonly ProgresoPity[]>([]),
      resumen: resumenSignal,
      offsetRelojMs: signal(0),
      misionesDe: (p) => misionesSignal().filter((m) => m.periodicidad === p),
    };

    await TestBed.configureTestingModule({
      imports: [Misiones],
      providers: [
        provideRouter([]),
        { provide: MisionesService, useValue: servicioMock },
        {
          provide: SobresService,
          useValue: {
            obtenerSobres: () => of([]),
            obtenerInventarioSobres: () => of([]),
            cargarEstadoDiario: () => of(null),
            sobresDisponibles: signal({ actuales: 0, maximo: 2 }),
          },
        },
        { provide: AuthService, useValue: { usuarioActual: signal(null) } },
        { provide: SonidoService, useValue: { reproducir: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Misiones);
  });

  it('muestra bono diario con fallback local cuando resumen es null', () => {
    misionesSignal.set([
      crearMision({ id: 1, periodicidad: 'diaria', estado: 'en_curso' }),
      crearMision({ id: 2, periodicidad: 'diaria', estado: 'completada' }),
    ]);
    resumenSignal.set(null);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-barra-bono-misiones')).not.toBeNull();
  });

  it('muestra bono diario sin contenedor app-caja cuando resumen tiene bonoDiario y oculta sobres y "Reclamar todas" en Diaria', () => {
    misionesSignal.set([
      crearMision({ id: 1, titulo: 'Completada hoy', periodicidad: 'diaria', estado: 'completada' }),
      crearMision({ id: 2, titulo: 'En curso hoy', periodicidad: 'diaria', estado: 'en_curso' }),
    ]);
    resumenSignal.set(crearResumen());
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-barra-bono-misiones')).not.toBeNull();
    expect(el.querySelector('app-caja')).toBeNull();
    expect(el.querySelector('app-panel-misiones')).toBeNull();
    expect(el.querySelector('#panel-diaria app-sobre-marca')).toBeNull();
    expect(el.querySelector('.misiones__reclamar-todas')).toBeNull();

    // Orden Diaria: en_curso arriba, completada abajo
    const titulos = Array.from(el.querySelectorAll('#panel-diaria app-tarjeta-mision h3')).map((h) =>
      h.textContent?.trim(),
    );
    expect(titulos).toEqual(['En curso hoy', 'Completada hoy']);
  });

  it('en Semanal muestra sobres, ordena completada primero y habilita "Reclamar todas (N)"', () => {
    misionesSignal.set([
      crearMision({ id: 10, titulo: 'Semanal en curso', periodicidad: 'semanal', estado: 'en_curso' }),
      crearMision({ id: 11, titulo: 'Semanal lista', periodicidad: 'semanal', estado: 'completada' }),
      crearMision({ id: 12, titulo: 'Semanal reclamada', periodicidad: 'semanal', estado: 'reclamada' }),
    ]);
    resumenSignal.set(crearResumen());
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('#pestana-semanal') as HTMLButtonElement).click();
    fixture.detectChanges();

    const titulos = Array.from(el.querySelectorAll('#panel-semanal app-tarjeta-mision h3')).map(
      (h) => h.textContent?.trim(),
    );
    expect(titulos).toEqual(['Semanal lista', 'Semanal en curso', 'Semanal reclamada']);

    const botonTodas = el.querySelector('.misiones__reclamar-todas') as HTMLButtonElement;
    expect(botonTodas).not.toBeNull();
    expect(botonTodas.textContent).toContain('Reclamar todas (1)');
    expect(el.querySelector('#panel-semanal app-sobre-marca')).not.toBeNull();
  });

  it('en Permanente muestra sobres con recompensas, ordena completadas primero y no muestra contador de reinicio', () => {
    misionesSignal.set([
      crearMision({ id: 20, titulo: 'Permanente en curso', periodicidad: 'permanente', estado: 'en_curso' }),
      crearMision({ id: 21, titulo: 'Permanente lista', periodicidad: 'permanente', estado: 'completada' }),
      crearMision({ id: 22, titulo: 'Permanente reclamada', periodicidad: 'permanente', estado: 'reclamada' }),
    ]);
    resumenSignal.set(crearResumen());
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('#pestana-permanente') as HTMLButtonElement).click();
    fixture.detectChanges();

    const titulos = Array.from(el.querySelectorAll('#panel-permanente app-tarjeta-mision h3')).map(
      (h) => h.textContent?.trim(),
    );
    expect(titulos).toEqual(['Permanente lista', 'Permanente en curso', 'Permanente reclamada']);
    expect(el.querySelector('#panel-permanente app-sobre-marca')).not.toBeNull();
    expect(el.querySelector('app-reinicio-misiones')).toBeNull();

    const botonTodas = el.querySelector('.misiones__reclamar-todas') as HTMLButtonElement;
    expect(botonTodas).not.toBeNull();
    expect(botonTodas.textContent).toContain('Reclamar todas (1)');
  });

  it('expone acceso a PT System para mobile (/usuario/misiones/pity)', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('a[href="/usuario/misiones/pity"]')).not.toBeNull();
  });
});
