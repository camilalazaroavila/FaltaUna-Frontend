import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Esqueleto } from './esqueleto';

describe('Esqueleto', () => {
  let fixture: ComponentFixture<Esqueleto>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Esqueleto],
    });
    fixture = TestBed.createComponent(Esqueleto);
    fixture.detectChanges();
  });

  it('se crea con accesibilidad por defecto (role status, aria-busy true)', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.getAttribute('role')).toBe('status');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.textContent).toContain('Cargando…');
  });

  it('aplica clases de variante texto y pildora', () => {
    fixture.componentRef.setInput('variante', 'texto');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList.contains('rounded-pildora')).toBe(true);
    expect(el.classList.contains('h-4')).toBe(true);
  });

  it('aplica ancho y alto personalizados via estilos inline', () => {
    fixture.componentRef.setInput('ancho', '120px');
    fixture.componentRef.setInput('alto', '32px');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.style.width).toBe('120px');
    expect(el.style.height).toBe('32px');
  });

  it('permite desactivar el brillo o el pulso', () => {
    fixture.componentRef.setInput('brillo', false);
    fixture.componentRef.setInput('pulso', false);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.classList.contains('esqueleto--brillo')).toBe(false);
    expect(el.classList.contains('esqueleto--pulso')).toBe(false);
  });
});
