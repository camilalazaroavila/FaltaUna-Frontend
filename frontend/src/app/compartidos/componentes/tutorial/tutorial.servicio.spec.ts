import { TestBed } from '@angular/core/testing';
import { TutorialServicio } from './tutorial.servicio';

describe('TutorialServicio', () => {
  let servicio: TutorialServicio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(TutorialServicio);
  });

  it('arranca inactivo y en el primer paso', () => {
    expect(servicio.activo()).toBe(false);
    expect(servicio.indice()).toBe(0);
    expect(servicio.paso()).toBe(servicio.pasos[0]);
  });

  it('iniciar activa el tutorial y resetea el estado', () => {
    servicio.iniciar();

    expect(servicio.activo()).toBe(true);
    expect(servicio.indice()).toBe(0);
    expect(servicio.completado()).toBe(false);
  });

  it('no avanza un paso con acción hasta que se notifica el evento', () => {
    servicio.iniciar();

    servicio.siguiente();
    servicio.siguiente();
    servicio.siguiente();

    expect(servicio.indice()).toBe(3);
    expect(servicio.esperaCumplida()).toBe(false);

    servicio.siguiente();
    expect(servicio.indice()).toBe(3);

    servicio.notificar('carta-vista');
    expect(servicio.esperaCumplida()).toBe(true);

    servicio.siguiente();
    expect(servicio.indice()).toBe(4);
  });

  it('ignora eventos que no corresponden al paso actual', () => {
    servicio.iniciar();

    servicio.notificar('carta-jugada');

    expect(servicio.esperaCumplida()).toBe(true);
  });

  it('atrás vuelve al paso anterior y limpia el evento', () => {
    servicio.iniciar();
    servicio.siguiente();
    servicio.siguiente();
    servicio.siguiente();
    servicio.notificar('carta-vista');
    servicio.siguiente();

    servicio.atras();

    expect(servicio.indice()).toBe(3);
    expect(servicio.esperaCumplida()).toBe(false);
  });

  it('completa el tutorial al avanzar desde el último paso', () => {
    servicio.iniciar();

    while (!servicio.esUltimo()) {
      const espera = servicio.paso().espera;

      if (espera) {
        servicio.notificar(espera);
      }

      servicio.siguiente();
    }

    expect(servicio.esUltimo()).toBe(true);

    servicio.siguiente();

    expect(servicio.completado()).toBe(true);
    expect(servicio.activo()).toBe(false);
  });

  it('salir cierra el tutorial sin marcarlo como completado', () => {
    servicio.iniciar();
    servicio.salir();

    expect(servicio.activo()).toBe(false);
    expect(servicio.completado()).toBe(false);
  });
});
