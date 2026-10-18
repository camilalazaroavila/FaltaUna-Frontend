import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgIcon, provideIcons } from '@ng-icons/core';
import type { EstadoSlot, LadoPartida } from '@modelos/partida.model';
import { SlotCarta } from './slot-carta';

const ICONO_PRUEBA = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

@Component({
  standalone: true,
  imports: [SlotCarta],
  template: `
    <app-slot-carta
      id="slot"
      [lado]="lado()"
      [estado]="estado()"
      [avatarRival]="avatarRival()"
    >
      <span id="contenido">Carta jugada</span>
    </app-slot-carta>
  `,
})
class HostComponent {
  readonly lado = signal<LadoPartida>('propio');
  readonly estado = signal<EstadoSlot>('vacio');
  readonly avatarRival = signal<string | null>(null);
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
      providers: [provideIcons({ phosphorUserFill: ICONO_PRUEBA })],
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

  it('debe ocultar la carta del rival detrás de un ícono genérico', () => {
    cambiarEstado('rival-oculto');

    const icono = fixture.debugElement.query(By.css('#slot ng-icon')).componentInstance as NgIcon;

    expect(slot().getAttribute('aria-label')).toBe('Carta oculta del rival del jugador');
    expect(icono.name()).toBe('phosphorUserFill');
    expect(slot().querySelector('#contenido')).toBeNull();
  });

  it('debe mostrar el avatar del rival cuando está disponible', () => {
    host.avatarRival.set('https://ejemplo.com/rival.png');
    cambiarEstado('rival-oculto');

    const imagen = slot().querySelector('img');

    expect(imagen?.getAttribute('src')).toBe('https://ejemplo.com/rival.png');
    expect(slot().querySelector('ng-icon')).toBeNull();
  });

  it('debe pintar la casilla con el fondo del lado rival cuando corresponde', () => {
    host.lado.set('rival');
    fixture.detectChanges();

    expect(slot().getAttribute('data-slot-lado')).toBe('rival');
    expect(marco().classList.contains('bg-slot-rival-fondo')).toBe(true);
    expect(slot().getAttribute('aria-label')).toBe('Casilla vacía del rival');
  });
});
