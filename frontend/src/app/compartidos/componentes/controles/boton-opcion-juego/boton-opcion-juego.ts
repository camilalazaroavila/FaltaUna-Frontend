import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';

export type TamanioBotonOpcionJuego = 'sm' | 'md' | 'lg';
export type AnchoBotonOpcionJuego = 'auto' | 'completo';

const CLASES_BASE = [
  'relative isolate box-border flex items-center overflow-hidden border-none bg-transparent text-left no-underline select-none',
  'font-titulo uppercase leading-[1.1] tracking-[0.04em] text-btn-juego-texto',
  // ::before = sombra sólida (fija)
  'before:absolute before:-left-(--sangrado) before:top-(--desfase) before:right-0 before:bottom-0 before:z-[-2]',
  'before:origin-bottom before:rounded-(--radio) before:bg-btn-juego-sombra before:skew-x-(--angulo)',
  // ::after = cara (se mueve en hover/active)
  'after:absolute after:-left-(--sangrado) after:top-0 after:right-(--desfase) after:bottom-(--desfase) after:z-[-1]',
  'after:origin-bottom after:rounded-(--radio) after:bg-btn-juego-bg after:skew-x-(--angulo)',
  'after:transition-[translate,transform] after:duration-150 after:ease-out',
  // contenido proyectado por encima de las capas
  '*:relative *:z-[1]',
  // foco: el outline externo lo recorta overflow-hidden, va inset sobre la cara
  'focus-visible:outline-none focus-visible:after:shadow-[inset_0_0_0_3px_var(--btn-juego-foco)]',
  'habilitado:cursor-pointer',
  'habilitado:hover:after:translate-x-0.5 habilitado:hover:after:translate-y-0.5',
  'habilitado:active:after:translate-x-(--desfase) habilitado:active:after:translate-y-(--desfase)',
  'motion-reduce:after:transition-none',
].join(' ');

const CLASES_TAMANIO: Record<TamanioBotonOpcionJuego, string> = {
  sm: [
    '[--angulo:28deg] [--desfase:6px] [--sangrado:62px] [--radio:14px]',
    'min-h-[4.75rem] text-[1.25rem]',
    'pt-3 pr-[calc(var(--desfase)+3.25rem)] pb-[calc(0.75rem+var(--desfase))] pl-[1.375rem]',
  ].join(' '),
  md: [
    '[--angulo:28deg] [--desfase:8px] [--sangrado:80px] [--radio:18px]',
    'min-h-[6.25rem] text-[1.75rem]',
    'pt-4 pr-[calc(var(--desfase)+4.375rem)] pb-[calc(1rem+var(--desfase))] pl-[1.875rem]',
  ].join(' '),
  lg: [
    '[--angulo:28deg] [--desfase:10px] [--sangrado:100px] [--radio:22px]',
    'min-h-[7.5rem] text-[2.125rem]',
    'pt-5 pr-[calc(var(--desfase)+5.5rem)] pb-[calc(1.25rem+var(--desfase))] pl-[2.25rem]',
  ].join(' '),
};

const CLASES_ANCHO: Record<AnchoBotonOpcionJuego, string> = {
  auto: 'w-fit',
  completo: 'w-full',
};

const CLASES_DESHABILITADO = 'cursor-not-allowed opacity-50';

@Component({
  selector: 'button[app-boton-opcion-juego], a[app-boton-opcion-juego]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  host: {
    '[class]': 'clases()',
    '[attr.disabled]': 'esBoton && deshabilitado() ? "" : null',
    '[attr.aria-disabled]': 'deshabilitado() ? "true" : null',
    '[attr.tabindex]': 'esEnlace && deshabilitado() ? "-1" : null',
  },
})
export class BotonOpcionJuego {
  readonly tamanio = input<TamanioBotonOpcionJuego>('md');
  readonly ancho = input<AnchoBotonOpcionJuego>('auto');
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly esBoton = this.el.tagName === 'BUTTON';
  protected readonly esEnlace = this.el.tagName === 'A';

  protected readonly deshabilitado = computed(() => this.disabled());

  protected readonly clases = computed(() =>
    [
      CLASES_BASE,
      CLASES_TAMANIO[this.tamanio()],
      CLASES_ANCHO[this.ancho()],
      this.deshabilitado() ? CLASES_DESHABILITADO : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  constructor() {
    // Bloquea routerLink y handlers ajenos cuando está deshabilitado
    this.el.addEventListener(
      'click',
      (e) => {
        if (this.deshabilitado()) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
  }
}