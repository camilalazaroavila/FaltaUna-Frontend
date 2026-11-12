import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanCard } from './plan-card';
import { PlanEmpresa } from '@modelos/landing-empresa.model';

describe('PlanCard', () => {
  let component: PlanCard;
  let fixture: ComponentFixture<PlanCard>;

  const planPrueba: PlanEmpresa = {
    id: 'basico',
    nombre: 'BÁSICO',
    variante: 'azul',
    alineacion: 'izquierda',
    precio: '$15.000',
    periodo: '/mes',
    beneficios: [
      { texto: 'Campaña de colección personalizada', icono: 'megafono' },
      { texto: 'Hasta 12 cartas coleccionables', icono: 'cartas' },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanCard],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('plan', planPrueba);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el precio formateado', () => {
    const monto = fixture.nativeElement.querySelector('.tarjeta-plan-vertical__monto');
    expect(monto?.textContent?.trim()).toBe('$15.000');
  });

  it('alterna el estado de expansión en mobile', () => {
    expect(component.expandido()).toBe(false);
    const botonToggle = fixture.nativeElement.querySelector('.tarjeta-plan-vertical__toggle');
    expect(botonToggle).toBeTruthy();

    botonToggle.click();
    fixture.detectChanges();
    expect(component.expandido()).toBe(true);

    botonToggle.click();
    fixture.detectChanges();
    expect(component.expandido()).toBe(false);
  });
});
