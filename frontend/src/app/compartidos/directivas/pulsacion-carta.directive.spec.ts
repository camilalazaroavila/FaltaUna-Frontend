import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PulsacionCartaDirective } from './pulsacion-carta.directive';

@Component({
  standalone: true,
  imports: [PulsacionCartaDirective],
  template: `
    <div appPulsacionCarta [clicRaton]="clicRaton()" (pulsacion)="alPulsar()">
      <button type="button" (click)="alClicInterno()">Carta</button>
    </div>
  `,
})
class Anfitrion {
  readonly clicRaton = signal(true);
  readonly pulsaciones = signal(0);
  readonly clicsInternos = signal(0);

  alPulsar(): void {
    this.pulsaciones.update((valor) => valor + 1);
  }

  alClicInterno(): void {
    this.clicsInternos.update((valor) => valor + 1);
  }
}

function eventoPointer(tipo: string, x = 0, y = 0): PointerEvent {
  return {
    pointerType: tipo,
    pointerId: 1,
    button: 0,
    clientX: x,
    clientY: y,
  } as unknown as PointerEvent;
}

describe('PulsacionCartaDirective', () => {
  let fixture: ComponentFixture<Anfitrion>;
  let anfitrion: Anfitrion;
  let directiva: PulsacionCartaDirective;

  const boton = (): HTMLButtonElement => fixture.nativeElement.querySelector('button');

  const emitirClic = (): void => {
    boton().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Anfitrion] }).compileComponents();

    fixture = TestBed.createComponent(Anfitrion);
    anfitrion = fixture.componentInstance;
    fixture.detectChanges();

    directiva = fixture.debugElement
      .query(By.directive(PulsacionCartaDirective))
      .injector.get(PulsacionCartaDirective);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('emite al hacer clic con el mouse cuando clicRaton está activo', () => {
    directiva['alPresionar'](eventoPointer('mouse'));
    directiva['alSoltar'](eventoPointer('mouse'));

    emitirClic();

    expect(anfitrion.pulsaciones()).toBe(1);
    expect(anfitrion.clicsInternos()).toBe(1);
  });

  it('no emite con el tap táctil: solo responde a la pulsación larga', () => {
    directiva['alPresionar'](eventoPointer('touch'));
    directiva['alSoltar'](eventoPointer('touch'));

    emitirClic();

    expect(anfitrion.pulsaciones()).toBe(0);
    expect(anfitrion.clicsInternos()).toBe(1);
  });

  it('no emite al hacer clic con el mouse cuando clicRaton es false', () => {
    anfitrion.clicRaton.set(false);
    fixture.detectChanges();

    directiva['alPresionar'](eventoPointer('mouse'));
    directiva['alSoltar'](eventoPointer('mouse'));

    emitirClic();

    expect(anfitrion.pulsaciones()).toBe(0);
    expect(anfitrion.clicsInternos()).toBe(1);
  });

  it('emite al mantener presionado y descarta el clic siguiente', () => {
    jest.useFakeTimers();

    directiva['alPresionar'](eventoPointer('touch'));
    jest.advanceTimersByTime(500);

    expect(anfitrion.pulsaciones()).toBe(1);

    emitirClic();

    expect(anfitrion.pulsaciones()).toBe(1);
    expect(anfitrion.clicsInternos()).toBe(0);
  });

  it('cancela la pulsación si el puntero se mueve', () => {
    jest.useFakeTimers();

    directiva['alPresionar'](eventoPointer('touch', 0, 0));
    directiva['alMover'](eventoPointer('touch', 40, 0));
    jest.advanceTimersByTime(500);

    expect(anfitrion.pulsaciones()).toBe(0);
  });
});
