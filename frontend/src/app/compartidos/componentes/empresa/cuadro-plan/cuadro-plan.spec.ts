import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CuadroPlan } from './cuadro-plan';

describe('CuadroPlan', () => {
  let component: CuadroPlan;
  let fixture: ComponentFixture<CuadroPlan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuadroPlan],
    }).compileComponents();

    fixture = TestBed.createComponent(CuadroPlan);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    fixture.componentRef.setInput('tipo', 'basico');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('muestra el nombre BÁSICO por defecto para tipo basico', () => {
    fixture.componentRef.setInput('tipo', 'basico');
    fixture.detectChanges();
    const texto = fixture.nativeElement.querySelector('.cuadro-plan__texto');
    expect(texto?.textContent?.trim()).toBe('BÁSICO');
  });

  it('muestra el nombre STANDARD por defecto para tipo standard', () => {
    fixture.componentRef.setInput('tipo', 'standard');
    fixture.detectChanges();
    const texto = fixture.nativeElement.querySelector('.cuadro-plan__texto');
    expect(texto?.textContent?.trim()).toBe('STANDARD');
  });

  it('muestra el nombre PREMIUM por defecto para tipo premium', () => {
    fixture.componentRef.setInput('tipo', 'premium');
    fixture.detectChanges();
    const texto = fixture.nativeElement.querySelector('.cuadro-plan__texto');
    expect(texto?.textContent?.trim()).toBe('PREMIUM');
  });

  it('aplica la clase de estilo según la variante', () => {
    fixture.componentRef.setInput('tipo', 'standard');
    fixture.detectChanges();
    const contenedor = fixture.nativeElement.querySelector('.cuadro-plan');
    expect(contenedor?.classList.contains('cuadro-plan--standard')).toBe(true);
  });
});
