import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type TipoPlan = 'basico' | 'standard' | 'premium' | string;

@Component({
  selector: 'app-cuadro-plan',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cuadro-plan.html',
  styleUrl: './cuadro-plan.scss',
})
export class CuadroPlan {
  readonly tipo = input.required<TipoPlan>();
  readonly titulo = input<string>();

  protected readonly textoMostrar = computed(() => {
    const custom = this.titulo();
    if (custom) return custom;
    const t = this.tipo().toLowerCase();
    if (t === 'basico') return 'BÁSICO';
    if (t === 'standard') return 'STANDARD';
    if (t === 'premium') return 'PREMIUM';
    return this.tipo().toUpperCase();
  });

  protected readonly clasesFondo = computed(() => {
    const t = this.tipo().toLowerCase();
    switch (t) {
      case 'basico':
        return 'cuadro-plan--basico';
      case 'standard':
        return 'cuadro-plan--standard';
      case 'premium':
        return 'cuadro-plan--premium';
      default:
        return 'cuadro-plan--basico';
    }
  });
}
