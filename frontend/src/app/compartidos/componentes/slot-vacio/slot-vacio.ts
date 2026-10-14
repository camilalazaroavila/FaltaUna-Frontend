import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/**
 * Casilla de carta faltante dentro de un álbum.
 *
 * Una única variante visual (ondas uniformes) para no dar significado a
 * estados decorativos. Si es `marcable`, renderiza un `<button>` operable por
 * teclado para marcarla como "carta que quiero"; si no, es una casilla
 * informativa con `role="img"`.
 */
@Component({
  selector: 'app-slot-vacio',
  imports: [NgIcon],
  templateUrl: './slot-vacio.html',
  styleUrl: './slot-vacio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class SlotVacio {
  /** Permite marcar/desmarcar como favorita. */
  readonly marcable = input(false);
  /** Estado actual de "carta que quiero". */
  readonly marcada = input(false);
  /** Nombre de la carta, solo para el `aria-label` (visualmente no se expone). */
  readonly etiqueta = input.required<string>();

  readonly alternar = output<void>();

  protected readonly ariaLabel = computed(() => {
    const base = `Carta faltante: ${this.etiqueta()}`;
    return this.marcada() ? `${base}, marcada como que la quiero` : base;
  });
}
