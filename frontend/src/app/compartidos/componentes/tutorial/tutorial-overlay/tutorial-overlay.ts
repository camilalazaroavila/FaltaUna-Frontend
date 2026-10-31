import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { PASO_VISTA_PREVIA } from '@compartidos/componentes/tutorial/tutorial.pasos';
import { TutorialServicio } from '@compartidos/componentes/tutorial/tutorial.servicio';

interface Rectangulo {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

interface PosicionGlobo {
  readonly top: number;
  readonly left: number;
  readonly width: number;
}

const MARGEN = 12;
const SEPARACION = 14;
const ANCHO_MAXIMO_GLOBO = 380;
const ALTO_ESTIMADO_GLOBO = 280;
const MS_PISTA = 8000;

const limitar = (valor: number, minimo: number, maximo: number): number =>
  Math.min(Math.max(valor, minimo), Math.max(minimo, maximo));

/**
 * Overlay del tutorial guiado.
 *
 * Resalta el elemento marcado con `data-tutorial` y muestra un globo con el
 * paso actual. No bloquea el tablero: el velo y el spotlight no capturan
 * punteros, así el jugador puede arrastrar cartas y cerrar la ronda mientras
 * el tutorial está abierto.
 *
 * `vistaPrevia` lo muestra inline, sin partida, para la galería de componentes.
 */
@Component({
  selector: 'app-tutorial-overlay',
  templateUrl: './tutorial-overlay.html',
  styleUrl: './tutorial-overlay.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Boton],
})
export class TutorialOverlay {
  private readonly servicio = inject(TutorialServicio);
  private readonly destroyRef = inject(DestroyRef);
  private readonly globo = viewChild<ElementRef<HTMLElement>>('globo');

  /** Muestra el overlay estático dentro de un contenedor (galería). */
  readonly vistaPrevia = input(false);
  readonly salir = output<void>();
  readonly terminar = output<void>();

  protected readonly activo = computed(() => this.vistaPrevia() || this.servicio.activo());
  protected readonly paso = computed(() =>
    this.vistaPrevia() ? PASO_VISTA_PREVIA : this.servicio.paso(),
  );
  protected readonly indice = computed(() => (this.vistaPrevia() ? 0 : this.servicio.indice()));
  protected readonly total = computed(() => (this.vistaPrevia() ? 1 : this.servicio.total));
  protected readonly esUltimo = computed(() => !this.vistaPrevia() && this.servicio.esUltimo());
  protected readonly esperaCumplida = computed(
    () => this.vistaPrevia() || this.servicio.esperaCumplida(),
  );

  protected readonly rect = signal<Rectangulo | null>(null);
  protected readonly posicion = signal<PosicionGlobo>({ top: MARGEN, left: MARGEN, width: 320 });
  protected readonly pistaVisible = signal(false);
  protected readonly confirmandoSalida = signal(false);

  private readonly alRedimensionar = () => this.medir();
  private readonly alDesplazar = () => this.medir();

  constructor() {
    effect((onCleanup) => {
      this.servicio.indice();
      this.activo();
      this.pistaVisible.set(false);

      if (!this.activo() || this.vistaPrevia()) {
        return;
      }

      const temporizador = setTimeout(() => this.pistaVisible.set(true), MS_PISTA);
      onCleanup(() => clearTimeout(temporizador));
    });

    effect(() => {
      const activo = this.activo();
      const paso = this.servicio.paso();

      if (!activo || this.vistaPrevia()) {
        return;
      }

      queueMicrotask(() => this.medir());

      // En los pasos sin acción se lleva el foco al globo para que el lector
      // de pantalla anuncie el texto. En los pasos de acción se deja el foco
      // en el tablero para no interrumpir el arrastre.
      if (!paso.espera) {
        queueMicrotask(() => this.globo()?.nativeElement.focus());
      }
    });

    afterNextRender(() => {
      if (typeof window === 'undefined') {
        return;
      }

      window.addEventListener('resize', this.alRedimensionar);
      window.addEventListener('scroll', this.alDesplazar, true);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', this.alRedimensionar);
        window.removeEventListener('scroll', this.alDesplazar, true);
      });
      this.medir();
    });
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (!this.activo() || this.vistaPrevia()) {
      return;
    }

