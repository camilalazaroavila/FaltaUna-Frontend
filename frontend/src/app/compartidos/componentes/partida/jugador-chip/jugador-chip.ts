import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import type { LadoPartida } from '@modelos/partida.model';

const LADO_ARIA: Record<LadoPartida, string> = {
  propio: 'Jugador propio',
  rival: 'Jugador rival',
};

/**
 * Chip de identidad de un jugador dentro de la partida: avatar circular con
 * borde de zona y nombre. Si la imagen no carga, cae a la inicial del nombre.
 */
@Component({
  selector: 'app-jugador-chip',
  templateUrl: './jugador-chip.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class JugadorChip {
  readonly nombre = input.required<string>();
  readonly avatarUrl = input<string | null>(null);
  readonly lado = input<LadoPartida>('propio');

  protected readonly esRival = computed(() => this.lado() === 'rival');
  protected readonly inicial = computed(() => this.nombre().trim().charAt(0).toUpperCase() || '?');

  /** Se reinicia a `false` cada vez que cambia la URL del avatar. */
  protected readonly falloImagen = linkedSignal({
    source: () => this.avatarUrl(),
    computation: () => false,
  });

  protected readonly etiqueta = computed(() => {
    const posicion = this.esRival() ? 'derecha' : 'izquierda';

    return `${LADO_ARIA[this.lado()]}, ${this.nombre()}, posición ${posicion}`;
  });
}
