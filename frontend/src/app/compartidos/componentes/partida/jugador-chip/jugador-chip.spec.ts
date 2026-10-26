import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { JugadorChip } from './jugador-chip';

@Component({
  standalone: true,
  imports: [JugadorChip],
  template: `
    <app-jugador-chip
      id="chip"
      [nombre]="nombre()"
      [avatarUrl]="avatarUrl()"
      [lado]="lado()"
    />
  `,
})
class HostComponent {
  readonly nombre = signal('Valen');
  readonly avatarUrl = signal<string | null>(null);
  readonly lado = signal<'propio' | 'rival'>('propio');
}

const configurar = (datos: { nombre?: string; avatarUrl?: string | null; lado?: 'propio' | 'rival' } = {}) => {
  const fixture = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;

  if (datos.nombre !== undefined) {
    host.nombre.set(datos.nombre);
  }

  if (datos.avatarUrl !== undefined) {
    host.avatarUrl.set(datos.avatarUrl);
  }

  if (datos.lado !== undefined) {
    host.lado.set(datos.lado);
  }

  fixture.detectChanges();

  const chip = () => fixture.debugElement.query(By.css('#chip')).nativeElement as HTMLElement;

  return { fixture, chip };
};

describe('JugadorChip Component', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('debe mostrar el nombre del jugador', () => {
    const { chip } = configurar();

    expect(chip().textContent).toContain('Valen');
  });

  it('debe describir el lado y la posición en la etiqueta accesible', () => {
    const { chip } = configurar();

    expect(chip().querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Jugador propio, Valen, posición izquierda',
    );
  });

  it('debe etiquetar al rival con su posición a la derecha', () => {
    const { chip } = configurar({ lado: 'rival' });

    expect(chip().querySelector('[role="group"]')?.getAttribute('aria-label')).toBe(
      'Jugador rival, Valen, posición derecha',
    );
    expect(chip().querySelector('.flex-row-reverse')).not.toBeNull();
  });

  it('debe caer a la inicial cuando no hay avatar', () => {
    const { chip } = configurar();

    expect(chip().querySelector('img')).toBeNull();
    expect(chip().querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('V');
  });

  it('debe usar un guion cuando el nombre está vacío', () => {
    const { chip } = configurar({ nombre: '   ' });

    expect(chip().querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('?');
  });

  it('debe mostrar la imagen cuando hay avatar', () => {
    const { chip } = configurar({ avatarUrl: 'https://ejemplo.com/valen.png' });

    const imagen = chip().querySelector('img');

    expect(imagen?.getAttribute('src')).toBe('https://ejemplo.com/valen.png');
    expect(imagen?.getAttribute('alt')).toBe('');
  });

  it('debe volver a la inicial si la imagen falla', () => {
    const { fixture, chip } = configurar({ avatarUrl: 'https://ejemplo.com/rota.png' });

    const imagen = chip().querySelector('img') as HTMLImageElement;

    imagen.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(chip().querySelector('img')).toBeNull();
    expect(chip().querySelector('[aria-hidden="true"]')?.textContent?.trim()).toBe('V');
  });
});
