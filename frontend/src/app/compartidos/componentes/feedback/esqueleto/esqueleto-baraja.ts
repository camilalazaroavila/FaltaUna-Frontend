import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Esqueleto } from './esqueleto';

/**
 * Esqueleto de carga para la vista de "Gestión de barajas" (`/usuario/mi-baraja`).
 *
 * Replica con precisión el layout de 2 columnas (panel 3x4 a la izquierda + catálogo
 * a la derecha), los selectores de baraja y los filtros para evitar CLS.
 */
@Component({
  selector: 'app-esqueleto-baraja',
  imports: [Esqueleto],
  templateUrl: './esqueleto-baraja.html',
  styleUrl: './esqueleto-baraja.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class EsqueletoBaraja {
  readonly cantidadCatalogo = input<number>(8);

  protected readonly slotsIndices = computed(() =>
    Array.from({ length: 12 }, (_, i) => i),
  );

  protected readonly catalogoIndices = computed(() =>
    Array.from({ length: Math.max(1, this.cantidadCatalogo()) }, (_, i) => i),
  );
}
