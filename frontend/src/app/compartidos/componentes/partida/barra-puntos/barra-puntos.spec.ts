import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GsapService } from '@servicios/gsap.service';
import { BarraPuntos } from './barra-puntos';

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
  imports: [BarraPuntos],
  template: `
    <app-barra-puntos id="propia" [puntos]="puntos()" [delta]="delta()" lado="propio" />
    <app-barra-puntos id="rival" [puntos]="42" lado="rival" />
  `,
})
class HostComponent {
  readonly puntos = signal(0);
  readonly delta = signal<number | null>(null);
}

const configurar = async (movimientoReducido = false) => {
  const doble = crearDobleGsap(movimientoReducido);

  await TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [{ provide: GsapService, useValue: doble }],
  }).compileComponents();

  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();

  const barra = (id: string) =>
    fixture.debugElement.query(By.css(`#${id} [role="progressbar"]`)).nativeElement as HTMLElement;

  const relleno = (id: string) =>
    fixture.debugElement.query(By.css(`#${id} [role="progressbar"] > span`))
      .nativeElement as HTMLElement;

  const deltaFlotante = () =>
    fixture.debugElement.query(By.css('#propia span.pointer-events-none'))
      .nativeElement as HTMLElement;

  const animarDelta = (valor: number) => {
    fixture.componentInstance.delta.set(valor);
    fixture.detectChanges();
    TestBed.tick();
  };

  return { fixture, doble, barra, relleno, deltaFlotante, animarDelta };
};

describe('BarraPuntos Component', () => {
  it('debe exponer la barra como progressbar con los valores accesibles', async () => {
    const { barra } = await configurar();

    const el = barra('propia');

    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('0');
    expect(el.getAttribute('aria-label')).toBe('Puntos propios: 0 de 100');
  });

  it('debe nombrar el lado rival en la etiqueta accesible', async () => {
    const { barra } = await configurar();

    expect(barra('rival').getAttribute('aria-label')).toBe('Puntos del rival: 42 de 100');
    expect(barra('rival').getAttribute('aria-valuenow')).toBe('42');
  });

  it('debe mostrar el número a un costado de la barra', async () => {
    const { fixture } = await configurar();

    fixture.componentInstance.puntos.set(37);
    fixture.detectChanges();

    const etiquetas = Array.from(
      fixture.debugElement.query(By.css('#propia')).nativeElement.querySelectorAll('span'),
    ).map((nodo) => nodo.textContent?.trim());

    expect(etiquetas).toContain('37');
  });

  it('debe pintar el relleno con el token del lado', async () => {
    const { relleno } = await configurar();

    expect(relleno('propia').classList.contains('bg-barra-puntos-propio-relleno')).toBe(true);
    expect(relleno('rival').classList.contains('bg-barra-puntos-rival-relleno')).toBe(true);
  });

  it('debe animar la altura del relleno con una transición CSS', async () => {
    const { fixture, relleno } = await configurar();

    const el = relleno('propia');

    expect(el.classList.contains('transition-[height]')).toBe(true);
    expect(el.classList.contains('motion-reduce:transition-none')).toBe(true);
    expect(el.style.height).toBe('calc(0% - 4px)');

    fixture.componentInstance.puntos.set(50);
    fixture.detectChanges();

    expect(relleno('propia').style.height).toBe('calc(50% - 4px)');
  });

  it('debe mostrar el signo del delta y lanzar su animación', async () => {
    const { doble, deltaFlotante, animarDelta } = await configurar();

    animarDelta(5);

    const el = deltaFlotante();

    expect(el.textContent?.trim()).toBe('+5');
    expect(doble.gsap.fromTo).toHaveBeenCalledWith(
      el,
      { y: 6, opacity: 0, scale: 0.7 },
      expect.objectContaining({ y: -30, opacity: 1, scale: 1.3 }),
    );
  });

  it('debe mostrar el delta negativo con su signo', async () => {
    const { deltaFlotante, animarDelta } = await configurar();

    animarDelta(-5);

    expect(deltaFlotante().textContent?.trim()).toBe('-5');
  });

  it('no debe animar el delta cuando el movimiento está reducido', async () => {
    const { doble, animarDelta } = await configurar(true);

    animarDelta(5);

    expect(doble.gsap.fromTo).not.toHaveBeenCalled();
  });
});
