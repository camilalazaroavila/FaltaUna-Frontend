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
  linkedSignal,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { PuntajeZona } from '@compartidos/componentes/partida/puntaje-zona/puntaje-zona';
import { SlotCarta } from '@compartidos/componentes/partida/slot-carta/slot-carta';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import type { Carta } from '@modelos/carta.model';
import type {
  EstadoPuntajeZona,
  EstadoSlot,
  NombreLugar,
  SlotsLado,
  ZonaTablero,
} from '@modelos/partida.model';
import { GsapService } from '@servicios/gsap.service';
import type { ContextoGsap } from '@servicios/gsap.service';

const IMAGEN_RESPALDO = 'imagenes/grido.jpg';

/** Visibilidad en segundos del delta cuando no se anima (movimiento reducido). */
const MS_DELTA_ESTATICO = 2000;

interface SlotVista {
  readonly indice: number;
  readonly carta: Carta | null;
  readonly estado: EstadoSlot;
}

const vistaLado = (cartas: SlotsLado, propio: boolean, resaltar: boolean): SlotVista[] =>
  cartas.map((carta, indice) => ({
    indice,
    carta,
    estado: carta ? 'ocupado' : propio && resaltar ? 'resaltado' : 'vacio',
  }));

const textoDelta = (delta: number): string =>
  delta > 0 ? `+${delta}` : delta < 0 ? `-${Math.abs(delta)}` : '';

/** El signo va en el texto: el color nunca es la única señal. */
const claseDelta = (delta: number): string =>
  [
    'block rounded-pildora border-2 border-zona-marco px-2 py-0.5 font-titulo text-menor leading-titulo tabular-nums shadow-cartoon',
    delta > 0 ? 'bg-exito text-exito-sobre' : delta < 0 ? 'bg-error text-error-sobre' : 'hidden',
  ].join(' ');

/**
 * Un lugar del tablero: foto de la zona con marco, puntaje de cada lado y
 * 6 slots por lado (2 filas x 3). El lado propio SIEMPRE va abajo.
 *
 * Las cartas pertenecen al LUGAR: cuando cambia la zona no se mueven ni se
 * animan. Solo se anima el marco, la foto y los deltas de puntaje.
 *
 * Cambio de zona (una sola secuencia GSAP): el marco viejo (con su color
 * anterior) se desarma, el marco nuevo (con su color nuevo) se estampa y la
 * foto aparece; el cambio de color ocurre dentro de esa secuencia.
 */
