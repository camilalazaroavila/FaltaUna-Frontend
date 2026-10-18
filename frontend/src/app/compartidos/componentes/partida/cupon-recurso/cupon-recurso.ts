import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { GsapService } from '@servicios/gsap.service';
import type { ContextoGsap } from '@servicios/gsap.service';

const CLASES_BASE = [
  'relative isolate inline-flex items-center gap-2.5 border-2 border-cupon-borde bg-cupon-fondo',
  'rounded-md px-4 py-2 font-titulo text-cupon-texto shadow-cartoon',
].join(' ');

/**
 * Ticket del recurso de juego: muestra cuántos cupones quedan disponibles.
 *
 * Mantiene el nombre "cupón" porque el naming del recurso sigue pendiente
 * (context.md, sección 4). Al subir el valor el número asciende; al bajar
 * (gasto) hace un sacudón corto. Ambas microinteracciones se saltan por
 * completo cuando el usuario pidió reducir el movimiento.
 */
@Component({
  selector: 'app-cupon-recurso',
  templateUrl: './cupon-recurso.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'clases()',
    role: 'status',
    '[attr.aria-label]': 'etiqueta()',
  },
})
export class CuponRecurso implements AfterViewInit {
  private readonly gsapServicio = inject(GsapService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementoRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly referenciaNumero = viewChild<ElementRef<HTMLElement>>('numero');

  readonly valor = input.required<number>();
  readonly maximo = input(6);

  protected readonly clases = computed(() => CLASES_BASE);
  protected readonly leyenda = computed(() => `cupones de ${this.maximo()}`);
  protected readonly etiqueta = computed(
    () => `Cupones disponibles: ${this.valor()} de ${this.maximo()}`,
  );

  protected readonly movimientoReducido = this.gsapServicio.movimientoReducido;

  private contexto?: ContextoGsap;
  private valorAnterior?: number;

  constructor() {
    effect(() => {
      const valor = this.valor();
      const anterior = this.valorAnterior;
      this.valorAnterior = valor;

      if (anterior === undefined || anterior === valor || this.movimientoReducido()) {
        return;
      }

      const objetivo = this.referenciaNumero()?.nativeElement;

      if (!objetivo) {
        return;
      }

      this.contexto?.add(() => this.animarCambio(objetivo, valor > anterior));
    });
  }

  ngAfterViewInit(): void {
    // El contexto agrupa las microinteracciones para revertirlas al destruir el
    // componente: `add()` las registra aunque se disparen después, cuando
    // cambia el input.
    this.contexto = this.gsapServicio.crearContexto(
      this.elementoRef.nativeElement,
      () => undefined,
      this.destroyRef,
    );
  }

  private animarCambio(objetivo: HTMLElement, sube: boolean): void {
    const { gsap } = this.gsapServicio;

    if (sube) {
      const duracion = this.gsapServicio.duracionPartida('vuelo-carta');

      gsap.fromTo(
        objetivo,
        { y: 12, opacity: 0.35 },
        { y: 0, opacity: 1, duration: duracion, ease: 'back.out(2)', overwrite: true },
      );
      return;
    }

    const duracion = this.gsapServicio.duracionPartida('micro');

    gsap.fromTo(
      objetivo,
      { x: -3 },
      { x: 0, duration: duracion / 3, ease: 'power2.out', repeat: 3, yoyo: true, overwrite: true },
    );
  }
}
