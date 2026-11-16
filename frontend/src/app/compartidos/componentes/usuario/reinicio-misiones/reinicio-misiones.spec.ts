import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';

import { ReinicioMisiones, formatearTiempoRestante } from './reinicio-misiones';

const ICONO_PRUEBA = '<svg viewBox="0 0 24 24"></svg>';

describe('formatearTiempoRestante', () => {
  it('formatea días y minutos cuando no hay horas enteras', () => {
    const ms = 6 * 24 * 60 * 60 * 1000 + 24 * 60 * 1000;
    expect(formatearTiempoRestante(ms)).toBe('6 d 24 min');
  });

  it('formatea horas y minutos', () => {
    const ms = 5 * 60 * 60 * 1000 + 13 * 60 * 1000;
    expect(formatearTiempoRestante(ms)).toBe('5 h 13 min');
  });

  it('formatea solo minutos cuando queda menos de una hora', () => {
    expect(formatearTiempoRestante(12 * 60 * 1000)).toBe('12 min');
  });

  it('formatea segundos en el último minuto', () => {
    expect(formatearTiempoRestante(35 * 1000)).toBe('35 s');
  });
});

describe('ReinicioMisiones', () => {
  let fixture: ComponentFixture<ReinicioMisiones>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-14T12:00:00.000Z'));

    TestBed.configureTestingModule({
      imports: [ReinicioMisiones],
      providers: [provideIcons({ phosphorClock: ICONO_PRUEBA })],
    });
    fixture = TestBed.createComponent(ReinicioMisiones);
  });

  afterEach(() => {
    fixture.destroy();
    jest.useRealTimers();
  });

  it('no renderiza nada si no hay fecha', () => {
    fixture.componentRef.setInput('proximoReinicioUtc', null);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
  });

  it('aplica el offset del servidor y muestra el tiempo restante', () => {
    // Reloj local 12:00, servidor 12:10 (+10 min), reinicio 13:10 => quedan 60 min (1 h)
    fixture.componentRef.setInput('offsetRelojMs', 10 * 60 * 1000);
    fixture.componentRef.setInput('proximoReinicioUtc', '2026-11-14T13:10:00.000Z');
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Se reinicia en 1 h');
  });

  it('emite reinicioAlcanzado una vez al llegar a cero', () => {
    let emisiones = 0;
    fixture.componentInstance.reinicioAlcanzado.subscribe(() => {
      emisiones += 1;
    });

    fixture.componentRef.setInput('proximoReinicioUtc', '2026-11-14T12:00:30.000Z');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Se reinicia en 30 s');
    expect(emisiones).toBe(0);

    jest.advanceTimersByTime(30_000);
    fixture.detectChanges();
    expect(emisiones).toBe(1);
  });
});

