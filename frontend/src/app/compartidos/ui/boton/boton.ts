import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
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

@Component({
  selector: 'button[app-boton], a[app-boton]',
  templateUrl: './boton.html',
  styleUrl: './boton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.btn]': 'true',
    '[class.btn--primario]': 'variante() === "primario"',
    '[class.btn--secundario]': 'variante() === "secundario"',
    '[class.btn--terciario]': 'variante() === "terciario"',
    '[class.btn--fantasma]': 'variante() === "fantasma"',
    '[class.btn--claro]': 'variante() === "claro"',
    '[class.btn--peligro]': 'variante() === "peligro"',
    '[class.btn--pildora]': 'forma() === "pildora"',
    '[class.btn--circulo]': 'forma() === "circulo"',
    '[class.btn--sm]': 'tamanio() === "sm"',
    '[class.btn--md]': 'tamanio() === "md"',
    '[class.btn--lg]': 'tamanio() === "lg"',
    '[class.btn--deshabilitado]': 'disabled()',
    '[attr.disabled]': 'esBoton && disabled() ? "" : null',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '[attr.tabindex]': 'esEnlace && disabled() ? "-1" : null',
  },
})
export class Boton implements AfterContentInit {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly variante = input<VarianteBoton>('primario');
  readonly forma = input<FormaBoton>('pildora');
  readonly tamanio = input<TamanioBoton>('md');
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });

  protected readonly esBoton = this.elementRef.nativeElement instanceof HTMLButtonElement;
  protected readonly esEnlace = this.elementRef.nativeElement instanceof HTMLAnchorElement;

  constructor() {
    // Captura temprana para cancelar navegación de RouterLink u otros listeners si está disabled
    this.elementRef.nativeElement.addEventListener(
      'click',
      (event: MouseEvent) => {
        if (this.disabled()) {
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
