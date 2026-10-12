import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

export type VarianteBadge =
  | 'exito'
  | 'advertencia'
  | 'error'
  | 'info'
  | 'atencion'
  | 'acento'
  | 'neutro';

export type TamanioBadge = 'sm' | 'md';

const CLASES_BASE =
  'inline-flex items-center rounded-pildora border border-transparent font-interfaz font-bold uppercase leading-none align-middle box-border select-none whitespace-nowrap transition-colors duration-200';

/**
 * La variante `acento` (por ejemplo "● 2/2 GRÁTIS") no usa fondo, borde ni alto
 * fijo: es un rótulo de tipografía display pegado a otro elemento.
 */
const CLASES_VARIANTE: Record<VarianteBadge, string> = {
  exito: 'bg-exito-fondo border-exito-borde text-exito-texto',
  advertencia: 'bg-advertencia-fondo border-advertencia-borde text-advertencia-texto',
  error: 'bg-error-fondo border-error-borde text-error-texto',
  info: 'bg-info-fondo border-info-borde text-info-texto',
  atencion: 'bg-atencion-fondo border-atencion-borde text-atencion-texto',
  neutro: 'bg-estado-neutro-fondo border-borde-default text-estado-neutro-texto',
  acento: 'h-auto border-transparent bg-transparent p-0 font-titulo text-sm tracking-[0.04em] text-marca-acento',
};

const CLASES_TAMANIO: Record<TamanioBadge, string> = {
  sm: 'h-[1.375rem] px-2 text-[0.6875rem] tracking-[0.05em]',
  md: 'h-[1.75rem] px-3 text-xs tracking-[0.05em]',
};

@Component({
  selector: 'app-badge',
  templateUrl: './badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'clases()',
  },
})
export class Badge {
  readonly variante = input<VarianteBadge>('exito');
  readonly punto = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly tamanio = input<TamanioBadge>('md');

  /** `true` solo para la variante `acento`, donde el punto usa la marca primaria. */
  protected readonly esAcento = computed(() => this.variante() === 'acento');

  protected readonly clases = computed(() => {
    const clases = [CLASES_BASE, CLASES_VARIANTE[this.variante()]];

    // La variante acento define su propia altura y padding: combinar ambas
    // familias produciría utilidades `height`/`padding` en conflicto.
    if (!this.esAcento()) {
      clases.push(CLASES_TAMANIO[this.tamanio()]);
    }

    return clases.join(' ');
  });
}
