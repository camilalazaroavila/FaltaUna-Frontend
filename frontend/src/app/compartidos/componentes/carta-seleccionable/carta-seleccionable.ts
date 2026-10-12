import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CartaComponent } from '../carta/carta';
import type { Carta } from '../../../modelos/carta.model';
import { ETIQUETA_RAREZA } from '../../../modelos/carta.model';

/**
 * Envuelve `app-carta` en un botón que permite seleccionar/deseleccionar la
 * carta (con estado "seleccionada" y estado "bloqueada" cuando se alcanzó el
 * tope de su rareza). El contenido interno se oculta a los lectores de pantalla
 * porque el botón ya expone un `aria-label` completo.
 */
@Component({
  selector: 'app-carta-seleccionable',
  standalone: true,
  imports: [CartaComponent],
  templateUrl: './carta-seleccionable.html',
  styleUrl: './carta-seleccionable.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.carta-seleccionable--comun]': 'carta().rareza === "comun"',
    '[class.carta-seleccionable--rara]': 'carta().rareza === "rara"',
    '[class.carta-seleccionable--epicarta]': 'carta().rareza === "epicarta"',
    '[class.carta-seleccionable--legendaria]': 'carta().rareza === "legendaria"',
    '[class.carta-seleccionable--seleccionada]': 'seleccionada()',
    '[class.carta-seleccionable--bloqueada]': 'bloqueada()',
  },
})
export class CartaSeleccionableComponent {
  readonly carta = input.required<Carta>();
  readonly seleccionada = input(false);
  readonly bloqueada = input(false);

  readonly alternar = output<Carta>();

  protected readonly ariaLabel = computed(() => {
    const c = this.carta();
    const base = `${c.nombre}, ${ETIQUETA_RAREZA[c.rareza]}`;

    if (this.bloqueada()) {
      return `${base}. No disponible: alcanzaste el límite de esta rareza.`;
    }
    return this.seleccionada() ? `${base}. Seleccionada.` : `${base}. Sin seleccionar.`;
  });

  protected alAlternar(): void {
    if (this.bloqueada()) {
      return;
    }
    this.alternar.emit(this.carta());
  }
}
