import { TestBed } from '@angular/core/testing';
import { CLAVE_TUTORIAL_COMPLETADO, ProgresoJuegoService } from './progreso-juego.service';

describe('ProgresoJuegoService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Reinicia Angular para simular que se abre la app de nuevo y se crea otra instancia del servicio.
  const crearServicio = (): ProgresoJuegoService => {
    TestBed.resetTestingModule();
    return TestBed.inject(ProgresoJuegoService);
  };

  it('empieza con el tutorial sin completar', () => {
    expect(crearServicio().tutorialCompletado()).toBe(false);
  });

  it('marca el tutorial como completado', () => {
    const servicio = crearServicio();

    servicio.marcarTutorialCompletado();

    expect(servicio.tutorialCompletado()).toBe(true);
  });

  it('recuerda que el tutorial estaba completado al abrir la app de nuevo', () => {
    crearServicio().marcarTutorialCompletado();

    expect(crearServicio().tutorialCompletado()).toBe(true);
  });

  it('lee el estado guardado previamente', () => {
    localStorage.setItem(CLAVE_TUTORIAL_COMPLETADO, 'true');

    expect(crearServicio().tutorialCompletado()).toBe(true);
  });
});