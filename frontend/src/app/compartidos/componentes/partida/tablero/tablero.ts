import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CartaPopupComponent } from '@compartidos/componentes/cartas/carta-popup/carta-popup';
import { BarraPuntos } from '@compartidos/componentes/partida/barra-puntos/barra-puntos';
import { ControlTurno } from '@compartidos/componentes/partida/control-turno/control-turno';
import { CuponRecurso } from '@compartidos/componentes/partida/cupon-recurso/cupon-recurso';
import { JugadorChip } from '@compartidos/componentes/partida/jugador-chip/jugador-chip';
import { Mano } from '@compartidos/componentes/partida/mano/mano';
import type { PosicionArrastre } from '@compartidos/componentes/partida/mano/mano';
import { Zona } from '@compartidos/componentes/partida/zona/zona';
import { ZonaPopupComponent } from '@compartidos/componentes/partida/zona-popup/zona-popup';
import type { Carta } from '@modelos/carta.model';
import type { NombreLugar } from '@modelos/partida.model';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';

/** Grados del extremo del abanico que forman los reversos de la mano rival. */
const ABANICO_RIVAL_GRADOS = 12;

/** Datos del slot que se está sobrevolando durante el arrastre. */
interface SlotSobrevolado {
  readonly lugar: NombreLugar;
  readonly indice: number;
  readonly elemento: HTMLElement;
}

/**
 * Pantalla de partida. Vos abajo a la izquierda, el rival arriba a la derecha,
 * el control de turno abajo a la derecha, las 2 zonas al centro y tu mano abajo
 * al centro.
 *
 * Los datos salen de `PartidaServicio`, que funciona en modo mock (galería) o
 * contra el backend (partida contra el bot).
 *
 * El arrastre de cartas lo orquesta este componente: la mano emite el inicio,
 * el movimiento y el fin; acá se resuelve el slot bajo el puntero y se juega la
 * carta con `jugarCarta()`, la misma vía que el botón de cada slot.
 */
@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.html',
  styleUrl: './tablero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Zona,
    ZonaPopupComponent,
    CartaPopupComponent,
    JugadorChip,
    BarraPuntos,
    CuponRecurso,
    ControlTurno,
    Mano,
  ],
})
export class Tablero {
  protected readonly servicio = inject(PartidaServicio);
  private readonly mano = viewChild(Mano);
  /**
   * Host del tablero: referencia de coordenadas de la mano. El containing block
   * del fantasma `fixed` es el div `.tablero` (`contain: layout`), que comparte
   * origen con este host.
   */
  protected readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;

  /** `true` cuando el drag de la galería fuerza el resaltado (demo). */
  readonly cartaAgarrada = input(false);
  readonly rendirse = output<void>();

  protected readonly lugares: readonly NombreLugar[] = ['izquierda', 'derecha'];
  protected readonly lugarAbierto = signal<NombreLugar | null>(null);
  protected readonly cartaAbierta = signal<Carta | null>(null);

  /** Carta que el usuario está arrastrando ahora mismo. */
  private readonly cartaEnArrastre = signal<Carta | null>(null);
  /** Carta enfocada con teclado: alternativa accesible al arrastre. */
  private readonly cartaSeleccionada = signal<Carta | null>(null);

  /**
   * Resalta los slots disponibles cuando hay una carta en juego: por el drag
   * real, por la selección con teclado o por el flag de la galería.
   */
  protected readonly resaltarSlots = computed(
    () => this.cartaEnArrastre() !== null || this.cartaSeleccionada() !== null || this.cartaAgarrada(),
  );

  protected readonly zonaAbierta = computed(() => {
    const lugar = this.lugarAbierto();

    return lugar ? this.servicio.lugares()[lugar].zona : null;
  });

  /** Reversos de la mano rival, cada uno con su ángulo de abanico (-12°..12°). */
  protected readonly reversosRival = computed(() => {
    const total = this.servicio.cartasManoRival();
    const paso = total > 1 ? (2 * ABANICO_RIVAL_GRADOS) / (total - 1) : 0;

    return Array.from({ length: total }, (_, i) => ({
      indice: i,
      angulo: `${total > 1 ? i * paso - ABANICO_RIVAL_GRADOS : 0}deg`,
    }));
  });

  protected alIniciarArrastre(carta: Carta): void {
    this.cartaEnArrastre.set(carta);
  }

  protected alSeleccionar(carta: Carta | null): void {
    this.cartaSeleccionada.set(carta);
  }

  protected alTerminarArrastre(posicion: PosicionArrastre): void {
    const carta = this.cartaEnArrastre();
    this.cartaEnArrastre.set(null);

    if (!carta) {
      return;
    }

    const slot = this.slotEnPosicion(posicion);

    if (slot && this.servicio.jugarCarta(carta, slot.lugar, slot.indice)) {
      this.mano()?.volarHacia(slot.elemento.getBoundingClientRect());
      return;
    }

    this.mano()?.cancelarArrastre();
    this.servicio.anunciar(`No se puede jugar ${carta.nombre} ahí. La carta vuelve a tu mano.`);
  }

  /** Jugar con el botón de un slot disponible (alternativa accesible al drag). */
  protected alJugarEnSlot(lugar: NombreLugar, indice: number): void {
    const carta = this.cartaEnArrastre() ?? this.cartaSeleccionada();

    if (carta && this.servicio.jugarCarta(carta, lugar, indice)) {
      this.cartaSeleccionada.set(null);
    }
  }

  /**
   * Devuelve el slot propio vacío que está bajo el puntero, o `null` si no hay
   * ninguno: así el drag solo juega sobre zonas realmente válidas.
   */
  private slotEnPosicion(posicion: PosicionArrastre): SlotSobrevolado | null {
    const elemento = document.elementFromPoint(posicion.x, posicion.y);
    const slot = elemento?.closest<HTMLElement>('[data-slot-lado="propio"]');

    if (!slot || slot.getAttribute('data-slot-estado') !== 'resaltado') {
      return null;
    }

    const contenedor = slot.closest<HTMLElement>('[data-lugar][data-indice]');
    const lugar = contenedor?.dataset['lugar'];
    const indice = Number(contenedor?.dataset['indice']);

    if ((lugar === 'izquierda' || lugar === 'derecha') && Number.isInteger(indice)) {
      return { lugar, indice, elemento: slot };
    }

    return null;
  }
}
