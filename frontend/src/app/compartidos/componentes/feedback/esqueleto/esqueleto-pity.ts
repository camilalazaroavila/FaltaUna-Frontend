import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Esqueleto } from './esqueleto';

/**
 * Esqueleto de carga para la vista de PT System (pity).
 *
 * Replica la grilla responsive (1 col mobile, 2 col desktop) y las tarjetas
 * con silueta de barra de progreso y sobre correspondiente.
 */
@Component({
  selector: 'app-esqueleto-pity',
  imports: [Esqueleto],
  templateUrl: './esqueleto-pity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class EsqueletoPity {
  readonly cantidad = input<number>(4);

  protected readonly itemsIndices = computed(() =>
    Array.from({ length: Math.max(1, this.cantidad()) }, (_, i) => i),
  );
}
