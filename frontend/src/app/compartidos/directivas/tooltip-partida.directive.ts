import {
  Directive,
  ElementRef,
  HostListener,
  OnDestroy,
  inject,
  input,
} from '@angular/core';

const RETARDO_HOVER_MS = 150;
const RETARDO_LONG_PRESS_MS = 450;
const UMBRAL_MOVIMIENTO_PX = 10;
const MARGEN_PANTALLA_PX = 10;

/**
 * Directiva de tooltip informativa para todos los elementos dentro de la partida.
 *
 * Comportamiento:
 * - En Desktop (mouse): se muestra en hover / focus tras un leve retardo.
 * - En Mobile (touch): se muestra al mantener presionado con el dedo (long-press).
 * - Para cartas en mobile: `esCarta` desactiva el long-press para no interferir
 *   con la pulsación y arrastre de la carta.
 *
 * El globo se inserta en `document.body` con `position: fixed` y z-index alto,
 * garantizando que nunca quede cortado por `overflow: hidden` del tablero.
 */
@Directive({
  selector: '[appTooltipPartida]',
  standalone: true,
})
export class TooltipPartidaDirective implements OnDestroy {
  readonly appTooltipPartida = input.required<string>();
  readonly posicionTooltip = input<'arriba' | 'abajo' | 'auto'>('auto');
  readonly esCarta = input(false);

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private globoElemento: HTMLElement | null = null;
  private timerHover: ReturnType<typeof setTimeout> | null = null;
  private timerTouch: ReturnType<typeof setTimeout> | null = null;
  private touchOrigen = { x: 0, y: 0 };
  private touchActivo = false;

  @HostListener('mouseenter')
  alEntrarMouse(): void {
    if (this.touchActivo) {
      return;
    }
    this.limpiarTimerHover();
    this.timerHover = setTimeout(() => this.mostrarGlobo(), RETARDO_HOVER_MS);
  }

  @HostListener('mouseleave')
  alSalirMouse(): void {
    this.limpiarTimerHover();
    if (!this.touchActivo) {
      this.ocultarGlobo();
    }
  }

  @HostListener('focusin')
  alFoco(): void {
    if (!this.touchActivo) {
      this.mostrarGlobo();
    }
  }

  @HostListener('focusout')
  alPerderFoco(): void {
    this.ocultarGlobo();
  }

  // Soporte PointerEvents
  @HostListener('pointerdown', ['$event'])
  alPulsarPointer(evento: { pointerType?: string; clientX?: number; clientY?: number }): void {
    if (evento.pointerType === 'touch') {
      this.iniciarPulsacionLarga(evento.clientX ?? 0, evento.clientY ?? 0);
    }
  }

  @HostListener('pointermove', ['$event'])
  alMoverPointer(evento: { pointerType?: string; clientX?: number; clientY?: number }): void {
    if (evento.pointerType === 'touch') {
      this.verificarMovimiento(evento.clientX ?? 0, evento.clientY ?? 0);
    }
  }

  @HostListener('pointerup', ['$event'])
  @HostListener('pointercancel', ['$event'])
  alLiberarPointer(evento: { pointerType?: string }): void {
    if (evento.pointerType === 'touch') {
      this.finalizarTouch();
    }
  }

  // Soporte TouchEvents nativos
  @HostListener('touchstart', ['$event'])
  alTouchStart(evento: TouchEvent): void {
    const t = evento.touches?.[0];
    if (t) {
      this.iniciarPulsacionLarga(t.clientX, t.clientY);
    }
  }

  @HostListener('touchmove', ['$event'])
  alTouchMove(evento: TouchEvent): void {
    const t = evento.touches?.[0];
    if (t) {
      this.verificarMovimiento(t.clientX, t.clientY);
    }
  }

  @HostListener('touchend')
  @HostListener('touchcancel')
  alTouchEnd(): void {
    this.finalizarTouch();
  }

  private iniciarPulsacionLarga(x: number, y: number): void {
    if (this.esCarta()) {
      return;
    }

    this.touchActivo = true;
    this.touchOrigen = { x, y };
    this.limpiarTimerTouch();

    this.timerTouch = setTimeout(() => {
      this.mostrarGlobo();
    }, RETARDO_LONG_PRESS_MS);
  }

