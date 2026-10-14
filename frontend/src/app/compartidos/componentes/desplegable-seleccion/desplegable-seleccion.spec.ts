import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesplegableSeleccion } from './desplegable-seleccion';

const OPCIONES = [
  { valor: 'musica', etiqueta: 'Música' },
  { valor: 'tecnologia', etiqueta: 'Tecnología' },
];

describe('DesplegableSeleccion', () => {
  let fixture: ComponentFixture<DesplegableSeleccion>;

  const montar = (valor: string | null = null): HTMLElement => {
    fixture.componentRef.setInput('etiqueta', 'Elegir categoría');
    fixture.componentRef.setInput('opciones', OPCIONES);
    fixture.componentRef.setInput('valor', valor);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  const disparador = (el: HTMLElement): HTMLButtonElement =>
    el.querySelector('button') as HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DesplegableSeleccion] });
    fixture = TestBed.createComponent(DesplegableSeleccion);
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('muestra el marcador cuando no hay selección', () => {
    expect(montar().textContent).toContain('Todas');
  });

  it('muestra la etiqueta de la opción seleccionada', () => {
    const el = montar('musica');
    expect(disparador(el).textContent).toContain('Música');
  });

  it('abre la lista y anuncia el estado con aria-expanded', () => {
    const el = montar();
    expect(disparador(el).getAttribute('aria-expanded')).toBe('false');

    disparador(el).click();
    fixture.detectChanges();

    expect(disparador(el).getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('[role="listbox"]')).not.toBeNull();
  });

  it('emite el valor al elegir una opción y cierra', () => {
    let elegido: string | null = 'sin-cambio';
    fixture.componentInstance.valorCambiar.subscribe((v) => (elegido = v));
    const el = montar();

    disparador(el).click();
    fixture.detectChanges();

    const opcion = Array.from(el.querySelectorAll('[role="option"]')).find((o) =>
      o.textContent?.includes('Música'),
    )!;
    (opcion as HTMLElement).click();
    fixture.detectChanges();

    expect(elegido).toBe('musica');
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  it('permite elegir con el teclado', () => {
    let elegido: string | null = null;
    fixture.componentInstance.valorCambiar.subscribe((v) => (elegido = v));
    const el = montar();

    disparador(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(el.querySelector('[role="listbox"]')).not.toBeNull();

    disparador(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    disparador(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(elegido).toBe('musica');
  });

  it('muestra la etiqueta junto al valor cuando mostrarEtiqueta está activo', () => {
    fixture.componentRef.setInput('etiqueta', 'Categoría');
    fixture.componentRef.setInput('opciones', OPCIONES);
    fixture.componentRef.setInput('valor', null);
    fixture.componentRef.setInput('mostrarEtiqueta', true);
    fixture.detectChanges();

    const texto = disparador(fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Categoría:');
    expect(texto).toContain('Todas');
  });

  it('cierra con Escape', () => {
    const el = montar();
    disparador(el).click();
    fixture.detectChanges();

    disparador(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });
});