    if (this.confirmandoSalida()) {
      this.cancelarSalida();
      return;
    }

    // Si hay otro diálogo abierto (por ejemplo, el detalle de una carta),
    // Escape le pertenece a ese diálogo y no al tutorial.
    if (
      typeof document !== 'undefined' &&
      document.querySelector('[role="dialog"]:not(#tutorial-globo)')
    ) {
      return;
    }

    this.pedirSalida();
  }

  protected siguiente(): void {
    if (this.vistaPrevia()) {
      return;
    }

    if (!this.servicio.esperaCumplida()) {
      return;
    }

    if (this.servicio.esUltimo()) {
      this.servicio.completar();
      this.terminar.emit();
      return;
    }

    this.servicio.siguiente();
  }

  protected atras(): void {
    if (this.vistaPrevia()) {
      return;
    }

    this.servicio.atras();
  }

  protected pedirSalida(): void {
    this.confirmandoSalida.set(true);
  }

  protected cancelarSalida(): void {
    this.confirmandoSalida.set(false);
  }

  protected confirmarSalida(): void {
    this.confirmandoSalida.set(false);
    this.servicio.salir();
    this.salir.emit();
  }

  private medir(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (this.vistaPrevia()) {
      this.rect.set(null);
      this.centrarGlobo();
      return;
    }

    const ancla = this.paso().ancla;

    if (!ancla) {
      this.rect.set(null);
      this.centrarGlobo();
      return;
    }

    const objetivo = document.querySelector<HTMLElement>(`[data-tutorial="${ancla}"]`);

    if (!objetivo) {
      this.rect.set(null);
      this.centrarGlobo();
      return;
    }

    const caja = objetivo.getBoundingClientRect();

    this.rect.set({
      top: caja.top - 6,
      left: caja.left - 6,
      width: caja.width + 12,
      height: caja.height + 12,
    });
    this.posicionarGlobo(caja);
  }

  private posicionarGlobo(caja: DOMRect): void {
    const anchoVista = window.innerWidth;
    const altoVista = window.innerHeight;
    const ancho = Math.min(ANCHO_MAXIMO_GLOBO, anchoVista - MARGEN * 2);
    const alto = Math.min(ALTO_ESTIMADO_GLOBO, altoVista - MARGEN * 2);

    // En los pasos de acción el globo se ancla arriba a la izquierda para no
    // tapar la mano, las zonas ni el botón de turno que el jugador debe usar.
    if (this.paso().espera) {
      this.posicion.set({ top: MARGEN, left: MARGEN, width: ancho });
      return;
    }

    const izquierda = limitar(
      caja.left + caja.width / 2 - ancho / 2,
      MARGEN,
      anchoVista - ancho - MARGEN,
    );
    const arriba =
      caja.top > alto + SEPARACION + MARGEN
        ? caja.top - alto - SEPARACION
        : caja.bottom + SEPARACION;

    this.posicion.set({
      top: limitar(arriba, MARGEN, altoVista - alto - MARGEN),
      left: izquierda,
      width: ancho,
    });
  }

  private centrarGlobo(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const ancho = Math.min(ANCHO_MAXIMO_GLOBO, window.innerWidth - MARGEN * 2);
    const alto = Math.min(ALTO_ESTIMADO_GLOBO, window.innerHeight - MARGEN * 2);

    this.posicion.set({
      top: Math.max(MARGEN, (window.innerHeight - alto) / 2),
      left: Math.max(MARGEN, (window.innerWidth - ancho) / 2),
      width: ancho,
    });
  }
}
