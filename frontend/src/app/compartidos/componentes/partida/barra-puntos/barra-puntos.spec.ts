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

  it('debe mostrar las etiquetas visibles fijas VOS y RIVAL', async () => {
    const { fixture } = await configurar();

    const etiquetaPropia = fixture.debugElement.query(By.css('#propia .barra-etiqueta')).nativeElement;
    const etiquetaRival = fixture.debugElement.query(By.css('#rival .barra-etiqueta')).nativeElement;

    expect(etiquetaPropia.textContent?.trim()).toBe('VOS');
    expect(etiquetaRival.textContent?.trim()).toBe('RIVAL');
  });

  it('debe mostrar el número y la meta 100 dentro de la barra', async () => {
    const { fixture } = await configurar();

    fixture.componentInstance.puntos.set(37);
    fixture.detectChanges();

    const textoBarra = fixture.debugElement.query(By.css('#propia .barra-cuerpo')).nativeElement.textContent;

    expect(textoBarra).toContain('37');
    expect(textoBarra).toContain('/ 100');
  });

  it('debe pintar el relleno con el token del lado', async () => {
    const { relleno } = await configurar();

    expect(relleno('propia').classList.contains('bg-barra-puntos-propio-relleno')).toBe(true);
    expect(relleno('rival').classList.contains('bg-barra-puntos-rival-relleno')).toBe(true);
  });

  it('debe animar el ancho del relleno de izquierda a derecha con una transición CSS', async () => {
    const { fixture, relleno } = await configurar();

    const elPropia = relleno('propia');
    const elRival = relleno('rival');

    expect(elPropia.classList.contains('transition-[width]')).toBe(true);
    expect(elPropia.classList.contains('motion-reduce:transition-none')).toBe(true);
    expect(elPropia.classList.contains('left-0.5')).toBe(true);
    expect(elPropia.style.width).toBe('calc(0% - 4px)');

    // Ambos crecen de izquierda a derecha
    expect(elRival.classList.contains('left-0.5')).toBe(true);

    fixture.componentInstance.puntos.set(50);
    fixture.detectChanges();

    expect(elPropia.style.width).toBe('calc(50% - 4px)');
  });

  it('debe mostrar el signo del delta y lanzar su animación', async () => {
    const { doble, deltaFlotante, animarDelta } = await configurar();

    animarDelta(5);

    const el = deltaFlotante();

    expect(el.textContent?.trim()).toBe('+5');
    expect(doble.gsap.fromTo).toHaveBeenCalledWith(
      el,
      { y: 4, opacity: 0, scale: 0.7 },
      expect.objectContaining({ y: -18, opacity: 1, scale: 1.25 }),
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
