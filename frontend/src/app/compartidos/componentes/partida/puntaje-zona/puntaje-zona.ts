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
  'puntaje-insignia inline-flex min-w-[clamp(3.5rem,18cqw,5.75rem)] items-center justify-center gap-1.5 rounded-pildora border-2 px-[clamp(0.4rem,2cqw,0.75rem)] py-[clamp(0.1rem,1cqw,0.25rem)] shadow-cartoon transition-all duration-200';

const CLASES_ESTADO: Record<EstadoPuntajeZona, string> = {
  ganando: 'bg-puntaje-zona-ganando-fondo text-puntaje-zona-ganando-texto border-exito shadow-[0_0_10px_rgba(59,217,114,0.35)]',
  perdiendo: 'bg-puntaje-zona-perdiendo-fondo text-puntaje-zona-perdiendo-texto border-error/70',
  empate: 'bg-puntaje-zona-empate-fondo text-puntaje-zona-empate-texto border-zona-marco',
};

/** La forma comunica el estado aunque no se perciba el color. */
const SIMBOLO_ESTADO: Record<EstadoPuntajeZona, string> = {
  ganando: '▲',
  perdiendo: '▼',
  empate: '●',
};

/**
 * Badge con el puntaje de una zona para un lado del tablero. El estado se
 * indica con color, símbolo (▲ ▼ ●) y margen de diferencia.
 */
@Component({
  selector: 'app-puntaje-zona',
  templateUrl: './puntaje-zona.html',
  styleUrl: './puntaje-zona.css',
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
  readonly diferencia = input<number>(0);

  protected readonly movimientoReducido = this.gsapServicio.movimientoReducido;
  protected readonly simbolo = computed(() => SIMBOLO_ESTADO[this.estado()]);
  protected readonly clases = computed(() =>
    [CLASES_BASE, CLASES_ESTADO[this.estado()]].join(' '),
  );
  protected readonly etiqueta = computed(() => {
    const rol = this.lado() === 'propio' ? 'Puntaje propio' : 'Puntaje rival';
    const dif = this.diferencia();
    const detalle =
      dif > 0
        ? this.estado() === 'ganando'
          ? `, ganando por ${dif}`
          : `, perdiendo por ${dif}`
        : `, ${this.estado()}`;
    return `${rol}: ${this.puntos()}${detalle}`;
  });

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
