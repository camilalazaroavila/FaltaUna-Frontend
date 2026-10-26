import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarraProgreso } from './barra-progreso';

describe('BarraProgreso', () => {
  let fixture: ComponentFixture<BarraProgreso>;

  const montar = (actual: number, objetivo: number, variante: 'mision' | 'pity' = 'mision') => {
    fixture.componentRef.setInput('actual', actual);
    fixture.componentRef.setInput('objetivo', objetivo);
    fixture.componentRef.setInput('variante', variante);
    fixture.componentRef.setInput('etiqueta', 'Abrí 2 sobres');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BarraProgreso] });
    fixture = TestBed.createComponent(BarraProgreso);
  });

  it('expone los valores en el progressbar', () => {
    const barra = montar(1, 2).querySelector('[role="progressbar"]')!;
    expect(barra.getAttribute('aria-valuenow')).toBe('1');
    expect(barra.getAttribute('aria-valuemax')).toBe('2');
    expect(barra.getAttribute('aria-label')).toBe('Abrí 2 sobres');
    expect(barra.getAttribute('aria-valuetext')).toBe('1 de 2, 50%');
  });

  it('muestra el porcentaje por defecto', () => {
    expect(montar(1, 4).textContent).toContain('25% completado');
  });

  it('acota el porcentaje a 100 y tolera objetivo 0', () => {
    expect(montar(9, 4).textContent).toContain('100% completado');
    expect(montar(3, 0).textContent).toContain('0% completado');
  });

  it('aplica el color según la variante', () => {
    const relleno = montar(1, 2, 'pity').querySelector('span[aria-hidden="true"]')!;
    expect(relleno.className).toContain('bg-barra-pity-relleno');
  });
});