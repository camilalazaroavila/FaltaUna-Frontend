import { TestBed } from '@angular/core/testing';
import { StepperSuscripcion } from './stepper-suscripcion';

describe('StepperSuscripcion (Given-When-Then)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepperSuscripcion],
    }).compileComponents();
  });

  it('Dado el Stepper con pasoActual = 1, Cuando se renderiza, Entonces renderiza 5 pasos y el paso 1 tiene la clase activa violeta', () => {
    // Given
    const fixture = TestBed.createComponent(StepperSuscripcion);
    fixture.componentRef.setInput('pasoActual', 1);

    // When
    fixture.detectChanges();

    // Then
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('li');
    expect(items.length).toBe(5);

    const primerPaso = items[0].querySelector('span');
    expect(primerPaso?.textContent?.trim()).toContain('1');
    expect(primerPaso?.className).toContain('bg-[#584462]');
    expect(primerPaso?.className).toContain('text-white');
    expect(primerPaso?.getAttribute('style')).toContain('box-shadow: 3px 3px 0 #584462');

    const segundoPaso = items[1].querySelector('span');
    expect(segundoPaso?.textContent?.trim()).toContain('2');
    expect(segundoPaso?.className).toContain('bg-white');
    expect(segundoPaso?.className).toContain('text-black');
  });

  it('Dado el Stepper con pasoActual = 3, Cuando se renderiza, Entonces el paso 3 está activo', () => {
    // Given
    const fixture = TestBed.createComponent(StepperSuscripcion);
    fixture.componentRef.setInput('pasoActual', 3);

    // When
    fixture.detectChanges();

    // Then
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('li');
    const tercerPaso = items[2].querySelector('span');
    expect(tercerPaso?.className).toContain('bg-[#584462]');
    expect(tercerPaso?.className).toContain('text-white');
  });
});
