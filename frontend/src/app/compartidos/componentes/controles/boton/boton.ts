import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
  isDevMode,
} from '@angular/core';

export type VarianteBoton =
  | 'primario'
  | 'secundario'
  | 'terciario'
  | 'fantasma'
  | 'claro'
  | 'peligro';

export type FormaBoton = 'pildora' | 'circulo';
export type TamanioBoton = 'sm' | 'md' | 'lg';

const CLASES_BASE = [
  'inline-flex items-center justify-center gap-2 border border-solid border-transparent',
  'font-interfaz font-bold uppercase leading-none no-underline',
  'box-border cursor-pointer select-none whitespace-nowrap',
  'transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 ease-out',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco',
  'motion-reduce:transition-none',
].join(' ');

/**
 * Los estados hover/active se AUSAN cuando el control está deshabilitado.
 * El `boton.scss` anterior lograba esto con `:not(.btn--deshabilitado)`; la
 * variante `habilitado` de styles.css lo resuelve para `<button>` y `<a>` por
 * igual, ya que un enlace nunca satisface `:enabled`.
 */
const CLASES_INTERACCION = 'habilitado:hover:-translate-y-px habilitado:active:scale-[0.97]';

const CLASES_VARIANTE: Record<VarianteBoton, string> = {
  primario: [
    'bg-btn-primario-bg text-btn-primario-texto shadow-baja',
    'habilitado:hover:bg-btn-primario-hover',
    'habilitado:active:bg-btn-primario-activo',
    'habilitado:hover:shadow-[var(--sombra-media),var(--sombra-brillo-verde)]',
  ].join(' '),
  secundario: [
    'bg-btn-secundario-bg text-btn-secundario-texto shadow-baja',
    'habilitado:hover:bg-btn-secundario-hover',
    'habilitado:active:bg-btn-secundario-activo',
    'habilitado:hover:shadow-media',
  ].join(' '),
  terciario: [
    'border-btn-terciario-borde bg-btn-terciario-bg text-btn-terciario-texto',
    'habilitado:hover:bg-btn-terciario-hover',
    'habilitado:active:bg-btn-terciario-activo',
  ].join(' '),
  fantasma: [
    'border-transparent bg-btn-fantasma-bg text-btn-fantasma-texto',
    'habilitado:hover:bg-btn-fantasma-hover',
    'habilitado:hover:text-texto-primario',
    'habilitado:active:bg-btn-fantasma-activo',
  ].join(' '),
  claro: [
    'border-borde-default bg-fondo-elevado text-texto-primario shadow-baja',
    'habilitado:hover:border-marca-acento',
    'habilitado:hover:bg-marca-acento',
    'habilitado:hover:text-marca-sobre-acento',
    'habilitado:hover:shadow-media',
    'habilitado:active:bg-marca-acento-activo',
  ].join(' '),
  peligro: [
    'bg-btn-peligro-bg text-btn-peligro-texto shadow-baja',
    'habilitado:hover:bg-btn-peligro-hover',
    'habilitado:active:bg-btn-peligro-activo',
    'habilitado:hover:shadow-media',
  ].join(' '),
};

const CLASES_PILDORA: Record<TamanioBoton, string> = {
  sm: 'h-8 rounded-pildora px-3.5 text-xs',
  md: 'h-[2.75rem] rounded-pildora px-6 text-sm',
  lg: 'h-[3.25rem] rounded-pildora px-8 text-base',
};

/**
 * El `::before` de 44x44px del `boton.scss` pasa a la utilidad `area-tactil`
 * para no perder el área táctil mínima de WCAG 2.5.5 en los tamaños compactos.
 */
const CLASES_CIRCULO: Record<TamanioBoton, string> = {
  sm: 'area-tactil h-8 w-8 rounded-circulo p-0 aspect-square text-sm',
  md: 'h-[2.75rem] w-[2.75rem] rounded-circulo p-0 aspect-square text-lg',
  lg: 'h-[3.25rem] w-[3.25rem] rounded-circulo p-0 aspect-square text-xl',
};

const CLASES_DESHABILITADO = 'cursor-not-allowed opacity-50 shadow-none';

@Component({
  selector: 'button[app-boton], a[app-boton]',
  templateUrl: './boton.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'clases()',
    '[attr.disabled]': 'esBoton && deshabilitado() ? "" : null',
    '[attr.aria-disabled]': 'deshabilitado() ? "true" : null',
    '[attr.aria-busy]': 'cargando() ? "true" : null',
    '[attr.tabindex]': 'esEnlace && deshabilitado() ? "-1" : null',
  },
})
export class Boton implements AfterContentInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly variante = input<VarianteBoton>('primario');
  readonly forma = input<FormaBoton>('pildora');
  readonly tamanio = input<TamanioBoton>('md');
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly cargando = input<boolean, unknown>(false, { transform: booleanAttribute });

  protected readonly esBoton = this.elementRef.nativeElement instanceof HTMLButtonElement;
  protected readonly esEnlace = this.elementRef.nativeElement instanceof HTMLAnchorElement;

  /** Un botón en estado de carga no debe disparar su acción. */
  protected readonly deshabilitado = computed(() => this.disabled() || this.cargando());

  protected readonly clases = computed(() => {
    const clases = [
      CLASES_BASE,
      CLASES_INTERACCION,
      CLASES_VARIANTE[this.variante()],
      this.forma() === 'circulo'
        ? CLASES_CIRCULO[this.tamanio()]
        : CLASES_PILDORA[this.tamanio()],
    ];

    if (this.deshabilitado()) {
      clases.push(CLASES_DESHABILITADO);
    }

    return clases.join(' ');
  });

  constructor() {
    // Captura temprana para cancelar navegación de RouterLink u otros listeners si está deshabilitado
    this.elementRef.nativeElement.addEventListener(
      'click',
      (event: MouseEvent) => {
        if (this.deshabilitado()) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true }
    );
  }

  ngAfterContentInit(): void {
    if (isDevMode()) {
      const el = this.elementRef.nativeElement;
      const tieneTexto = (el.textContent || '').trim().length > 0;
      const tieneAria = el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby');

      if (!tieneTexto && !tieneAria) {
        console.warn(
          '[app-boton]: Todo botón o enlace sin texto visible requiere "aria-label" o "aria-labelledby" para accesibilidad.'
        );
      }
    }
  }
}
