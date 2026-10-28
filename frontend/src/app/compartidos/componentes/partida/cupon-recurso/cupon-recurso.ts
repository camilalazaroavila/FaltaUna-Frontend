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
import { NgIcon } from '@ng-icons/core';
import { GsapService } from '@servicios/gsap.service';
import type { ContextoGsap } from '@servicios/gsap.service';

const CLASES_CUERPO: Record<'completa' | 'compacta', string> = {
  completa: 'cupon--completa gap-2.5 px-5 py-2.5',
  compacta: 'cupon--compacta gap-1.5 px-4 py-2',
};

/**
 * Ticket del recurso de juego: muestra cuántos cupones quedan disponibles.
 *
 * Mantiene el nombre "cupón" porque el naming del recurso sigue pendiente
 * (context.md, sección 4). Al subir el valor el número asciende; al bajar
 * (gasto) hace un sacudón corto. Ambas microinteracciones se saltan por
 * completo cuando el usuario pidió reducir el movimiento.
 *
 * `variante="compacta"` se usa en la franja del tablero: solo número y
 * ticket, sin leyenda. El ingreso de la variante es interfaz (mock).
 */
@Component({
  selector: 'app-cupon-recurso',
  templateUrl: './cupon-recurso.html',
  styleUrl: './cupon-recurso.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  host: {
    class: 'inline-flex font-titulo text-cupon-texto cupon-contorno',
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
  readonly variante = input<'completa' | 'compacta'>('completa');

  protected readonly clasesCuerpo = computed(() => CLASES_CUERPO[this.variante()]);
  protected readonly esCompacta = computed(() => this.variante() === 'compacta');
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
