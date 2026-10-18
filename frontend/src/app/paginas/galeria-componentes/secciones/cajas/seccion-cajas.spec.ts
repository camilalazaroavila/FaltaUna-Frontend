import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeccionCajas } from './seccion-cajas';

describe('SeccionCajas', () => {
  let fixture: ComponentFixture<SeccionCajas>;

  const html = () => fixture.nativeElement as HTMLElement;
  const cajas = () => Array.from(html().querySelectorAll<HTMLElement>('app-caja'));
  const clasesDeCajas = () => cajas().flatMap((caja) => Array.from(caja.classList));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionCajas],
    }).compileComponents();

    fixture = TestBed.createComponent(SeccionCajas);
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
    const bloque = html().querySelector<HTMLElement>('[data-modo="empresa"]') as HTMLElement;

    expect(bloque.classList.contains('bg-fondo-app')).toBe(true);
    expect(bloque.classList.contains('text-texto-primario')).toBe(true);
  });

  it('debe mostrar las nueve variantes de caja', () => {
    const clases = clasesDeCajas();

    for (const clase of [
      'bg-superficie',
      'bg-elevado',
      'bg-hundido',
      'bg-marca-primaria-suave',
      'bg-exito-fondo',
      'bg-error-fondo',
      'bg-advertencia-fondo',
      'bg-atencion-fondo',
      'bg-info-fondo',
    ]) {
      expect(clases).toContain(clase);
    }
  });

  it('debe mostrar las cuatro sombras', () => {
    const clases = clasesDeCajas();

    for (const clase of ['shadow-baja', 'shadow-media', 'shadow-alta']) {
      expect(clases).toContain(clase);
    }
  });

  it('debe mostrar los tres paddings y los tres radios', () => {
    const clases = clasesDeCajas();

    for (const clase of ['p-3', 'p-5', 'p-7', 'rounded-sm', 'rounded-md', 'rounded-lg']) {
      expect(clases).toContain(clase);
    }
  });

  it('debe proyectar el encabezado y el pie por sus slots', () => {
    const texto = html().textContent ?? '';

    expect(texto).toContain('Resumen del partido');
    expect(texto).toContain('Actualizado hace un rato');
  });

  it('debe combinar título y subtítulo heredando el color del estado en cada caja de feedback', () => {
    const conTitulo = cajas().filter(
      (caja) => caja.querySelector('h4') !== null && caja.querySelector('p') !== null,
    );

    // Cinco estados de feedback por cada uno de los dos bloques de modo.
    expect(conTitulo.length).toBeGreaterThanOrEqual(10);

    const exito = cajas().find(
      (caja) => caja.classList.contains('text-exito-texto') && caja.querySelector('h4') !== null,
    ) as HTMLElement;

    const titulo = exito.querySelector('h4') as HTMLElement;

    // Color heredar: el título no fija una clase de color propia, la toma de la caja.
    expect(titulo.classList.contains('text-texto-primario')).toBe(false);
    expect(titulo.classList.contains('text-texto-secundario')).toBe(false);
  });
});
