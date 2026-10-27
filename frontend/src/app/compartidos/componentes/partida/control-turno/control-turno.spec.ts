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

  it('muestra "Realizar" y la insignia "1/6" cuando está jugando', () => {
    const boton = fixture.nativeElement.querySelector('button[app-boton]') as HTMLButtonElement;
    const texto = boton.textContent?.replace(/\s+/g, ' ').trim();
    expect(texto).toContain('Realizar');
    expect(texto).toContain('1/6');
    expect(boton.getAttribute('aria-label')).toBe('Realizar turno 1 de 6');
  });

  it('muestra "Ronda final" y la insignia "6/6" cuando es la última ronda', () => {
    fixture.componentRef.setInput('turno', 6);
    fixture.componentRef.setInput('totalTurnos', 6);
    fixture.componentRef.setInput('estado', 'jugando');
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('button[app-boton]') as HTMLButtonElement;
    const texto = boton.textContent?.replace(/\s+/g, ' ').trim();
    expect(texto).toContain('Ronda final');
    expect(texto).toContain('6/6');
    expect(boton.getAttribute('aria-label')).toBe('Ronda final, turno 6 de 6');
  });

  it('muestra "Esperando" y el contador de turno cuando está esperando resolución', () => {
    fixture.componentRef.setInput('estado', 'esperando');
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('button[app-boton]') as HTMLButtonElement;
    const texto = boton.textContent?.replace(/\s+/g, ' ').trim();
    expect(texto).toContain('Esperando');
    expect(texto).toContain('1/6');
    expect(boton.getAttribute('aria-label')).toBe('Esperando turno 1 de 6');
  });

  it('muestra "Realizando" y el contador cuando está resolviendo', () => {
    fixture.componentRef.setInput('estado', 'resolviendo');
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('button[app-boton]') as HTMLButtonElement;
    const texto = boton.textContent?.replace(/\s+/g, ' ').trim();
    expect(texto).toContain('Realizando');
    expect(texto).toContain('1/6');
    expect(boton.getAttribute('aria-label')).toBe('Realizando turno 1 de 6');
  });

  it('deshabilita el botón mientras no está en estado jugando', () => {
    fixture.componentRef.setInput('estado', 'esperando');
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('button[app-boton]') as HTMLButtonElement;
    expect(boton.disabled).toBe(true);
  });

  it('muestra "Fin de la partida", sin spinner y deshabilitado cuando terminada es true', () => {
    fixture.componentRef.setInput('estado', 'resolviendo');
    fixture.componentRef.setInput('terminada', true);
    fixture.detectChanges();
    const boton = fixture.nativeElement.querySelector('button[app-boton]') as HTMLButtonElement;
    const textoLargo = fixture.nativeElement.querySelector('.control-texto--largo')?.textContent?.trim();
    expect(textoLargo).toBe('Fin de la partida');
    expect(boton.disabled).toBe(true);
    expect(component.accionBoton()).toBe('Fin de la partida');
    expect(component.resolviendo()).toBe(false);
  });

  it('muestra solo el botón de Rendirse debajo del botón principal', () => {
    const botones = fixture.nativeElement.querySelectorAll('button');
    const textos = Array.from(botones).map((b) => (b as HTMLButtonElement).textContent?.trim());
    expect(textos).not.toContain('Abandonar');
    expect(textos).toContain('Rendirse');
  });

  it('al pedir confirmación de abandonar, abre modal y emite al confirmar', () => {
    const abandonarSpy = jest.fn();
    component.abandonar.subscribe(abandonarSpy);

    component.pedirConfirmacionAbandonar();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('[aria-labelledby="titulo-modal-abandonar"]');
    expect(modal).toBeTruthy();

    component.confirmarAbandonar();
    expect(abandonarSpy).toHaveBeenCalled();
  });

  it('al cancelar abandonar, no emite abandonar y cierra el modal', () => {
    const abandonarSpy = jest.fn();
    component.abandonar.subscribe(abandonarSpy);

    component.pedirConfirmacionAbandonar();
    fixture.detectChanges();

    component.cancelarAbandonar();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('[aria-labelledby="titulo-modal-abandonar"]');
    expect(modal).toBeNull();
    expect(abandonarSpy).not.toHaveBeenCalled();
  });

  it('al pedir confirmación de rendirse, abre modal y emite al confirmar', () => {
    const rendirseSpy = jest.fn();
    component.rendirse.subscribe(rendirseSpy);

    component.pedirConfirmacionRendirse();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('[aria-labelledby="titulo-modal-rendirse"]');
    expect(modal).toBeTruthy();

    component.confirmarRendirse();
    expect(rendirseSpy).toHaveBeenCalled();
  });

  it('al cancelar rendirse, no emite rendirse y cierra el modal', () => {
    const rendirseSpy = jest.fn();
    component.rendirse.subscribe(rendirseSpy);

    component.pedirConfirmacionRendirse();
    fixture.detectChanges();

    component.cancelarRendirse();
    fixture.detectChanges();

    const modal = fixture.nativeElement.querySelector('[aria-labelledby="titulo-modal-rendirse"]');
    expect(modal).toBeNull();
    expect(rendirseSpy).not.toHaveBeenCalled();
  });
});

