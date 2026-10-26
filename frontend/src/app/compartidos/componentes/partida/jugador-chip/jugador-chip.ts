import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import type { LadoPartida } from '@modelos/partida.model';

const LADO_ARIA: Record<LadoPartida, string> = {
  propio: 'Jugador propio',
  rival: 'Jugador rival',
};

type TamanioChip = 'sm' | 'md' | 'lg';

const CLASES_AVATAR: Record<TamanioChip, string> = {
  sm: 'h-10 w-10',
  md: 'h-12 w-12',
  lg: 'h-16 w-16 xl:h-18 xl:w-18',
};

const CLASES_INICIAL: Record<TamanioChip, string> = {
  sm: 'text-cuerpo',
  md: 'text-cuerpo',
  lg: 'text-subtitulo',
};

/**
 * Chip de identidad de un jugador dentro de la partida: avatar con marco
 * irregular (máscara `marco-imagen`) y nombre. Si la imagen no carga, cae a
 * la inicial del nombre. `tamanio="lg"` es el de las esquinas del tablero.
 */
@Component({
  selector: 'app-jugador-chip',
  templateUrl: './jugador-chip.html',
  styleUrl: './jugador-chip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class JugadorChip {
  readonly nombre = input.required<string>();
  readonly avatarUrl = input<string | null>(null);
  readonly lado = input<LadoPartida>('propio');
  readonly tamanio = input<TamanioChip>('md');

  protected readonly esRival = computed(() => this.lado() === 'rival');
  protected readonly inicial = computed(() => this.nombre().trim().charAt(0).toUpperCase() || '?');

  protected readonly clasesAvatar = computed(() => CLASES_AVATAR[this.tamanio()]);
  protected readonly clasesInicial = computed(() => CLASES_INICIAL[this.tamanio()]);

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
