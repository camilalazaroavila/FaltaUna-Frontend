import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
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

@Component({
  selector: 'app-badge',
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.badge]': 'true',
    '[class.badge--exito]': 'variante() === "exito"',
    '[class.badge--advertencia]': 'variante() === "advertencia"',
    '[class.badge--error]': 'variante() === "error"',
    '[class.badge--info]': 'variante() === "info"',
    '[class.badge--atencion]': 'variante() === "atencion"',
    '[class.badge--acento]': 'variante() === "acento"',
    '[class.badge--neutro]': 'variante() === "neutro"',
    '[class.badge--sm]': 'tamanio() === "sm"',
    '[class.badge--md]': 'tamanio() === "md"',
  },
})
export class Badge {
  readonly variante = input<VarianteBadge>('exito');
  readonly punto = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly tamanio = input<TamanioBadge>('md');
}
