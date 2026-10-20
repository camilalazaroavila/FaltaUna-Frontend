import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import type { Carta } from '@modelos/carta.model';
import { GsapService } from '@servicios/gsap.service';

/** Grados de inclinación entre la primera y la última carta. */
const ABANICO_TOTAL_GRADOS = 28;
/** Cuánto baja (rem) la carta más alejada del centro. */
const CAIDA_MAXIMA_REM = 1;
/** Píxeles que hay que mover antes de considerar que empezó un arrastre. */
const UMBRAL_ARRASTRE_PX = 6;

interface CartaMano {
  readonly carta: Carta;
  readonly angulo: string;
  readonly caida: string;
}

/** Posición del puntero durante el arrastre, en coordenadas de viewport. */
export interface PosicionArrastre {
  readonly x: number;
  readonly y: number;
}

/**
 * Mano del jugador en abanico: las cartas se solapan, se inclinan según su
 * distancia al centro y la carta enfocada crece y sube. Tocar una emite `ver`.
 *
 * El arrastre usa Pointer Events (mouse y táctil por igual): al superar un
 * umbral se emite `arrastreInicio`, luego `arrastreMueve` en cada movimiento y
 * `arrastreFin` al soltar. El clic se cancela si hubo arrastre para no abrir el
 * detalle de la carta por accidente. Quién juega la carta lo decide el tablero.
 */
@Component({
  selector: 'app-mano',
  templateUrl: './mano.html',
  styleUrl: './mano.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CartaComponent],
  host: { class: 'block' },
})
export class Mano {
  readonly cartas = input.required<readonly Carta[]>();
  /**
   * Elemento que actúa como containing block del fantasma `position: fixed`
   * (el host de `app-tablero`, que tiene `container-type`). Se usa para pasar
   * las coordenadas del puntero a coordenadas locales y no desplazar el clon.
   */
  readonly referencia = input<HTMLElement | null>(null);
  readonly ver = output<Carta>();
  readonly arrastreInicio = output<Carta>();
  readonly arrastreMueve = output<PosicionArrastre>();
  readonly arrastreFin = output<PosicionArrastre>();
  /** Carta enfocada con teclado: habilita la alternativa de jugar por botón. */
  readonly seleccion = output<Carta | null>();

  private readonly contenedor: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly gsapServicio = inject(GsapService);

  /** Carta que se está arrastrando (null si no hay arrastre en curso). */
  protected readonly arrastrando = signal<Carta | null>(null);
  /**
   * Posición del puntero mientras se arrastra, ya expresada en coordenadas del
   * containing block del fantasma (no del viewport).
   */
  protected readonly puntero = signal<PosicionArrastre | null>(null);

  private readonly umbralActivo = signal(false);
  private origen: PosicionArrastre | null = null;
  private punteroActivo?: number;

  protected readonly disposicion = computed<CartaMano[]>(() => {
    const cartas = this.cartas();
    const total = cartas.length;

    return cartas.map((carta, i) => {
      // -1 (izquierda) … 0 (centro) … 1 (derecha)
      const posicion = total > 1 ? (i / (total - 1)) * 2 - 1 : 0;

      return {
        carta,
        angulo: `${posicion * (ABANICO_TOTAL_GRADOS / 2)}deg`,
        caida: `${Math.abs(posicion) ** 2 * CAIDA_MAXIMA_REM}rem`,
      };
    });
  });

  /**
   * Separaciones entre cartas: el CSS reparte el ancho disponible y calcula el
   * solape solo, así entran 3, 6 o 12 sin desbordar la mano.
   */
  protected readonly separaciones = computed(() => Math.max(1, this.cartas().length - 1));

  protected readonly cartaArrastradaVisible = computed(() => this.arrastrando() !== null);

  protected alPulsar(carta: Carta, evento: PointerEvent): void {
    if (evento.button !== 0 && evento.pointerType === 'mouse') {
      return;
    }

    const objetivo = evento.currentTarget as HTMLElement;

    this.origen = { x: evento.clientX, y: evento.clientY };
    this.punteroActivo = evento.pointerId;
    this.arrastrando.set(carta);
    this.puntero.set(this.aLocal(this.origen));
    objetivo.setPointerCapture(evento.pointerId);
  }

