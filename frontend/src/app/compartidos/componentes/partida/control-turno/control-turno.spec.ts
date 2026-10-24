import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ControlTurno } from './control-turno';

describe('ControlTurno', () => {
  let component: ControlTurno;
  let fixture: ComponentFixture<ControlTurno>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ControlTurno],
    }).compileComponents();

    fixture = TestBed.createComponent(ControlTurno);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('turno', 1);
    fixture.componentRef.setInput('totalTurnos', 6);
    fixture.componentRef.setInput('segundosRestantes', 40);
    fixture.componentRef.setInput('estado', 'jugando');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra "Finalizar 1 de 6" cuando está jugando', () => {
    const boton = fixture.nativeElement.querySelector('button[app-boton]') as HTMLButtonElement;
    expect(boton.textContent?.replace(/\s+/g, ' ').trim()).toContain('Finalizar 1 de 6');
  });

  it('muestra "Ronda final" cuando es la última ronda', () => {
    fixture.componentRef.setInput('turno', 6);
    fixture.componentRef.setInput('totalTurnos', 6);
    fixture.componentRef.setInput('estado', 'jugando');
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('button[app-boton]') as HTMLButtonElement;
    expect(boton.textContent?.replace(/\s+/g, ' ').trim()).toContain('Ronda final');
  });

  it('deshabilita el botón mientras no está en estado jugando', () => {
    fixture.componentRef.setInput('estado', 'esperando');
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('button[app-boton]') as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
  });
});
