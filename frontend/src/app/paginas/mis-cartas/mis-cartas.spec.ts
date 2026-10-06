import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CARTAS_MOCK } from '../../modelos/cartas.mock';
import type { Carta, CategoriaCarta } from '../../modelos/carta.model';
import { MisCartas } from './mis-cartas';


function silenciarAvisosDeSanitizado(): void {
  const original = console.warn.bind(console);
  jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('sanitizing unsafe URL value')) {
      return;
    }
    original(...(args as []));
  });
}

describe('MisCartas', () => {
  let fixture: ComponentFixture<MisCartas>;
  let componente: MisCartas;

  const nombres = () => componente['cartasFiltradas']().map((c) => c.nombre);
  const renderizadas = (): Carta[] => componente['cartasFiltradas']();

  const buscar = (texto: string): void => {
    componente.actualizarBusqueda({ target: { value: texto } } as unknown as Event);
    fixture.detectChanges();
  };

  const filtrarPor = (valor: 'todas' | 'obtenidas' | 'no-obtenidas'): void => {
    componente.cambiarFiltroObtencion(valor);
    fixture.detectChanges();
  };

  const elegirCategoria = (categoria: CategoriaCarta | null): void => {
    if (categoria) {
      componente.toggleCategoria(categoria);
    }
    fixture.detectChanges();
  };

  const ordenarPor = (valor: string): void => {
    componente.cambiarOrden({ target: { value: valor } } as unknown as Event);
    fixture.detectChanges();
  };

  beforeAll(() => {
    silenciarAvisosDeSanitizado();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisCartas],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MisCartas);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe renderizar la colección completa al inicio, sin filtros', () => {
    expect(renderizadas().length).toBe(CARTAS_MOCK.length);
    expect(fixture.nativeElement.querySelectorAll('app-carta').length).toBe(CARTAS_MOCK.length);
  });

  it('debe renderizar el encabezado con el título y el botón placeholder', () => {
    const titulo = fixture.nativeElement.querySelector('h1') as HTMLElement;
    const boton = fixture.nativeElement.querySelector('button') as HTMLElement;

    expect(titulo.textContent?.trim()).toBe('Mis cartas');
    expect(boton.textContent?.trim().toLowerCase()).toBe('construir baraja');
  });

  it('debe filtrar por nombre mientras se escribe, sin distinguir mayúsculas', () => {
    buscar('danon');

    expect(nombres()).toEqual(['Danonino']);
  });

  it('debe combinar búsqueda, estado de obtención y categoría', () => {
    buscar('a');
    filtrarPor('obtenidas');
    elegirCategoria('gastronomia');

    const resultado = renderizadas();
    expect(resultado.length).toBeGreaterThan(0);
    for (const c of resultado) {
      expect(c.nombre.toLowerCase()).toContain('a');
      expect(c.obtenida).toBe(true);
      expect(c.categoria).toBe('gastronomia');
    }
  });

  it('debe separar obtenidas de no obtenidas', () => {
    filtrarPor('obtenidas');
    expect(renderizadas().every((c) => c.obtenida)).toBe(true);

    filtrarPor('no-obtenidas');
    expect(renderizadas().every((c) => !c.obtenida)).toBe(true);

    filtrarPor('todas');
    expect(renderizadas().length).toBe(CARTAS_MOCK.length);
  });

  it('debe filtrar por categoría y deseleccionar la misma para volver a ver todas', () => {
    elegirCategoria('musica');
    expect(renderizadas().every((c) => c.categoria === 'musica')).toBe(true);

    elegirCategoria('musica');
    expect(renderizadas().length).toBe(CARTAS_MOCK.length);
    expect(componente['categoriaActiva']()).toBeNull();
  });

  it('debe ordenar por nombre A-Z y Z-A sin mutar la colección original', () => {
    ordenarPor('nombre-asc');
    const ascendente = [...nombres()];
    expect(ascendente).toEqual([...ascendente].sort((a, b) => a.localeCompare(b, 'es')));

    ordenarPor('nombre-desc');
    expect(nombres()).toEqual([...ascendente].reverse());
  });

  it('debe ordenar por rareza de menor a mayor', () => {
    ordenarPor('rareza');

    const rarezas = renderizadas().map((c) => c.rareza);
    const esperada = ['comun', 'rara', 'epicarta', 'legendaria'];
    const indices = rarezas.map((r) => esperada.indexOf(r));

    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it('debe ordenar por categoría siguiendo el orden de la columna lateral', () => {
    ordenarPor('categoria');

    const ordenEsperado: CategoriaCarta[] = [
      'gastronomia',
      'cosmeticos',
      'decoracion',
      'indumentaria',
      'entretenimiento',
      'musica',
      'tecnologia',
    ];
    const indices = renderizadas().map((c) => ordenEsperado.indexOf(c.categoria));

    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it('debe mostrar el estado vacío cuando ningún filtro deja resultados', () => {
    buscar('no existe ninguna carta');

    expect(componente['sinResultados']()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-carta')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No se encontraron cartas');
  });

  it('debe limpiar todos los filtros desde el estado vacío', () => {
    buscar('zzz');
    filtrarPor('no-obtenidas');
    elegirCategoria('musica');
    expect(componente['sinResultados']()).toBe(true);

    componente.limpiarFiltros();
    fixture.detectChanges();

    expect(renderizadas().length).toBe(CARTAS_MOCK.length);
  });

  it('debe marcar visualmente la categoría activa', () => {
    const botones = fixture.nativeElement.querySelectorAll(
      'aside[aria-label="Filtrar por categoría"] button',
    ) as NodeListOf<HTMLButtonElement>;

    expect(botones.length).toBe(7);
    botones[0].click();
    fixture.detectChanges();

    expect(componente['categoriaActiva']()).toBe('gastronomia');
    expect(botones[0].classList.contains('bg-marca-coleccion-fondo')).toBe(true);
    expect(botones[0].classList.contains('text-marca-coleccion')).toBe(true);
    expect(botones[0].getAttribute('aria-pressed')).toBe('true');
    expect(botones[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('debe marcar el filtro de obtención activo', () => {
    const grupo = fixture.nativeElement.querySelector('[role="group"]');
    const segmentos = grupo.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;

    expect(segmentos.length).toBe(3);
    segmentos[1].click();
    fixture.detectChanges();

    expect(componente['filtroObtencion']()).toBe('obtenidas');
    expect(segmentos[1].getAttribute('aria-pressed')).toBe('true');
    expect(segmentos[1].classList.contains('bg-marca-coleccion')).toBe(true);
    expect(segmentos[0].getAttribute('aria-pressed')).toBe('false');
  });
});
