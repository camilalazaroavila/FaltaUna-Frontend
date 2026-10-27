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
  signal,
  viewChild,
} from '@angular/core';
import { porcentaje } from '@modelos/misiones.model';
import type { LadoPartida } from '@modelos/partida.model';
import { GsapService } from '@servicios/gsap.service';
import type { ContextoGsap } from '@servicios/gsap.service';

const CLASES_RELLENO: Record<LadoPartida, string> = {
  propio: 'bg-barra-puntos-propio-relleno',
  rival: 'bg-barra-puntos-rival-relleno',
};

const NOMBRE_LADO: Record<LadoPartida, string> = {
  propio: 'propios',
  rival: 'del rival',
};

const ETIQUETA_LADO: Record<LadoPartida, string> = {
  propio: 'Vos',
  rival: 'Rival',
};

/**
 * Barra vertical de puntos hacia los 100 de la partida (jugador a la izquierda,
 * rival a la derecha). La barra propia se llena desde abajo y la del rival
 * desde arriba; el relleno anima la altura con una transición CSS y el `delta`
 * muestra un "+5"/"-5" flotante que se apaga solo con GSAP.
 */
@Component({
  selector: 'app-barra-puntos',
  templateUrl: './barra-puntos.html',
  styleUrl: './barra-puntos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
})
export class BarraPuntos implements AfterViewInit {
  private readonly gsapServicio = inject(GsapService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementoRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly referenciaDelta = viewChild<ElementRef<HTMLElement>>('deltaFlotante');

  readonly puntos = input.required<number>();
  readonly maximo = input(100);
  readonly lado = input<LadoPartida>('propio');
  readonly delta = input<number | null>(null);
  readonly cargando = input(false);

  private readonly cargandoInterno = signal(false);
  protected readonly enCarga = computed(() => this.cargando() || this.cargandoInterno());

  protected readonly movimientoReducido = this.gsapServicio.movimientoReducido;
  protected readonly porcentaje = computed(() => porcentaje(this.puntos(), this.maximo()));
  protected readonly esRival = computed(() => this.lado() === 'rival');
  protected readonly etiquetaLado = computed(() => ETIQUETA_LADO[this.lado()]);
  /** La barra propia se llena desde abajo; la del rival, desde arriba. */
  protected readonly clasesRelleno = computed(() =>
    [
      'absolute inset-x-0.5 rounded-pildora transition-[height] duration-700 ease-out motion-reduce:transition-none',
      CLASES_RELLENO[this.lado()],
      this.esRival() ? 'top-0.5' : 'bottom-0.5',
    ].join(' '),
  );
  /**
   * Número sobre la pastilla con `texto-contorno` y la misma tipografía
   * `font-titulo` que la leyenda de `app-barra-progreso` (álbumes). Propio
   * abajo, rival arriba, para leerse desde el lado de cada jugador.
   */
  protected readonly clasesNumero = computed(() =>
    [
      'absolute inset-x-0 flex justify-center overflow-hidden font-titulo tabular-nums texto-contorno text-texto-primario',
      this.esRival() ? 'top-1.5' : 'bottom-1.5',
    ].join(' '),
  );
  protected readonly clasesDelta = computed(() =>
    [
      'pointer-events-none h-5 text-center font-titulo text-menor tabular-nums texto-contorno text-texto-primario',
      this.delta() === null ? 'opacity-0' : '',
    ].join(' '),
  );
  protected readonly textoDelta = computed(() => {
    const delta = this.delta();

    return delta === null ? '' : `${delta > 0 ? '+' : ''}${delta}`;
  });
  protected readonly etiqueta = computed(
    () => `Puntos ${NOMBRE_LADO[this.lado()]}: ${this.puntos()} de ${this.maximo()}`,
  );

  private contexto?: ContextoGsap;
  private deltaAnterior?: number | null;
  private puntosAnteriores?: number;

  constructor() {
    effect(() => {
      const p = this.puntos();
      const ant = this.puntosAnteriores;
      this.puntosAnteriores = p;

      if (ant !== undefined && p > ant && !this.movimientoReducido()) {
        this.cargandoInterno.set(true);
        const t = setTimeout(() => {
          this.cargandoInterno.set(false);
        }, 1300);
        this.destroyRef.onDestroy(() => clearTimeout(t));
      }
    });

    effect(() => {
      const delta = this.delta();
      const anterior = this.deltaAnterior;
      this.deltaAnterior = delta;

      if (delta === null || anterior === delta || this.movimientoReducido()) {
        return;
      }

      const objetivo = this.referenciaDelta()?.nativeElement;

      if (!objetivo) {
        return;
      }

      this.contexto?.add(() => this.animarDelta(objetivo));
    });
  }

  ngAfterViewInit(): void {
    this.contexto = this.gsapServicio.crearContexto(
      this.elementoRef.nativeElement,
      () => undefined,
      this.destroyRef,
    );
  }

  /** El "+5" se agranda con rebote, flota hacia arriba y se apaga de forma llamativa. */
  private animarDelta(objetivo: HTMLElement): void {
    const { gsap } = this.gsapServicio;

    gsap.fromTo(
      objetivo,
      { y: 6, scale: 0.7, opacity: 0 },
      {
        y: -30,
        scale: 1.3,
        opacity: 1,
        duration: 0.45,
        ease: 'back.out(2)',
        onComplete: () => {
          gsap.to(objetivo, {
            opacity: 0,
            y: -44,
            duration: 0.35,
            delay: 0.45,
            ease: 'power2.in',
          });
        },
        overwrite: true,
      },
    );
  }
}
