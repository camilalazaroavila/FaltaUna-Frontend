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

  it('Dado un paso con título de dos renglones, Cuando se pasa tituloSegundaLinea, Entonces renderiza ambos renglones y la segunda línea en bloque', () => {
    // Given
    const fixture = TestBed.createComponent(EncabezadoPaso);
    fixture.componentRef.setInput('titulo', 'Visualización');
    fixture.componentRef.setInput('tituloSegundaLinea', 'previa');
    fixture.componentRef.setInput('paso', 4);

    // When
    fixture.detectChanges();

    // Then
    const el = fixture.nativeElement as HTMLElement;
    const h1 = el.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toContain('Visualización previa');
    const bloqueSegundaLinea = h1?.querySelector('span.block');
    expect(bloqueSegundaLinea).toBeTruthy();
    expect(bloqueSegundaLinea?.textContent?.trim()).toBe('previa');
  });

  it('Dado un paso con variantes para tablet, Cuando se pasa tituloTablet y tituloSegundaLineaTablet, Entonces incluye las variantes responsive para tablet y otros tamaños', () => {
    // Given
    const fixture = TestBed.createComponent(EncabezadoPaso);
    fixture.componentRef.setInput('titulo', 'Visualización');
    fixture.componentRef.setInput('tituloSegundaLinea', 'previa');
    fixture.componentRef.setInput('tituloTablet', 'Vista');
    fixture.componentRef.setInput('tituloSegundaLineaTablet', 'previa');
    fixture.componentRef.setInput('paso', 4);

    // When
    fixture.detectChanges();

    // Then
    const el = fixture.nativeElement as HTMLElement;
    const h1 = el.querySelector('h1');
    expect(h1).toBeTruthy();
    expect(h1?.textContent).toContain('Vista');
    expect(h1?.textContent).toContain('Visualización');

    const tabletSpan = h1?.querySelector('span.tablet\\:block');
    expect(tabletSpan).toBeTruthy();
    expect(tabletSpan?.textContent?.trim()).toBe('previa');
  });
});
