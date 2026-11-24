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
  completa: 'ticket--completa gap-2.5 px-5 py-2.5',
  compacta: 'ticket--compacta gap-1.5 px-4 py-2',
};

/**
 * Ticket del recurso de juego: muestra cuántos tickets quedan disponibles.
 *
 * Al subir el valor el número asciende; al bajar (gasto) hace un sacudón corto.
 * Ambas microinteracciones se saltan por completo cuando el usuario pidió reducir el movimiento.
 *
 * `variante="compacta"` se usa en la franja del tablero: solo número y
 * ticket, sin leyenda.
 */
@Component({
  selector: 'app-ticket-recurso',
  templateUrl: './ticket-recurso.html',
  styleUrl: './ticket-recurso.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  host: {
    class: 'inline-flex font-titulo text-ticket-texto ticket-contorno',
    role: 'status',
    '[attr.aria-label]': 'etiqueta()',
  },
})
export class TicketRecurso implements AfterViewInit {
  private readonly gsapServicio = inject(GsapService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementoRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly referenciaNumero = viewChild<ElementRef<HTMLElement>>('numero');

  readonly valor = input.required<number>();
  readonly maximo = input(6);
  readonly variante = input<'completa' | 'compacta'>('completa');

  protected readonly clasesCuerpo = computed(() => CLASES_CUERPO[this.variante()]);
  protected readonly esCompacta = computed(() => this.variante() === 'compacta');
  protected readonly leyenda = computed(
    () => `${this.valor() === 1 ? 'ticket' : 'tickets'} de ${this.maximo()}`,
  );
  protected readonly etiqueta = computed(
    () => `Tickets disponibles: ${this.valor()} de ${this.maximo()}`,
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
    this.contexto = this.gsapServicio.crearContexto(
      this.elementoRef.nativeElement,
      () => undefined,
      this.destroyRef,
    );
  }

  private animarCambio(objetivo: HTMLElement, sube: boolean): void {
    const { gsap } = this.gsapServicio;

    if (sube) {
      gsap.fromTo(
        objetivo,
        { y: 8, scale: 0.8, opacity: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: this.gsapServicio.duracionPartida('micro', 0.3),
          ease: 'back.out(2)',
        },
      );
    } else {
      gsap.fromTo(
        objetivo,
        { x: -3 },
        {
          x: 0,
          duration: this.gsapServicio.duracionPartida('revelado-carta') * 0.75,
          ease: 'elastic.out(1.2, 0.3)',
        },
      );
    }
  }
}
