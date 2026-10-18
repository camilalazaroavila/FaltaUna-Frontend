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
import type { EstadoPuntajeZona, LadoPartida } from '@modelos/partida.model';
import { GsapService } from '@servicios/gsap.service';
import type { ContextoGsap } from '@servicios/gsap.service';

const CLASES_BASE =
  'inline-flex items-center gap-1.5 rounded-pildora border-2 border-zona-marco px-3 py-1 shadow-cartoon';

const CLASES_ESTADO: Record<EstadoPuntajeZona, string> = {
  ganando: 'bg-puntaje-zona-ganando-fondo text-puntaje-zona-ganando-texto animate-latido-zona',
  perdiendo: 'bg-puntaje-zona-perdiendo-fondo text-puntaje-zona-perdiendo-texto',
  empate: 'bg-puntaje-zona-empate-fondo text-puntaje-zona-empate-texto',
};

const NOMBRE_LADO: Record<LadoPartida, string> = {
  propio: 'propio',
  rival: 'rival',
};

const NOMBRE_ESTADO: Record<EstadoPuntajeZona, string> = {
  ganando: 'ganando',
  perdiendo: 'perdiendo',
  empate: 'empate',
};

/**
 * Badge con el puntaje de una zona para un lado del tablero. Cuando el lado va
 * ganando late con una animación CSS (continua) y cada cambio de puntos da un
 * rebote corto con GSAP sobre un span interno, para no pisar el `transform` del
 * latido.
 */
@Component({
  selector: 'app-puntaje-zona',
  templateUrl: './puntaje-zona.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-block',
    '[attr.aria-label]': 'etiqueta()',
    role: 'status',
  },
})
export class PuntajeZona implements AfterViewInit {
  private readonly gsapServicio = inject(GsapService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementoRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly referenciaNumero = viewChild<ElementRef<HTMLElement>>('numero');

  readonly puntos = input.required<number>();
  readonly estado = input<EstadoPuntajeZona>('empate');
  readonly lado = input<LadoPartida>('propio');

  protected readonly movimientoReducido = this.gsapServicio.movimientoReducido;
  protected readonly clases = computed(() =>
    [CLASES_BASE, CLASES_ESTADO[this.estado()]].join(' '),
  );
  protected readonly etiqueta = computed(
    () =>
      `Puntaje ${NOMBRE_LADO[this.lado()]}: ${this.puntos()}, ${NOMBRE_ESTADO[this.estado()]}`,
  );

  private contexto?: ContextoGsap;
  private puntosAnteriores?: number;

  constructor() {
    effect(() => {
      const puntos = this.puntos();
      const anteriores = this.puntosAnteriores;
      this.puntosAnteriores = puntos;

      if (anteriores === undefined || anteriores === puntos || this.movimientoReducido()) {
        return;
      }

      const objetivo = this.referenciaNumero()?.nativeElement;

      if (!objetivo) {
        return;
      }

      const subio = puntos > anteriores;

      this.contexto?.add(() => this.animarRebote(objetivo, subio));
    });
  }

  ngAfterViewInit(): void {
    this.contexto = this.gsapServicio.crearContexto(
      this.elementoRef.nativeElement,
      () => undefined,
      this.destroyRef,
    );
  }

  /** Rebote corto del número sobre un span interno, sin tocar el latido del badge. */
  private animarRebote(objetivo: HTMLElement, subio: boolean): void {
    const { gsap } = this.gsapServicio;

    gsap.fromTo(
      objetivo,
      { scale: subio ? 1.4 : 0.8 },
      {
        scale: 1,
        duration: this.gsapServicio.duracionPartida('micro'),
        ease: 'back.out(2)',
        overwrite: true,
      },
    );
  }
}
