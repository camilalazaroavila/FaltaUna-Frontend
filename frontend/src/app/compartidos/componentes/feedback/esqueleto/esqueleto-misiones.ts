import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Esqueleto } from './esqueleto';

/**
 * Esqueleto de carga para la vista de Misiones.
 *
 * Replica con precisión el alto, paddings y grilla responsive (1 col mobile,
 * 2 col desktop) de la vista de misiones, evitando saltos de diseño (CLS).
 */
@Component({
  selector: 'app-esqueleto-misiones',
  imports: [Esqueleto],
  templateUrl: './esqueleto-misiones.html',
  styleUrl: './esqueleto-misiones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class EsqueletoMisiones {
  readonly mostrarBono = input<boolean>(true);
  readonly conSobreEnTarjeta = input<boolean>(false);
  readonly cantidad = input<number>(4);

  protected readonly tarjetasIndices = computed(() =>
    Array.from({ length: Math.max(1, this.cantidad()) }, (_, i) => i),
  );
}
