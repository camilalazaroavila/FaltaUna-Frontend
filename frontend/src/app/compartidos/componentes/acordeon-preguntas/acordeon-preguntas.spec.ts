import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcordeonPregunta } from './acordeon-preguntas';

describe('AcordeonPregunta', () => {
  let fixture: ComponentFixture<AcordeonPregunta>;

  const obtenerBoton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AcordeonPregunta] }).compileComponents();
    fixture = TestBed.createComponent(AcordeonPregunta);
    fixture.componentRef.setInput('pregunta', '¿Es gratis?');
    fixture.detectChanges();
  });

  it('muestra la pregunta y arranca cerrado', () => {
    expect(obtenerBoton().textContent).toContain('¿Es gratis?');
    expect(obtenerBoton().getAttribute('aria-expanded')).toBe('false');
  });

  it('se abre y se cierra al hacer clic', () => {
    obtenerBoton().click();
    fixture.detectChanges();
    expect(obtenerBoton().getAttribute('aria-expanded')).toBe('true');

    obtenerBoton().click();
    fixture.detectChanges();
    expect(obtenerBoton().getAttribute('aria-expanded')).toBe('false');
  });

  it('el panel apunta a la cabecera y la cabecera al panel', () => {
    const panel = fixture.nativeElement.querySelector('[role="region"]') as HTMLElement;
    expect(obtenerBoton().getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(obtenerBoton().id);
  });
});