import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { EstadoSlot, LadoPartida } from '@modelos/partida.model';

const CLASES_BASE =
  'relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-md border-2 border-slot-borde shadow-cartoon transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none';

const CLASES_FONDO: Record<LadoPartida, string> = {
  propio: 'bg-slot-propio-fondo',
  rival: 'bg-slot-rival-fondo',
};

const NOMBRE_LADO: Record<LadoPartida, string> = {
  propio: 'del jugador',
  rival: 'del rival',
};

const ETIQUETA_ESTADO: Record<EstadoSlot, string> = {
  vacio: 'Casilla vacía',
  resaltado: 'Casilla disponible para jugar',
  ocupado: 'Carta jugada en esta casilla',
  'rival-oculto': 'Carta oculta del rival',
};

/**
 * Casilla del tablero donde se baja una carta. Guarda el `data-slot-estado` en el
 * host para que el futuro arrastre (GSAP Draggable) pueda consultarlo sin
 * acoplarse a clases. El contenido de una carta jugada llega por `ng-content`.
 */
@Component({
  selector: 'app-slot-carta',
  templateUrl: './slot-carta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  host: {
    class: 'block',
    role: 'group',
    '[attr.data-slot-estado]': 'estado()',
    '[attr.data-slot-lado]': 'lado()',
    '[attr.aria-label]': 'etiqueta()',
  },
})
export class SlotCarta {
  readonly lado = input<LadoPartida>('propio');
  readonly estado = input<EstadoSlot>('vacio');
  readonly avatarRival = input<string | null>(null);

  protected readonly vacio = computed(() => this.estado() === 'vacio');
  protected readonly resaltado = computed(() => this.estado() === 'resaltado');
  protected readonly ocupado = computed(() => this.estado() === 'ocupado');
  protected readonly rivalOculto = computed(() => this.estado() === 'rival-oculto');

  protected readonly clases = computed(() =>
    [
      CLASES_BASE,
      CLASES_FONDO[this.lado()],
      this.vacio() ? 'border-dashed border-slot-borde/60' : '',
      this.resaltado() ? 'ring-4 ring-slot-resaltado-anillo animate-pulso-slot' : '',
    ]
      .join(' ')
      .trim(),
  );

  protected readonly etiqueta = computed(
    () => `${ETIQUETA_ESTADO[this.estado()]} ${NOMBRE_LADO[this.lado()]}`,
  );
}
