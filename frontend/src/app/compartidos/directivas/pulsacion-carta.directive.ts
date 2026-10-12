import { Directive, DestroyRef, ElementRef, inject, input, output } from '@angular/core';

/** Tiempo que hay que mantener presionado para disparar la pulsación larga. */
const RETARDO_PULSACION_MS = 500;

/** Desplazamiento máximo (en píxeles) tolerado antes de cancelar la pulsación. */
const UMBRAL_MOVIMIENTO_PX = 10;

/** Ventana durante la cual se descarta el `click` que sigue a una pulsación larga. */
const VENTANA_SUPRESION_MS = 700;

/**
 * Gesto de tarjeta: emite `pulsacion` al mantener presionado (mouse o touch)
 * y, si `clicRaton` está activo, también al hacer clic con el mouse o activar
 * con el teclado. En touch, el tap simple no emite nada.
 *
 * Se usa tanto para abrir el detalle de una carta en "Mis cartas" como en el
 * catálogo de "Mi baraja", donde el clic ya selecciona: ahí el `click` que
 * sigue a una pulsación larga se intercepta para que no dispare la selección.
 */
@Directive({
  selector: '[appPulsacionCarta]',
  standalone: true,
  host: {
    '(pointerdown)': 'alPresionar($event)',
    '(pointermove)': 'alMover($event)',
    '(pointerup)': 'alSoltar($event)',
    '(pointercancel)': 'alCancelar()',
    '(pointerleave)': 'alCancelar()',
    '(contextmenu)': 'alMenuContexto($event)',
  },
})
export class PulsacionCartaDirective {
  /** Si es `true`, un clic de mouse o la activación por teclado también emiten. */
  readonly clicRaton = input(true);

  /** Se emite al cumplirse el gesto de apertura. */
  readonly pulsacion = output<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  private temporizador: ReturnType<typeof setTimeout> | null = null;
  private origen = { x: 0, y: 0 };
  private pointerActivo: number | null = null;
  private tipoPointer: string | null = null;
  private ultimaPulsacion = 0;

  constructor() {
    // El `click` que sigue a una pulsación larga se intercepta en fase de
    // captura para que no llegue al control interno (p. ej. la selección).
    this.host.addEventListener('click', this.alClic, true);
    // La pulsación larga no debe seleccionar texto ni abrir el menú nativo.
    this.host.style.setProperty('user-select', 'none');
    this.host.style.setProperty('-webkit-touch-callout', 'none');

    this.destroyRef.onDestroy(() => {
      this.limpiarTemporizador();
      this.host.removeEventListener('click', this.alClic, true);
    });
  }

  protected alPresionar(evento: PointerEvent): void {
    if (evento.pointerType === 'mouse' && evento.button !== 0) {
      return;
    }

    this.limpiarTemporizador();
    this.pointerActivo = evento.pointerId;
    this.tipoPointer = evento.pointerType;
    this.origen = { x: evento.clientX, y: evento.clientY };

    this.temporizador = setTimeout(() => {
      this.temporizador = null;
      this.ultimaPulsacion = Date.now();
      this.pulsacion.emit();
    }, RETARDO_PULSACION_MS);
  }

  protected alMover(evento: PointerEvent): void {
    if (this.temporizador === null) {
      return;
    }

    const dx = evento.clientX - this.origen.x;
    const dy = evento.clientY - this.origen.y;

    if (Math.hypot(dx, dy) > UMBRAL_MOVIMIENTO_PX) {
      this.limpiarTemporizador();
    }
  }

  protected alSoltar(evento: PointerEvent): void {
    if (this.pointerActivo !== null && evento.pointerId !== this.pointerActivo) {
      return;
    }

    this.limpiarTemporizador();
    this.pointerActivo = null;
  }

  protected alCancelar(): void {
    this.limpiarTemporizador();
    this.pointerActivo = null;
  }

  protected alMenuContexto(evento: Event): void {
    if (this.temporizador !== null || Date.now() - this.ultimaPulsacion < VENTANA_SUPRESION_MS) {
      evento.preventDefault();
    }
  }

  /** Listener de captura: decide si el `click` se emite o se descarta. */
  private readonly alClic = (evento: MouseEvent): void => {
    if (Date.now() - this.ultimaPulsacion < VENTANA_SUPRESION_MS) {
      evento.preventDefault();
      evento.stopPropagation();
      return;
    }

    if (!this.clicRaton()) {
      return;
    }

    // Teclado (detail === 0) o mouse; en touch el tap simple no abre.
    if (evento.detail !== 0 && this.tipoPointer !== 'mouse') {
      return;
    }

    this.pulsacion.emit();
  };

  private limpiarTemporizador(): void {
    if (this.temporizador !== null) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }
  }
}
