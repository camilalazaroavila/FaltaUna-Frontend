import { TestBed } from '@angular/core/testing';
import { GsapService, segundosDesdeDuracion } from './gsap.service';

describe('segundosDesdeDuracion', () => {
  it('debe convertir milisegundos a segundos', () => {
    expect(segundosDesdeDuracion('600ms')).toBeCloseTo(0.6);
    expect(segundosDesdeDuracion('450ms')).toBeCloseTo(0.45);
  });

  it('debe leer los valores declarados en segundos', () => {
    expect(segundosDesdeDuracion('0.9s')).toBeCloseTo(0.9);
  });

  it('debe devolver null cuando el valor no es un tiempo valido', () => {
    expect(segundosDesdeDuracion('')).toBeNull();
    expect(segundosDesdeDuracion('600')).toBeNull();
    expect(segundosDesdeDuracion('auto')).toBeNull();
    expect(segundosDesdeDuracion('calc(1s + 2s)')).toBeNull();
  });
});

describe('GsapService', () => {
  let servicio: GsapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(GsapService);
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--duracion-vuelo-carta');
  });

  it('debe leer la duracion declarada en el token de partida', () => {
    document.documentElement.style.setProperty('--duracion-vuelo-carta', '450ms');

    expect(servicio.duracionPartida('vuelo-carta')).toBeCloseTo(0.45);
  });

  it('debe usar el respaldo cuando el token no esta definido', () => {
    expect(servicio.duracionPartida('revelado-carta', 0.42)).toBeCloseTo(0.42);
  });

  it('debe exponer el estado de movimiento reducido como signal', () => {
    expect(typeof servicio.movimientoReducido()).toBe('boolean');
  });

  it('debe crear un contexto con DestroyRef explicito fuera de contexto de inyeccion y revertir al destruir', () => {
    const elemento = document.createElement('div');
    const callbacksDestruccion: (() => void)[] = [];
    const destroyRefSimulado = {
      onDestroy: (fn: () => void) => {
        callbacksDestruccion.push(fn);
        return () => undefined;
      },
    };

    let revertido = false;
    const contexto = servicio.crearContexto(
      elemento,
      () => undefined,
      destroyRefSimulado as any
    );
    const revertOriginal = contexto.revert.bind(contexto);
    contexto.revert = () => {
      revertido = true;
      return revertOriginal();
    };

    expect(() => {
      callbacksDestruccion.forEach((fn) => fn());
    }).not.toThrow();
    expect(revertido).toBe(true);
  });
});
