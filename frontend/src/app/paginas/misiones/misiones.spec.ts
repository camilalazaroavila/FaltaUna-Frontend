import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { Mision } from '../../modelos/misiones.model';
import { TarjetaMision } from '../../compartidos/componentes/tarjeta-mision/tarjeta-mision';

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

  /** Escucha las emisiones de `reclamar` y las acumula. */
  const escucharReclamos = (): number[] => {
    const emitidos: number[] = [];
    fixture.componentInstance.reclamar.subscribe((id) => emitidos.push(id));
    return emitidos;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TarjetaMision] });
    fixture = TestBed.createComponent(TarjetaMision);
  });

  describe('contenido según estado', () => {
    it('muestra el título y el estado "En curso" en una misión en progreso', () => {
      const el = montar(crearMision());
      expect(el.textContent).toContain('Abrí 2 sobres');
      expect(el.textContent).toContain('En curso');
      expect(el.textContent).toContain('Misión en curso');
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
      expect(el.textContent).toContain('Misión no disponible todavía');
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
      expect(el.textContent).toContain('¡Reclamá tu sobre!');
    });

    it('no permite reclamar una misión en curso (el sobre no es clickeable)', () => {
      const el = montar(crearMision({ estado: 'en_curso' }));
      expect(el.querySelector('app-sobre-marca button')).toBeNull();
      expect(el.textContent).toContain('En curso');
    });

    it('marca visualmente una misión reclamada', () => {
      const el = montar(crearMision({ estado: 'reclamada' }));
      expect(el.textContent).toContain('Recompensa reclamada');
      expect(el.textContent).toContain('Reclamada');
      expect(el.querySelector('app-sobre-marca button')).toBeNull();
    });

    it('el indicador de una misión reclamada es un círculo verde', () => {
      const el = montar(crearMision({ estado: 'reclamada' }));
      const indicador = el.querySelector('article > span')!;
      expect(indicador.className).toContain('rounded-circulo');
      expect(indicador.className).toContain('bg-exito');
    });

    it('destaca una misión reclamable con el halo animado y el estado visible', () => {
      const el = montar(crearMision({ estado: 'completada' }));

      const articulo = el.querySelector('article')!;
      expect(articulo.className).toContain('animate-latido-reclamo');
      expect(el.textContent).toContain('¡Reclamá tu sobre!');
    });
  });

  describe('reclamo', () => {
    it('emite el id una sola vez al clickear el sobre', () => {
      const emitidos = escucharReclamos();
      const el = montar(crearMision({ id: 7, estado: 'completada' }));

      (el.querySelector('app-sobre-marca button') as HTMLButtonElement).click();

      expect(emitidos).toEqual([7]);
    });


  describe('íconos', () => {
    it.each<[string, Partial<Mision>]>([
      ['en curso', { estado: 'en_curso', disponible: true }],
      ['lista para reclamar', { estado: 'completada', disponible: true }],
      ['reclamada', { estado: 'reclamada', disponible: true }],
      ['no disponible', { disponible: false }],
    ])('el ícono del indicador (%s) toma el token fluido de tamaño', (_estado, parcial) => {
      const el = montar(crearMision(parcial));

      const icono = el.querySelector('ng-icon') as HTMLElement | null;
      expect(icono).not.toBeNull();
      expect(icono!.style.getPropertyValue('--ng-icon__size')).toBe(
        'var(--misiones-medida-indicador-icono)',
      );
    });
  });
});