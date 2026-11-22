import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EncabezadoPaso } from './encabezado-paso';

describe('EncabezadoPaso (Given-When-Then)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncabezadoPaso],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('Dado un paso con título y sin rutaVolver, Cuando se renderiza, Entonces muestra el título a la izquierda con font-black y el stepper centrado', () => {
    // Given
    const fixture = TestBed.createComponent(EncabezadoPaso);
    fixture.componentRef.setInput('titulo', 'Elegí tu plan');
    fixture.componentRef.setInput('paso', 1);

    // When
    fixture.detectChanges();

    // Then
    const el = fixture.nativeElement as HTMLElement;
    const h1 = el.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent?.trim()).toBe('Elegí tu plan');
    expect(h1?.className).toContain('font-black');
    expect(h1?.className).toContain('text-[#584462]');
    expect(h1?.className).toContain('text-left');

    const volver = el.querySelector('a');
    expect(volver).toBeNull();

    const stepperWrapper = el.querySelector('.sm\\:absolute');
    expect(stepperWrapper).toBeTruthy();
    expect(stepperWrapper?.className).toContain('justify-center');
  });

  it('Dado un paso con rutaVolver, Cuando se renderiza, Entonces muestra el enlace Volver a la izquierda', () => {
    // Given
    const fixture = TestBed.createComponent(EncabezadoPaso);
    fixture.componentRef.setInput('titulo', 'Tu marca');
    fixture.componentRef.setInput('paso', 2);
    fixture.componentRef.setInput('rutaVolver', '/empresa');

    // When
    fixture.detectChanges();

    // Then
    const el = fixture.nativeElement as HTMLElement;
    const volver = el.querySelector('a');
    expect(volver).toBeTruthy();
    expect(volver?.textContent?.trim()).toContain('Volver');
    expect(volver?.getAttribute('href')).toBe('/empresa');
  });
});
