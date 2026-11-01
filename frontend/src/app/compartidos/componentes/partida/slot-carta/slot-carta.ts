import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { EstadoSlot, LadoPartida } from '@modelos/partida.model';

const CLASES_BASE =
  'relative flex aspect-[3/4] w-full items-center justify-center rounded-irregular-slot border-2 transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none';

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

/**
 * Casilla del tablero donde se baja una carta. Guarda el `data-slot-estado` y
 * `data-slot-lado` en el host para que el arrastre los consulte sin acoplarse
 * a clases.
 * - Los slots propios tienen borde blanco definido por token (`border-slot-propio-borde`).
 * - Los slots vacíos del rival se muestran desactivados/grises (`aria-disabled="true"`).
 */
@Component({
  selector: 'app-slot-carta',
  templateUrl: './slot-carta.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block',
    role: 'group',
    '[attr.data-slot-estado]': 'estado()',
    '[attr.data-slot-lado]': 'lado()',
    '[attr.aria-label]': 'etiqueta()',
    '[attr.aria-disabled]': 'esRival() ? true : null',
  },
})
export class SlotCarta {
  readonly lado = input<LadoPartida>('propio');
  readonly estado = input<EstadoSlot>('vacio');

  /** Se emite al pulsar el botón de jugar de una casilla disponible. */
  readonly jugar = output<void>();

  protected readonly vacio = computed(() => this.estado() === 'vacio');
  protected readonly esRival = computed(() => this.lado() === 'rival');
  protected readonly resaltado = computed(() => this.estado() === 'resaltado');
  protected readonly ocupado = computed(() => this.estado() === 'ocupado');
  protected readonly etiquetaBotonJugar = computed(
    () => `Jugar carta en esta casilla ${NOMBRE_LADO[this.lado()]}`,
  );

  protected readonly clases = computed(() => {
    if (this.esRival() && !this.ocupado()) {
      return [
        CLASES_BASE,
        'bg-slot-rival-bloqueado-fondo border-solid border-slot-rival-bloqueado-borde opacity-50 contrast-75 cursor-not-allowed select-none',
      ].join(' ');
    }

    // Slots propios: borde blanco visible (--color-slot-propio-borde)
    const bordePropio =
      this.lado() === 'propio'
        ? this.vacio()
          ? 'border-dashed border-slot-propio-borde shadow-cartoon'
          : this.ocupado()
            ? 'border-slot-propio-borde shadow-cartoon'
            : 'border-marca-primaria ring-4 ring-slot-resaltado-anillo animate-pulso-slot shadow-brillo-verde'
        : this.ocupado()
          ? 'border-slot-borde shadow-cartoon'
          : 'border-dashed border-slot-borde/60 shadow-cartoon';

    const desborde = this.ocupado() ? 'overflow-visible' : 'overflow-hidden';

    return [CLASES_BASE, CLASES_FONDO[this.lado()], bordePropio, desborde].join(' ');
  });

  protected readonly etiqueta = computed(
    () => `${ETIQUETA_ESTADO[this.estado()]} ${NOMBRE_LADO[this.lado()]}`,
  );
}
