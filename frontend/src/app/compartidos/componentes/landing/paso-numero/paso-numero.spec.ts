import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasoNumero } from './paso-numero';

describe('PasoNumero', () => {
  let fixture: ComponentFixture<PasoNumero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasoNumero],
    }).compileComponents();

    fixture = TestBed.createComponent(PasoNumero);
  });

  it('debe crearse correctamente y mostrar el número', () => {
    fixture.componentRef.setInput('numero', 1);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent?.trim()).toBe('1');
  });

  it('debe admitir variante crema', () => {
    fixture.componentRef.setInput('numero', 2);
    fixture.componentRef.setInput('variante', 'crema');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.paso-numero');
    expect(span.classList.contains('paso-numero--crema')).toBe(true);
  });
});
