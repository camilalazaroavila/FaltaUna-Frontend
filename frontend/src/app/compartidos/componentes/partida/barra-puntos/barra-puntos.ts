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
import { porcentaje } from '@modelos/misiones.model';
import type { LadoPartida } from '@modelos/partida.model';
import { GsapService } from '@servicios/gsap.service';
import type { ContextoGsap } from '@servicios/gsap.service';

const CLASES_BASE = 'flex items-center gap-3';

const CLASES_RELLENO: Record<LadoPartida, string> = {
  propio: 'bg-barra-puntos-propio-relleno',
  rival: 'bg-barra-puntos-rival-relleno',
};

const NOMBRE_LADO: Record<LadoPartida, string> = {
  propio: 'propios',
  rival: 'del rival',
};

/**
 * Barra de puntos hacia los 100 de la partida (jugador a la izquierda, rival a
 * la derecha). El relleno anima el ancho con una transición CSS; el `delta`
 * muestra un "+5"/"-5" flotante que se apaga solo con GSAP.
 */
@Component({
  selector: 'app-barra-puntos',
  templateUrl: './barra-puntos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
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

  protected readonly movimientoReducido = this.gsapServicio.movimientoReducido;
  protected readonly porcentaje = computed(() => porcentaje(this.puntos(), this.maximo()));
  protected readonly clasesRelleno = computed(() => CLASES_RELLENO[this.lado()]);
  protected readonly esRival = computed(() => this.lado() === 'rival');
  /** El rival invierte el orden: su número queda a la derecha de la barra. */
  protected readonly clasesBase = computed(() =>
    [CLASES_BASE, this.esRival() ? 'flex-row-reverse' : ''].join(' ').trim(),
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

  constructor() {
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

  /** El "+5" flota hacia arriba y se apaga: el elemento queda visible pero en opacidad 0. */
  private animarDelta(objetivo: HTMLElement): void {
    const { gsap } = this.gsapServicio;

    gsap.fromTo(
      objetivo,
      { y: 0, opacity: 1 },
      {
        y: -26,
        opacity: 0,
        duration: this.gsapServicio.duracionPartida('vuelo-carta'),
        ease: 'power2.out',
        overwrite: true,
      },
    );
  }
}
