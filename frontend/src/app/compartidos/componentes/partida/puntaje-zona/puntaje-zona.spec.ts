import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { EstadoPuntajeZona, LadoPartida } from '@modelos/partida.model';
import { GsapService } from '@servicios/gsap.service';
import { PuntajeZona } from './puntaje-zona';

const crearDobleGsap = (movimientoReducido: boolean) => {
  const crearContexto = jest.fn(() => {
    const contexto = {
      revert: jest.fn(),
      add: (funcion: () => void) => {
        funcion();
        return contexto;
      },
    };

    return contexto;
  });

  return {
    movimientoReducido: signal(movimientoReducido),
    gsap: { fromTo: jest.fn(), to: jest.fn(), set: jest.fn(), killTweensOf: jest.fn() },
    crearContexto,
    duracionPartida: jest.fn(() => 0.3),
  };
};

@Component({
  standalone: true,
  imports: [PuntajeZona],
  template: `
    <app-puntaje-zona
      id="puntaje"
      [puntos]="puntos()"
      [estado]="estado()"
      [lado]="lado()"
    />
  `,
})
class HostComponent {
  readonly puntos = signal(0);
  readonly estado = signal<EstadoPuntajeZona>('empate');
  readonly lado = signal<LadoPartida>('propio');
}

const configurar = async (movimientoReducido = false) => {
  const doble = crearDobleGsap(movimientoReducido);

  await TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [{ provide: GsapService, useValue: doble }],
  }).compileComponents();

  const fixture = TestBed.createComponent(HostComponent);
  const host = fixture.componentInstance;
  fixture.detectChanges();

  const hostEl = () =>
    fixture.debugElement.query(By.css('#puntaje')).nativeElement as HTMLElement;

  const badge = () => hostEl().querySelector('span') as HTMLElement;

  const cambiarPuntos = (puntos: number) => {
    host.puntos.set(puntos);
    fixture.detectChanges();
    TestBed.tick();
  };

  return { fixture, host, doble, hostEl, badge, cambiarPuntos };
};

describe('PuntajeZona Component', () => {
  it('debe mostrar los puntos jugados', async () => {
    const { host, fixture, badge } = await configurar();

    host.puntos.set(12);
    fixture.detectChanges();

    expect(badge().textContent).toContain('12');
  });

  it('debe describir el estado y el lado en la etiqueta accesible', async () => {
    const { fixture, host, hostEl } = await configurar();

    host.lado.set('rival');
    host.estado.set('perdiendo');
    fixture.detectChanges();

    expect(hostEl().getAttribute('aria-label')).toBe('Puntaje rival: 0, perdiendo');
  });

  it('debe pintar cada estado con su token de fondo', async () => {
    const { fixture, host, badge } = await configurar();

    host.estado.set('ganando');
    fixture.detectChanges();
    expect(badge().classList.contains('bg-puntaje-zona-ganando-fondo')).toBe(true);

    host.estado.set('perdiendo');
    fixture.detectChanges();
    expect(badge().classList.contains('bg-puntaje-zona-perdiendo-fondo')).toBe(true);

    host.estado.set('empate');
    fixture.detectChanges();
    expect(badge().classList.contains('bg-puntaje-zona-empate-fondo')).toBe(true);
  });

  it('debe latir solo cuando va ganando', async () => {
    const { fixture, host, badge } = await configurar();

    host.estado.set('ganando');
    fixture.detectChanges();
    expect(badge().classList.contains('animate-latido-zona')).toBe(true);

    host.estado.set('empate');
    fixture.detectChanges();
    expect(badge().classList.contains('animate-latido-zona')).toBe(false);
  });

  it('debe mostrar el signo de ventaja solo cuando va ganando', async () => {
    const { fixture, host, badge } = await configurar();

    host.estado.set('ganando');
    fixture.detectChanges();
    expect(badge().textContent).toContain('+');

    host.estado.set('perdiendo');
    fixture.detectChanges();
    expect(badge().textContent).not.toContain('+');
  });

  it('debe rebotar el número cuando suben los puntos', async () => {
    const { doble, cambiarPuntos } = await configurar();

    cambiarPuntos(4);

    expect(doble.gsap.fromTo).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      { scale: 1.4 },
      expect.objectContaining({ scale: 1 }),
    );
    expect(doble.duracionPartida).toHaveBeenCalledWith('micro');
  });

  it('debe encoger el número cuando bajan los puntos', async () => {
    const { doble, cambiarPuntos } = await configurar();

    cambiarPuntos(9);
    cambiarPuntos(3);

    expect(doble.gsap.fromTo).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      { scale: 0.8 },
      expect.objectContaining({ scale: 1 }),
    );
  });

  it('no debe animar cuando el movimiento está reducido', async () => {
    const { doble, cambiarPuntos } = await configurar(true);

    cambiarPuntos(7);

    expect(doble.gsap.fromTo).not.toHaveBeenCalled();
  });
});
