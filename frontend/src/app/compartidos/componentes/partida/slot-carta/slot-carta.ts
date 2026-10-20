import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { EstadoSlot, LadoPartida } from '@modelos/partida.model';

const CLASES_BASE =
  'relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-irregular-slot border-2 transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none';

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
};

const CLASES_ESTADO: Record<EstadoSlot, string> = {
  vacio: 'border-dashed border-slot-borde/60 shadow-cartoon',
  ocupado: 'border-slot-borde shadow-cartoon',
  resaltado:
    'border-marca-primaria ring-4 ring-slot-resaltado-anillo animate-pulso-slot shadow-brillo-verde',
};

/**
 * Casilla del tablero donde se baja una carta. Guarda el `data-slot-estado` y
 * `data-slot-lado` en el host para que el arrastre los consulte sin acoplarse
 * a clases. El contenido de una carta jugada llega por `ng-content`. Cuando la
 * casilla está disponible muestra un botón con el icono de jugar: es la
 * alternativa accesible al arrastre (emite `jugar`).
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

  /** Se emite al pulsar el botón de jugar de una casilla disponible. */
  readonly jugar = output<void>();

  protected readonly vacio = computed(() => this.estado() === 'vacio');
  protected readonly resaltado = computed(() => this.estado() === 'resaltado');
  protected readonly ocupado = computed(() => this.estado() === 'ocupado');
  protected readonly etiquetaBotonJugar = computed(
    () => `Jugar carta en esta casilla ${NOMBRE_LADO[this.lado()]}`,
  );

  protected readonly clases = computed(() =>
    [CLASES_BASE, CLASES_FONDO[this.lado()], CLASES_ESTADO[this.estado()]].join(' '),
  );

  protected readonly etiqueta = computed(
    () => `${ETIQUETA_ESTADO[this.estado()]} ${NOMBRE_LADO[this.lado()]}`,
  );
}