  private verificarMovimiento(x: number, y: number): void {
    if (!this.touchActivo) {
      return;
    }

    const dist = Math.hypot(x - this.touchOrigen.x, y - this.touchOrigen.y);
    if (dist > UMBRAL_MOVIMIENTO_PX) {
      this.limpiarTimerTouch();
      this.ocultarGlobo();
      this.touchActivo = false;
    }
  }

  private finalizarTouch(): void {
    this.limpiarTimerTouch();
    setTimeout(() => {
      this.ocultarGlobo();
      this.touchActivo = false;
    }, 1500);
  }

  ngOnDestroy(): void {
    this.limpiarTimerHover();
    this.limpiarTimerTouch();
    this.ocultarGlobo();
  }

  protected mostrarGlobo(): void {
    const texto = this.appTooltipPartida()?.trim();
    if (!texto || typeof document === 'undefined') {
      return;
    }

    this.ocultarGlobo();

    const globo = document.createElement('div');
    globo.className = 'tooltip-partida-flotante';
    globo.setAttribute('role', 'tooltip');
    globo.textContent = texto;

    Object.assign(globo.style, {
      position: 'fixed',
      zIndex: '99999',
      maxWidth: 'min(20rem, calc(100vw - 24px))',
      padding: '0.5rem 0.75rem',
      borderRadius: 'var(--radio-md, 0.5rem)',
      backgroundColor: 'var(--tip-fondo, rgba(14, 28, 24, 0.96))',
      color: 'var(--tip-texto, #ffffff)',
      border: '1px solid var(--tip-borde, rgba(255, 255, 255, 0.18))',
      boxShadow: 'var(--tip-sombra, 0 8px 24px rgba(0, 0, 0, 0.4))',
      fontFamily: 'var(--fuente-interfaz, sans-serif)',
      fontSize: '0.75rem',
      fontWeight: '600',
      lineHeight: '1.35',
      textAlign: 'center',
      pointerEvents: 'none',
      opacity: '1',
      transform: 'scale(1)',
    });

    document.body.appendChild(globo);
    this.globoElemento = globo;

    this.posicionarGlobo(globo);
  }

  private posicionarGlobo(globo: HTMLElement): void {
    const rectHost = this.el.getBoundingClientRect();
    const rectGlobo = globo.getBoundingClientRect();

    const anchoVentana = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const altoVentana = typeof window !== 'undefined' ? window.innerHeight : 768;

    let left = rectHost.left + rectHost.width / 2 - rectGlobo.width / 2;
    left = Math.max(MARGEN_PANTALLA_PX, Math.min(left, anchoVentana - rectGlobo.width - MARGEN_PANTALLA_PX));

    const espacioAbajo = altoVentana - rectHost.bottom;
    const espacioArriba = rectHost.top;
    const preferencia = this.posicionTooltip();

    let top: number;
    if (preferencia === 'arriba' || (preferencia === 'auto' && espacioArriba > rectGlobo.height + 12 && espacioArriba > espacioAbajo)) {
      top = rectHost.top - rectGlobo.height - 8;
    } else {
      top = rectHost.bottom + 8;
    }

    top = Math.max(MARGEN_PANTALLA_PX, Math.min(top, altoVentana - rectGlobo.height - MARGEN_PANTALLA_PX));

    globo.style.left = `${Math.round(left)}px`;
    globo.style.top = `${Math.round(top)}px`;
  }

  protected ocultarGlobo(): void {
    if (this.globoElemento) {
      if (this.globoElemento.parentNode) {
        this.globoElemento.parentNode.removeChild(this.globoElemento);
      }
      this.globoElemento = null;
    }
  }

  private limpiarTimerHover(): void {
    if (this.timerHover !== null) {
      clearTimeout(this.timerHover);
      this.timerHover = null;
    }
  }

  private limpiarTimerTouch(): void {
    if (this.timerTouch !== null) {
      clearTimeout(this.timerTouch);
      this.timerTouch = null;
    }
  }
}
