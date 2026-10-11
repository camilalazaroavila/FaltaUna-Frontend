import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Mision } from '../../../modelos/misiones.model';
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

  const montar = (mision: Mision): HTMLElement => {
    fixture.componentRef.setInput('mision', mision);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TarjetaMision] });
    fixture = TestBed.createComponent(TarjetaMision);
  });

  it('muestra el título y, en las diarias, la etiqueta de renovación cada 24 h', () => {
    const el = montar(crearMision());
    expect(el.textContent).toContain('Abrí 2 sobres');
    expect(el.textContent).toContain('Se renueva cada 24 h');
  });

  it('en las misiones no diarias muestra la periodicidad', () => {
    const el = montar(crearMision({ periodicidad: 'semanal' }));
    expect(el.textContent).toContain('Semanal');
    expect(el.textContent).not.toContain('Se renueva cada 24 h');
  });

  it('renderiza la barra de progreso cuando la misión está disponible', () => {
    const el = montar(crearMision());
    expect(el.querySelector('app-barra-progreso')).not.toBeNull();
  });

  it('no muestra la barra ni la recompensa cuando no está disponible', () => {
    const el = montar(
      crearMision({ disponible: false, tipo: 'partidas_jugadas', recompensa: null }),
    );
    expect(el.textContent).toContain('Próximamente');
    expect(el.querySelector('app-barra-progreso')).toBeNull();
    expect(el.querySelector('app-sobre-marca')).toBeNull();
  });

  it('en una misión completada el sobre es clickeable y la recompensa está lista', () => {
    const el = montar(
      crearMision({
        estado: 'completada',
        recompensa: { tipo: 'categoria', categoria: 'gastronomia' },
      }),
    );
    const boton = el.querySelector('app-sobre-marca button')!;
    expect(boton.getAttribute('aria-label')).toBe('Sobre de Gastronomía');
    expect(el.textContent).toContain('Reclamar');
  });

  it('emite el id al reclamar una misión completada', () => {
    let reclamado: number | null = null;
    fixture.componentInstance.reclamar.subscribe((id) => (reclamado = id));
    const el = montar(crearMision({ id: 7, estado: 'completada' }));

    el.querySelector('app-sobre-marca button')!.dispatchEvent(new MouseEvent('click'));

    expect(reclamado).toBe(7);
  });

  it('no permite reclamar una misión en curso (el sobre no es clickeable)', () => {
    const el = montar(crearMision({ estado: 'en_curso' }));
    expect(el.querySelector('app-sobre-marca button')).toBeNull();
    expect(el.textContent).toContain('Recompensa pendiente');
  });

  it('marca visualmente una misión reclamada', () => {
    const el = montar(crearMision({ estado: 'reclamada' }));
    expect(el.textContent).toContain('Recompensa reclamada');
    expect(el.querySelector('app-sobre-marca button')).toBeNull();
  });
});
