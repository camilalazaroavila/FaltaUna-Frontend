import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Esqueleto } from './esqueleto';

/**
 * Esqueleto de carga para la vista de Cupones del usuario.
 *
 * Replica la grilla adaptativa de sellos/cupones con proporciones 4/3 exactas
 * para evitar saltos en la interfaz.
 */
@Component({
  selector: 'app-esqueleto-cupones',
  imports: [Esqueleto],
  templateUrl: './esqueleto-cupones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class EsqueletoCupones {
  readonly cantidad = input<number>(8);

  protected readonly itemsIndices = computed(() =>
    Array.from({ length: Math.max(1, this.cantidad()) }, (_, i) => i),
  );
}
