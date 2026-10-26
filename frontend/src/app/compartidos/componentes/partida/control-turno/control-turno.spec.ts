import { ComponentFixture, TestBed } from '@angular/core/testing';
import Swal from 'sweetalert2';

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

  it('muestra solo el botón de Rendirse debajo del botón principal', () => {
    const botones = fixture.nativeElement.querySelectorAll('button');
    const textos = Array.from(botones).map((b) => (b as HTMLButtonElement).textContent?.trim());
    expect(textos).not.toContain('Abandonar');
    expect(textos).toContain('Rendirse');
  });

  it('al confirmar abandonar en SweetAlert, emite el evento abandonar', async () => {
    const swalSpy = jest.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,
    } as any);
    const abandonarSpy = jest.fn();
    component.abandonar.subscribe(abandonarSpy);

    await component.pedirConfirmacionAbandonar();

    expect(swalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '¿Abandonar la partida?',
        showCancelButton: true,
      }),
    );
    expect(abandonarSpy).toHaveBeenCalled();
    swalSpy.mockRestore();
  });

  it('al cancelar abandonar en SweetAlert, no emite abandonar', async () => {
    const swalSpy = jest.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: false,
      isDenied: false,
      isDismissed: true,
    } as any);
    const abandonarSpy = jest.fn();
    component.abandonar.subscribe(abandonarSpy);

    await component.pedirConfirmacionAbandonar();

    expect(abandonarSpy).not.toHaveBeenCalled();
    swalSpy.mockRestore();
  });

  it('al confirmar rendirse en SweetAlert, emite el evento rendirse', async () => {
    const swalSpy = jest.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: true,
      isDenied: false,
      isDismissed: false,
    } as any);
    const rendirseSpy = jest.fn();
    component.rendirse.subscribe(rendirseSpy);

    await component.pedirConfirmacionRendirse();

    expect(swalSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '¿Rendirte?',
        showCancelButton: true,
      }),
    );
    expect(rendirseSpy).toHaveBeenCalled();
    swalSpy.mockRestore();
  });

  it('al cancelar rendirse en SweetAlert, no emite rendirse', async () => {
    const swalSpy = jest.spyOn(Swal, 'fire').mockResolvedValue({
      isConfirmed: false,
      isDenied: false,
      isDismissed: true,
    } as any);
    const rendirseSpy = jest.fn();
    component.rendirse.subscribe(rendirseSpy);

    await component.pedirConfirmacionRendirse();

    expect(rendirseSpy).not.toHaveBeenCalled();
    swalSpy.mockRestore();
  });
});

