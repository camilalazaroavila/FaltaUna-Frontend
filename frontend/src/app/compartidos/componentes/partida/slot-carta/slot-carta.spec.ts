import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { EstadoSlot, LadoPartida } from '@modelos/partida.model';
import { SlotCarta } from './slot-carta';

@Component({
  standalone: true,
  imports: [SlotCarta],
  template: `
    <app-slot-carta id="slot" [lado]="lado()" [estado]="estado()">
      <span id="contenido">Carta jugada</span>
    </app-slot-carta>
  `,
})
class HostComponent {
  readonly lado = signal<LadoPartida>('propio');
  readonly estado = signal<EstadoSlot>('vacio');
}

describe('SlotCarta Component', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const slot = () => fixture.debugElement.query(By.css('#slot')).nativeElement as HTMLElement;
  const marco = () => slot().querySelector('div') as HTMLElement;

  const cambiarEstado = (estado: EstadoSlot) => {
    host.estado.set(estado);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe exponer el estado y el lado como atributos de datos', () => {
    expect(slot().getAttribute('data-slot-estado')).toBe('vacio');
    expect(slot().getAttribute('data-slot-lado')).toBe('propio');
  });

  it('debe describir la casilla vacía del jugador', () => {
    expect(slot().getAttribute('aria-label')).toBe('Casilla vacía del jugador');

    expect(marco().classList.contains('border-dashed')).toBe(true);
    expect(marco().classList.contains('bg-slot-propio-fondo')).toBe(true);
    expect(marco().classList.contains('shadow-cartoon')).toBe(true);
  });

  it('debe resaltar la casilla disponible con anillo y pulso', () => {
    cambiarEstado('resaltado');

    expect(slot().getAttribute('data-slot-estado')).toBe('resaltado');
    expect(slot().getAttribute('aria-label')).toBe('Casilla disponible para jugar del jugador');
    expect(marco().classList.contains('ring-4')).toBe(true);
    expect(marco().classList.contains('ring-slot-resaltado-anillo')).toBe(true);
    expect(marco().classList.contains('animate-pulso-slot')).toBe(true);
    expect(marco().classList.contains('border-dashed')).toBe(false);
  });

  it('debe proyectar la carta cuando la casilla está ocupada', () => {
    cambiarEstado('ocupado');

    expect(slot().getAttribute('aria-label')).toBe('Carta jugada en esta casilla del jugador');
    expect(slot().querySelector('#contenido')?.textContent).toBe('Carta jugada');
  });

  it('debe pintar la casilla con el fondo del lado rival cuando corresponde', () => {
    host.lado.set('rival');
    fixture.detectChanges();

    expect(slot().getAttribute('data-slot-lado')).toBe('rival');
    expect(marco().classList.contains('bg-slot-rival-fondo')).toBe(true);
    expect(slot().getAttribute('aria-label')).toBe('Casilla vacía del rival');
  });

  it('no debe mostrar el botón de jugar si la casilla no está resaltada', () => {
    expect(slot().querySelector('button')).toBeNull();
  });

  it('debe emitir jugar al pulsar el botón de la casilla disponible', () => {
    cambiarEstado('resaltado');

    const boton = slot().querySelector('button') as HTMLButtonElement;
    const emitir = jest.spyOn(
      fixture.debugElement.query(By.css('#slot')).componentInstance.jugar,
      'emit',
    );

    expect(boton).toBeTruthy();
    expect(boton.getAttribute('aria-label')).toBe('Jugar carta en esta casilla del jugador');

    boton.click();

    expect(emitir).toHaveBeenCalled();
  });
});
