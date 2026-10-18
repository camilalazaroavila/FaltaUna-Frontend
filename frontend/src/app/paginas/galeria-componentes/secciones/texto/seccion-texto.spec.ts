import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeccionTexto } from './seccion-texto';

describe('SeccionTexto', () => {
  let fixture: ComponentFixture<SeccionTexto>;

  const html = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionTexto],
    }).compileComponents();

    fixture = TestBed.createComponent(SeccionTexto);
    fixture.detectChanges();
  });

  it('debe renderizar un bloque por modo con su data-modo en orden', () => {
    const bloques = Array.from(html().querySelectorAll<HTMLElement>('[data-modo]'));

    expect(bloques.map((bloque) => bloque.getAttribute('data-modo'))).toEqual([
      'jugador',
      'empresa',
    ]);
  });

  it('debe fijar fondo de app y color de texto primario en cada bloque de modo', () => {
    const bloque = html().querySelector<HTMLElement>('[data-modo="jugador"]') as HTMLElement;

    expect(bloque.classList.contains('bg-fondo-app')).toBe(true);
    expect(bloque.classList.contains('text-texto-primario')).toBe(true);
  });

  it('debe mostrar los cuatro tamaños de título', () => {
    for (const clase of ['text-display', 'text-titulo', 'text-subtitulo', 'text-cuerpo']) {
      expect(html().querySelector(`h4.${clase}`)).not.toBeNull();
    }
  });

  it('debe mostrar todas las variantes de color de texto', () => {
    expect(html().querySelector('h4.text-texto-primario')).not.toBeNull();
    expect(html().querySelector('h4.text-texto-secundario')).not.toBeNull();
    expect(html().querySelector('h4.text-texto-apagado')).not.toBeNull();
    expect(html().querySelector('h4.text-marca-primaria')).not.toBeNull();
  });

  it('debe mostrar un ejemplo de cada etiqueta semántica soportada', () => {
    const demo = html().querySelector<HTMLElement>('[aria-hidden="true"]') as HTMLElement;

    expect(demo).not.toBeNull();

    for (const etiqueta of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span']) {
      expect(demo.querySelector(etiqueta)).not.toBeNull();
    }
  });

  it('debe exponer el título largo sin espacios para validar el desborde', () => {
    expect(html().textContent).toContain('SupercalifragilisticoespialidosoSinEspacios');
  });

  it('debe documentar que el texto apagado no se usa sobre superficies elevadas', () => {
    expect(html().textContent).toContain('no usar texto apagado sobre superficies elevadas');
  });
});
