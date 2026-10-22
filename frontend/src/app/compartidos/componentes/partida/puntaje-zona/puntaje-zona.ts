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
  'inline-flex min-w-[clamp(2.75rem,16cqw,4.5rem)] items-center justify-center gap-1 rounded-pildora border-2 border-zona-marco px-[clamp(0.4rem,2cqw,0.75rem)] py-[clamp(0.1rem,1cqw,0.25rem)] shadow-cartoon';

const CLASES_ESTADO: Record<EstadoPuntajeZona, string> = {
  ganando: 'bg-puntaje-zona-ganando-fondo text-puntaje-zona-ganando-texto',
  perdiendo: 'bg-puntaje-zona-perdiendo-fondo text-puntaje-zona-perdiendo-texto',
  empate: 'bg-puntaje-zona-empate-fondo text-puntaje-zona-empate-texto',
};

/** La forma comunica el estado aunque no se perciba el color. */
const SIMBOLO_ESTADO: Record<EstadoPuntajeZona, string> = {
  ganando: '▲',
  perdiendo: '▼',
  empate: '●',
};

/**
 * Badge con el puntaje de una zona para un lado del tablero. El estado se
 * indica con color Y con un símbolo (▲ ▼ ●). Cada cambio de puntos da UNA
 * pasada de animación GSAP: rebote del número y, si el lado sube y va
 * ganando, un latido del badge. No hay animaciones continuas.
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
  private readonly referenciaInsignia = viewChild<ElementRef<HTMLElement>>('insignia');

  readonly puntos = input.required<number>();
  readonly estado = input<EstadoPuntajeZona>('empate');
  readonly lado = input<LadoPartida>('propio');

  protected readonly movimientoReducido = this.gsapServicio.movimientoReducido;
  protected readonly simbolo = computed(() => SIMBOLO_ESTADO[this.estado()]);
  protected readonly clases = computed(() =>
    [CLASES_BASE, CLASES_ESTADO[this.estado()]].join(' '),
  );
  protected readonly etiqueta = computed(
    () => `Puntaje ${this.lado()}: ${this.puntos()}, ${this.estado()}`,
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

      const numero = this.referenciaNumero()?.nativeElement;
      const insignia = this.referenciaInsignia()?.nativeElement;

      if (!numero) {
        return;
      }

      const subio = puntos > anteriores;
      const latir = subio && this.estado() === 'ganando' && !!insignia;

      this.contexto?.add(() => {
        if (latir && insignia) {
          this.animarLatido(insignia);
        }
        this.animarRebote(numero, subio);
      });
    });
  }

  ngAfterViewInit(): void {
    this.contexto = this.gsapServicio.crearContexto(
      this.elementoRef.nativeElement,
      () => undefined,
      this.destroyRef,
    );
  }

  /** Una sola pasada sobre el badge (el número rebota en su propio span). */
  private animarLatido(insignia: HTMLElement): void {
    this.gsapServicio.gsap.fromTo(
      insignia,
      { scale: 1.12 },
      {
        scale: 1,
        duration: this.gsapServicio.duracionPartida('micro'),
        ease: 'power2.out',
        overwrite: true,
      },
    );
  }

  /** Rebote corto del número sobre un span interno. */
  private animarRebote(objetivo: HTMLElement, subio: boolean): void {
    this.gsapServicio.gsap.fromTo(
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