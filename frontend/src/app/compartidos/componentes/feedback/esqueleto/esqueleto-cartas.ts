import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { Esqueleto } from './esqueleto';

/**
 * Esqueleto de carga para la vista de "Mis cartas" (`/usuario/mis-cartas`).
 *
 * Replica fielmente el contador de resumen y la grilla responsive de cartas
 * coleccionables (aspect 5/7) para prevenir Cumulative Layout Shift (CLS).
 */
@Component({
  selector: 'app-esqueleto-cartas',
  imports: [Esqueleto],
  templateUrl: './esqueleto-cartas.html',
  styleUrl: './esqueleto-cartas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class EsqueletoCartas {
  readonly cantidad = input<number>(12);

  protected readonly itemsIndices = computed(() =>
    Array.from({ length: Math.max(1, this.cantidad()) }, (_, i) => i),
  );
}
