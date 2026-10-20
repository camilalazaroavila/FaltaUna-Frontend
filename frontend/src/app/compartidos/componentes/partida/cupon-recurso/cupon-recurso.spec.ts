import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { GsapService } from '@servicios/gsap.service';
import { CuponRecurso } from './cupon-recurso';

/**
 * Doble de `GsapService`: registra las animaciones pedidas y ejecuta el
 * callback de `add()` al instante, sin depender del ticker real de GSAP.
 */
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
  imports: [CuponRecurso],
  template: '<app-cupon-recurso id="cupon" [valor]="valor()" [maximo]="9" />',
})
class HostComponent {
  readonly valor = signal(3);
}

const configurar = async (movimientoReducido: boolean) => {
  const doble = crearDobleGsap(movimientoReducido);

  await TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [{ provide: GsapService, useValue: doble }],
  }).compileComponents();

  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();

  /** Cambia el valor y deja que corran los effects del componente. */
  const cambiarValor = (valor: number) => {
    fixture.componentInstance.valor.set(valor);
    fixture.detectChanges();
    TestBed.tick();
  };

  return { fixture, doble, cambiarValor };
};

describe('CuponRecurso Component', () => {
  describe('con movimiento permitido', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<HostComponent>>;
    let doble: ReturnType<typeof crearDobleGsap>;
    let cambiarValor: (valor: number) => void;

    const cupon = () => fixture.debugElement.query(By.css('#cupon')).nativeElement as HTMLElement;

    beforeEach(async () => {
      ({ fixture, doble, cambiarValor } = await configurar(false));
    });

    it('debe mostrar el valor con la leyenda y el rol de estado', () => {
      const el = cupon();

      expect(el.getAttribute('role')).toBe('status');
      expect(el.getAttribute('aria-label')).toBe('Cupones disponibles: 3 de 9');
      expect(el.textContent).toContain('3');
      expect(el.textContent).toContain('cupones de 9');
    });


    it('debe pintarse solo con tokens del cupón', () => {
      const el = cupon();
      const cuerpo = el.querySelector('span') as HTMLElement;

      expect(el.classList.contains('text-cupon-texto')).toBe(true);
      expect(el.classList.contains('cupon-contorno')).toBe(true);
      expect(cuerpo.classList.contains('muesca-cupon')).toBe(true);
      expect(cuerpo.classList.contains('bg-cupon-fondo')).toBe(true);
    });

    it('no debe animar en el render inicial', () => {
      expect(doble.gsap.fromTo).not.toHaveBeenCalled();
    });

    it('debe animar el ascenso del número cuando sube el valor', () => {
      cambiarValor(4);

      expect(doble.gsap.fromTo).toHaveBeenCalledTimes(1);
      expect(doble.gsap.fromTo).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        { y: 12, opacity: 0.35 },
        expect.objectContaining({ y: 0, opacity: 1 }),
      );
      expect(doble.duracionPartida).toHaveBeenCalledWith('vuelo-carta');
    });

    it('debe sacudir el número cuando el valor baja por un gasto', () => {
      cambiarValor(2);

      expect(doble.gsap.fromTo).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        { x: -3 },
        expect.objectContaining({ x: 0, repeat: 3, yoyo: true }),
      );
      expect(doble.duracionPartida).toHaveBeenCalledWith('micro');
    });

    it('no debe volver a animar si el valor no cambia', () => {
      cambiarValor(4);
      cambiarValor(4);

      expect(doble.gsap.fromTo).toHaveBeenCalledTimes(1);
    });
  });

  describe('con movimiento reducido', () => {
    it('no debe disparar animaciones al cambiar el valor', async () => {
      const { doble, cambiarValor } = await configurar(true);

      cambiarValor(5);

      expect(doble.gsap.fromTo).not.toHaveBeenCalled();
    });
  });
});
