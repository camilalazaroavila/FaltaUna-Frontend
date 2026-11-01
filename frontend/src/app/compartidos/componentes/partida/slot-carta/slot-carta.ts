import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { EstadoSlot, LadoPartida } from '@modelos/partida.model';

/**
 * Sin `overflow-hidden` en la base: lo decide el estado. Un slot ocupado deja
 * desbordar para que el zoom de la carta no se recorte contra el borde.
 */
/*
    --barra-sombra-local: var(--blanco-puro);
    /* AJUSTABLE: 0.2rem es cuánto "baja" la sombra. 
    box-shadow: 0 0.2rem 0 var(--barra-sombra-local)*/
const CLASES_BASE =
  'relative flex aspect-[3/4] w-full items-center justify-center rounded-irregular-slot border-2 transition-[box-shadow,border-color] duration-200 motion-reduce:transition-none ';

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
  vacio: 'overflow-hidden border-dashed border-slot-borde/60 shadow-cartoon',
  ocupado: 'overflow-visible border-slot-borde shadow-cartoon',
  resaltado:
    'overflow-hidden border-marca-primaria ring-4 ring-slot-resaltado-anillo animate-pulso-slot shadow-brillo-verde',
};

/**
 * Casilla del tablero donde se baja una carta. Guarda el `data-slot-estado` y
 * `data-slot-lado` en el host para que el arrastre los consulte sin acoplarse
 * a clases. El contenido de una carta jugada llega por `ng-content`.
 * Los slots vacíos del rival se muestran desactivados/grises y marcados con
 * aria-disabled, sin hover ni interacción.
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

    return [CLASES_BASE, CLASES_FONDO[this.lado()], CLASES_ESTADO[this.estado()]].join(' ');
  });

  protected readonly etiqueta = computed(
    () => `${ETIQUETA_ESTADO[this.estado()]} ${NOMBRE_LADO[this.lado()]}`,
  );
}
