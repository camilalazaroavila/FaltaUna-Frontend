import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Mision } from '@modelos/misiones.model';
import { TarjetaMision } from './tarjeta-mision';

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

describe('TarjetaMision', () => {
  let fixture: ComponentFixture<TarjetaMision>;

  const montar = (mision: Mision, mostrarRecompensa = true): HTMLElement => {
    fixture.componentRef.setInput('mision', mision);
    fixture.componentRef.setInput('mostrarRecompensa', mostrarRecompensa);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TarjetaMision] });
    fixture = TestBed.createComponent(TarjetaMision);
  });

  it('muestra el título y el estado "En curso" en una misión en progreso', () => {
    const el = montar(crearMision());
    expect(el.textContent).toContain('Abrí 2 sobres');
    expect(el.textContent).toContain('En curso');
    expect(el.textContent).toContain('Misión en curso');
  });

  it('renderiza la barra de progreso compacta (sm) cuando la misión está disponible', () => {
    const el = montar(crearMision());
    const barra = el.querySelector('app-barra-progreso');
    expect(barra).not.toBeNull();
    expect(barra?.textContent).toContain('1/2');
  });

  it('no muestra la barra ni la recompensa cuando no está disponible', () => {
    const el = montar(
      crearMision({ disponible: false, tipo: 'partidas_jugadas', recompensa: null }),
    );
    expect(el.textContent).toContain('Próximamente');
    expect(el.textContent).toContain('Misión no disponible todavía');
    expect(el.querySelector('app-barra-progreso')).toBeNull();
    expect(el.querySelector('app-sobre-marca')).toBeNull();
  });

  it('en modo recompensa, una misión completada muestra "Lista para reclamar", halo y sobre clickeable', () => {
    const el = montar(
      crearMision({
        periodicidad: 'semanal',
        estado: 'completada',
        recompensa: { tipo: 'categoria', categoria: 'gastronomia' },
      }),
      true,
    );
    const boton = el.querySelector('app-sobre-marca button')!;
    const articulo = el.querySelector('article')!;
    expect(boton.getAttribute('aria-label')).toBe('Sobre de Gastronomía');
    expect(el.textContent).toContain('Lista para reclamar');
    expect(el.textContent).toContain('Reclamar');
    expect(articulo.className).toContain('animate-latido-reclamo');
  });

  it('emite el id al reclamar una misión completada con recompensa', () => {
    let reclamado: number | null = null;
    fixture.componentInstance.reclamar.subscribe((id) => (reclamado = id));
    const el = montar(crearMision({ id: 7, periodicidad: 'semanal', estado: 'completada' }), true);

    el.querySelector('app-sobre-marca button')!.dispatchEvent(new MouseEvent('click'));

    expect(reclamado).toBe(7);
  });

  it('en modo Diaria (mostrarRecompensa = false) no muestra sobre, ni botón ni energía y muestra "Completada"', () => {
    let reclamado: number | null = null;
    fixture.componentInstance.reclamar.subscribe((id) => (reclamado = id));
    const el = montar(crearMision({ id: 9, periodicidad: 'diaria', estado: 'completada' }), false);

    const articulo = el.querySelector('article')!;
    articulo.dispatchEvent(new MouseEvent('click'));

    expect(el.querySelector('app-sobre-marca')).toBeNull();
    expect(el.querySelector('button')).toBeNull();
    expect(el.textContent).toContain('Completada');
    expect(el.textContent).not.toContain('Reclamar');
    expect(articulo.className).not.toContain('animate-latido-reclamo');
    expect(reclamado).toBeNull();
  });

  it('no permite reclamar una misión en curso (el sobre no es clickeable)', () => {
    const el = montar(crearMision({ estado: 'en_curso' }), true);
    expect(el.querySelector('app-sobre-marca button')).toBeNull();
    expect(el.textContent).toContain('En curso');
  });

  it('marca visualmente una misión reclamada', () => {
    const el = montar(crearMision({ periodicidad: 'semanal', estado: 'reclamada' }), true);
    expect(el.textContent).toContain('Recompensa reclamada');
    expect(el.textContent).toContain('Reclamada');
    expect(el.querySelector('app-sobre-marca button')).toBeNull();
  });

  it('el ícono del candado en misión no disponible toma el token fluido de tamaño', () => {
    const el = montar(crearMision({ disponible: false }));
    const icono = el.querySelector('ng-icon');
    expect(icono).not.toBeNull();
    expect(icono?.getAttribute('style') ?? icono?.outerHTML).toContain(
      'var(--misiones-medida-indicador-icono)',
    );
  });
});
