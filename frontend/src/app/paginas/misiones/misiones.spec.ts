import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { toast } from 'ngx-sonner';

import { AuthService } from '../../servicios/auth.service';
import { MisionesService } from '../../servicios/mision.services';
import { Misiones } from './misiones';

jest.mock('ngx-sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe('Misiones', () => {
  let fixture: ComponentFixture<Misiones>;
  let componente: Misiones;
  let servicio: MisionesService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Misiones],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { usuarioActual: () => null, logout: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Misiones);
    componente = fixture.componentInstance;
    servicio = TestBed.inject(MisionesService);
    fixture.detectChanges();
    jest.clearAllMocks();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('renderiza el encabezado con el título', () => {
    const titulo = fixture.nativeElement.querySelector('h1') as HTMLElement;
    expect(titulo.textContent?.trim()).toBe('Misiones');
  });

  it('muestra una pestaña por periodicidad', () => {
    const pestanas = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(pestanas.length).toBe(3);
    expect(pestanas[0].textContent).toContain('Diaria');
  });

  it('arranca en la pestaña Diaria seleccionada', () => {
    const pestanas = fixture.nativeElement.querySelectorAll('[role="tab"]');
    expect(pestanas[0].getAttribute('aria-selected')).toBe('true');
    expect(pestanas[1].getAttribute('aria-selected')).toBe('false');
  });

  it('lista las misiones de la periodicidad activa y oculta las otras pestañas', () => {
    const panelDiaria = fixture.nativeElement.querySelector('#panel-diaria') as HTMLElement;
    const panelSemanal = fixture.nativeElement.querySelector('#panel-semanal') as HTMLElement;

    expect(panelDiaria.querySelectorAll('app-tarjeta-mision').length).toBe(
      servicio.misionesDe('diaria').length,
    );
    expect(panelDiaria.hasAttribute('hidden')).toBe(false);
    expect(panelSemanal.hasAttribute('hidden')).toBe(true);
  });

  it('cambia de sección a PT System y muestra filtros y filas', () => {
    componente.cambiarSeccion('pity');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-desplegable-seleccion').length).toBe(3);
    expect(fixture.nativeElement.querySelectorAll('app-tarjeta-pity').length).toBe(
      servicio.pity().length,
    );
  });

  it('reclama una misión completada y avisa con un toast de éxito', () => {
    const completada = servicio.misiones().find((m) => m.estado === 'completada')!;

    componente.reclamarMision(completada.id);
    fixture.detectChanges();

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(servicio.misiones().find((m) => m.id === completada.id)?.estado).toBe('reclamada');
  });

  it('avisa con un toast de error al reclamar una misión en curso', () => {
    componente.reclamarMision(3);
    fixture.detectChanges();

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('filtra el PT System por categoría', () => {
    componente.cambiarSeccion('pity');
    componente.cambiarCategoria('musica');
    fixture.detectChanges();

    const filas = componente['pityFiltrado']();
    expect(filas.length).toBeGreaterThan(0);
    expect(filas.every((p) => p.sobre.tipo === 'categoria' && p.sobre.categoria === 'musica')).toBe(
      true,
    );
  });

  it('la categoría incluye también las marcas que le pertenecen', () => {
    componente.cambiarSeccion('pity');
    componente.cambiarCategoria('gastronomia');
    fixture.detectChanges();

    const filas = componente['pityFiltrado']();
    const tieneMarca = filas.some((p) => p.sobre.tipo === 'marca');
    const tieneCategoria = filas.some(
      (p) => p.sobre.tipo === 'categoria' && p.sobre.categoria === 'gastronomia',
    );

    expect(tieneCategoria).toBe(true);
    expect(tieneMarca).toBe(true);
  });

  it('ofrece las seis categorías del catálogo en el filtro', () => {
    componente.cambiarSeccion('pity');
    fixture.detectChanges();

    expect(componente['opcionesCategoria'].length).toBe(6);
  });

  it('ordena el PT System por nombre cuando corresponde', () => {
    componente.cambiarSeccion('pity');
    componente.cambiarOrden('nombre');
    fixture.detectChanges();

    const etiquetas = componente['pityFiltrado']().map((p) => {
      if (p.sobre.tipo === 'categoria') return p.sobre.categoria;
      if (p.sobre.tipo === 'marca') return p.sobre.nombre;
      return 'Sobres generales';
    });
    expect(etiquetas).toEqual([...etiquetas].sort((a, b) => a.localeCompare(b, 'es')));
  });

  it('limpia los filtros del PT System desde el estado vacío', () => {
    componente.cambiarSeccion('pity');
    componente.cambiarCategoria('musica');
    componente.cambiarMarca('Grido');
    fixture.detectChanges();

    expect(componente['pityFiltrado']().length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('No hay sobres que coincidan');

    componente.limpiarFiltrosPity();
    fixture.detectChanges();

    expect(componente['pityFiltrado']().length).toBe(servicio.pity().length);
  });

  it('navega entre pestañas con las flechas', () => {
    const evento = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    componente.alTecladoPestanas(evento, 0);
    fixture.detectChanges();

    expect(componente['periodicidadActiva']()).toBe('semanal');
  });
});
