import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelMisiones } from './panel-misiones';

describe('PanelMisiones', () => {
  let fixture: ComponentFixture<PanelMisiones>;

  const montar = (seccion: 'misiones' | 'pity' = 'misiones'): HTMLElement => {
    fixture.componentRef.setInput('seccionActiva', seccion);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const botonPorEtiqueta = (el: HTMLElement, etiqueta: string): HTMLButtonElement =>
    Array.from(el.querySelectorAll('button')).find(
      (b) => b.getAttribute('aria-label') === etiqueta,
    ) as HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PanelMisiones] });
    fixture = TestBed.createComponent(PanelMisiones);
  });

  it('renderiza los dos botones de sección con nombre accesible', () => {
    const el = montar();
    expect(botonPorEtiqueta(el, 'Misiones')).toBeTruthy();
    expect(botonPorEtiqueta(el, 'PT System')).toBeTruthy();
  });

  it('marca la sección activa con aria-current', () => {
    const el = montar('pity');
    expect(botonPorEtiqueta(el, 'PT System').getAttribute('aria-current')).toBe('true');
    expect(botonPorEtiqueta(el, 'Misiones').getAttribute('aria-current')).toBeNull();
  });

  it('emite la sección al hacer clic', () => {
    let elegida: 'misiones' | 'pity' | null = null;
    fixture.componentInstance.cambiar.subscribe((s) => (elegida = s));
    const el = montar();

    botonPorEtiqueta(el, 'PT System').click();

    expect(elegida).toBe('pity');
  });

  it('colapsa y expande las etiquetas con el botón dedicado', () => {
    const el = montar();
    expect(el.textContent).toContain('Misiones');

    botonPorEtiqueta(el, 'Colapsar panel de secciones').click();
    fixture.detectChanges();

    expect(el.textContent).not.toContain('PT System');
    expect(botonPorEtiqueta(el, 'Expandir panel de secciones')).toBeTruthy();
  });
});