@Component({
  selector: 'app-zona',
  templateUrl: './zona.html',
  styleUrl: './zona.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SlotCarta, PuntajeZona, CartaComponent],
  host: { class: 'block w-full' },
})
export class Zona implements AfterViewInit {
  private readonly gsapServicio = inject(GsapService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementoRef = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly referenciaMarcoViejo = viewChild<ElementRef<HTMLElement>>('marcoViejo');
  private readonly referenciaMarcoNuevo = viewChild<ElementRef<HTMLElement>>('marcoNuevo');
  private readonly referenciaFoto = viewChild<ElementRef<HTMLElement>>('foto');
  private readonly referenciaDeltaPropio = viewChild<ElementRef<HTMLElement>>('refDeltaPropio');
  private readonly referenciaDeltaRival = viewChild<ElementRef<HTMLElement>>('refDeltaRival');

  readonly lugar = input<NombreLugar>('izquierda');
  readonly zona = input.required<ZonaTablero>();
  readonly cartasRival = input.required<SlotsLado>();
  readonly cartasPropias = input.required<SlotsLado>();
  readonly puntajeRival = input.required<number>();
  readonly puntajePropio = input.required<number>();
  readonly estadoRival = input<EstadoPuntajeZona>('empate');
  readonly estadoPropio = input<EstadoPuntajeZona>('empate');


  readonly verCarta = output<Carta>();

  /** `true` mientras el jugador tiene una carta agarrada: resalta sus slots vacíos. */
  readonly slotsResaltados = input(false);
  /** Cuánto cambió el puntaje de cada lado en la última rotación (0 = nada). */
  readonly deltaRival = input(0);
  readonly deltaPropio = input(0);

  readonly abrirPopup = output<void>();
  /** Índice del slot propio donde se pulsó "jugar" (alternativa al arrastre). */
  readonly jugarSlot = output<number>();

  protected readonly movimientoReducido = this.gsapServicio.movimientoReducido;
  protected readonly deltaEstatico = signal(false);

  protected readonly slotsRival = computed(() => vistaLado(this.cartasRival(), false, false));
  protected readonly slotsPropios = computed(() =>
    vistaLado(this.cartasPropias(), true, this.slotsResaltados()),
  );

  /** Se reinicia a `false` cada vez que cambia la foto de la zona. */
  protected readonly falloImagen = linkedSignal({
    source: () => this.zona().imagenUrl,
    computation: () => false,
  });
  protected readonly imagen = computed(() =>
    this.falloImagen() ? IMAGEN_RESPALDO : this.zona().imagenUrl,
  );

  /** Decisión visual (mock): el marco se destaca cuando el lado propio va ganando. */
  protected readonly marcoDestacado = computed(() => this.estadoPropio() === 'ganando');
  protected readonly clasesMarco = computed(() =>
    this.marcoDestacado() ? 'bg-zona-marco-destacado' : 'bg-zona-marco',
  );

  protected readonly etiquetaFoto = computed(() => `Ver efecto de la zona ${this.zona().nombre}`);

  protected readonly textoDeltaPropio = computed(() => textoDelta(this.deltaPropio()));
  protected readonly textoDeltaRival = computed(() => textoDelta(this.deltaRival()));
  protected readonly claseDeltaPropio = computed(() => claseDelta(this.deltaPropio()));
  protected readonly claseDeltaRival = computed(() => claseDelta(this.deltaRival()));

  private contexto?: ContextoGsap;
  private zonaAnteriorId?: number;
  private destacadoAnterior = false;
  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.temporizador));

    effect(() => {
      const id = this.zona().id;
      const destacado = this.marcoDestacado();
      const idAnterior = this.zonaAnteriorId;
      const destacadoPrevio = this.destacadoAnterior;

      this.zonaAnteriorId = id;
      this.destacadoAnterior = destacado;

      // La primera lectura solo guarda el estado: no hay "cambio" que animar.
      if (idAnterior === undefined || idAnterior === id) {
        return;
      }

      untracked(() => this.reproducirCambio(destacadoPrevio));
    });
  }

  ngAfterViewInit(): void {
    this.contexto = this.gsapServicio.crearContexto(
      this.elementoRef.nativeElement,
      () => undefined,
      this.destroyRef,
    );
  }

  private enModoReducido(): boolean {
    return this.elementoRef.nativeElement.closest('[data-movimiento="reducido"]') !== null;
  }

  /** Sin GSAP: el cambio es instantáneo y el delta se muestra como texto un momento. */
  private mostrarDeltaEstatico(): void {
    clearTimeout(this.temporizador);
    this.deltaEstatico.set(true);
    this.temporizador = setTimeout(() => this.deltaEstatico.set(false), MS_DELTA_ESTATICO);
  }

  private reproducirCambio(destacadoPrevio: boolean): void {
    if (this.movimientoReducido() || this.enModoReducido()) {
      this.mostrarDeltaEstatico();
      return;
    }

    const viejo = this.referenciaMarcoViejo()?.nativeElement;
    const nuevo = this.referenciaMarcoNuevo()?.nativeElement;
    const foto = this.referenciaFoto()?.nativeElement;

    if (!viejo || !nuevo || !foto) {
      return;
    }

    const deltaPropio = this.referenciaDeltaPropio()?.nativeElement;
    const deltaRival = this.referenciaDeltaRival()?.nativeElement;
    const valorPropio = this.deltaPropio();
    const valorRival = this.deltaRival();
    const duracion = this.gsapServicio.duracionPartida('cambio-zona');

    // El fantasma conserva el color del marco anterior (solo tokens, sin hex).
    viejo.style.backgroundColor = destacadoPrevio
      ? 'var(--zona-marco-destacado)'
      : 'var(--zona-marco)';
    this.deltaEstatico.set(false);

    this.contexto?.add(() => {
      const { gsap } = this.gsapServicio;
      const linea = gsap.timeline();

      linea
        .fromTo(
          viejo,
          { opacity: 1, scale: 1, rotate: 0 },
          { opacity: 0, scale: 1.3, rotate: 8, duration: duracion * 0.45, ease: 'power2.in' },
          0,
        )
        .fromTo(
          nuevo,
          { opacity: 0, scale: 0.7 },
          { opacity: 1, scale: 1, duration: duracion * 0.5, ease: 'back.out(2)' },
          duracion * 0.3,
        )
        .fromTo(
          foto,
          { opacity: 0, scale: 0.8, rotate: -6 },
          { opacity: 1, scale: 1, rotate: 0, duration: duracion * 0.5, ease: 'back.out(1.7)' },
          duracion * 0.35,
        );

      const flotar = (elemento: HTMLElement | undefined, valor: number): void => {
        if (!elemento || valor === 0) {
          return;
        }

        linea
          .fromTo(
            elemento,
            { opacity: 0, y: 8, scale: 0.6 },
            { opacity: 1, y: -6, scale: 1, duration: duracion * 0.35, ease: 'back.out(2)' },
            duracion * 0.5,
          )
          .to(
            elemento,
            { opacity: 0, y: -22, duration: duracion * 0.45, ease: 'power2.in' },
            duracion * 1.3,
          );
      };

      flotar(deltaPropio, valorPropio);
      flotar(deltaRival, valorRival);
    });
  }
}