  protected alMover(evento: PointerEvent): void {
    const carta = this.arrastrando();

    if (!carta || evento.pointerId !== this.punteroActivo) {
      return;
    }

    const origen = this.origen;

    if (!this.umbralActivo() && origen) {
      const distancia = Math.hypot(evento.clientX - origen.x, evento.clientY - origen.y);

      if (distancia < UMBRAL_ARRASTRE_PX) {
        return;
      }

      this.umbralActivo.set(true);
      this.arrastreInicio.emit(carta);
    }

    this.puntero.set(this.aLocal({ x: evento.clientX, y: evento.clientY }));
    this.arrastreMueve.emit({ x: evento.clientX, y: evento.clientY });
  }

  /** Convierte coordenadas de viewport a coordenadas del containing block. */
  private aLocal(posicion: PosicionArrastre): PosicionArrastre {
    const referencia = this.referencia();

    if (!referencia) {
      return posicion;
    }

    const rect = referencia.getBoundingClientRect();

    return { x: posicion.x - rect.left, y: posicion.y - rect.top };
  }

  protected alSoltar(evento: PointerEvent): void {
    if (evento.pointerId !== this.punteroActivo) {
      return;
    }

    const carta = this.arrastrando();
    const posicion = { x: evento.clientX, y: evento.clientY };

    (evento.currentTarget as HTMLElement).releasePointerCapture?.(evento.pointerId);

    if (this.umbralActivo()) {
      // El fantasma sigue vivo: el tablero decide si vuela al slot o se anula.
      this.arrastreFin.emit(posicion);
      return;
    }

    if (carta) {
      this.ver.emit(carta);
    }

    this.reiniciar();
  }

  /**
   * Con teclado: Espacio selecciona la carta y resalta los slots disponibles
   * (alternativa accesible al arrastre); Enter mantiene el detalle de la carta.
   * Con mouse/táctil el flujo es el arrastre.
   */
  protected alTeclear(carta: Carta, evento: KeyboardEvent): void {
    if (evento.key === ' ') {
      evento.preventDefault();
      this.seleccion.emit(this.arrastrando()?.id === carta.id ? null : carta);
      return;
    }

    if (evento.key === 'Enter') {
      this.ver.emit(carta);
    }
  }

  protected alCancelar(evento: PointerEvent): void {
    if (evento.pointerId !== this.punteroActivo) {
      return;
    }

    if (this.umbralActivo()) {
      this.arrastreFin.emit({ x: evento.clientX, y: evento.clientY });
      return;
    }

    this.reiniciar();
  }

  /**
   * El tablero resuelve el fin del arrastre: si el destino es válido, anima el
   * fantasma del puntero al centro del slot y recién ahí limpia; si no, lo
   * devuelve a su lugar sin jugar. La animación respeta movimiento reducido.
   */
  volarHacia(destino: DOMRect): void {
    const fantasma = this.contenedor.nativeElement.querySelector<HTMLElement>('.mano-fantasma');

    if (!fantasma || this.gsapServicio.movimientoReducido()) {
      this.reiniciar();
      return;
    }

    const centro = this.aLocal({
      x: destino.left + destino.width / 2,
      y: destino.top + destino.height / 2,
    });
    const actual = this.puntero();

    this.gsapServicio.gsap.to(fantasma, {
      x: centro.x - (actual?.x ?? centro.x),
      y: centro.y - (actual?.y ?? centro.y),
      scale: 0.9,
      opacity: 0,
      duration: this.gsapServicio.duracionPartida('vuelo-carta'),
      ease: 'power2.in',
      onComplete: () => this.reiniciar(),
    });
  }

  /** Anula el arrastre en curso (destino inválido) sin jugar la carta. */
  cancelarArrastre(): void {
    if (this.arrastrando()) {
      this.reiniciar();
    }
  }

  private reiniciar(): void {
    this.arrastrando.set(null);
    this.puntero.set(null);
    this.umbralActivo.set(false);
    this.origen = null;
    this.punteroActivo = undefined;
  }
}
