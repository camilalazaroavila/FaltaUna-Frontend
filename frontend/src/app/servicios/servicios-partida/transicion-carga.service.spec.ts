import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { EmparejamientoService } from '@servicios/emparejamiento.service';
import {
  PAUSA_CONFIRMACION_CARGA_MS,
  TransicionCargaService,
} from './transicion-carga.service';

describe('TransicionCargaService', () => {
  let service: TransicionCargaService;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [TransicionCargaService, EmparejamientoService],
    });
    service = TestBed.inject(TransicionCargaService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('espera la duración del emparejamiento más la pausa de confirmación visual en modo pvp', () => {
    let completado = false;
    service.esperarPantallaCarga('pvp').subscribe(() => {
      completado = true;
    });

    jest.advanceTimersByTime(4000);
    expect(completado).toBe(false);

    jest.advanceTimersByTime(PAUSA_CONFIRMACION_CARGA_MS);
    expect(completado).toBe(true);
  });

  it('espera a que terminen tanto la carga visual como la acción cuando la acción tiene éxito', () => {
    const accion$ = new Subject<boolean>();
    let resultado: boolean | undefined;

    service.esperarConAccion('ia', accion$).subscribe((valor) => {
      resultado = valor;
    });

    accion$.next(true);
    accion$.complete();

    jest.advanceTimersByTime(2000);
    expect(resultado).toBeUndefined();

    jest.advanceTimersByTime(PAUSA_CONFIRMACION_CARGA_MS);
    expect(resultado).toBe(true);
  });

  it('aborta de inmediato si la acción falla sin retener al jugador en la carga', () => {
    let resultado: boolean | undefined;

    service.esperarConAccion('ia', of(false)).subscribe((valor) => {
      resultado = valor;
    });

    expect(resultado).toBe(false);
  });
});
