import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { BotonFavorita } from '@compartidos/componentes/cartas/boton-favorita/boton-favorita';
import { SlotVacio } from '@compartidos/componentes/slot-vacio/slot-vacio';
import {
  cartaAlbumACarta,
  type CartaAlbum,
} from '@modelos/album-jugador.model';
import type { Carta } from '@modelos/carta.model';

/**
 * Ventana mínima entre alternancias: un doble click dispara dos `click` y un
 * `dblclick`, y sin este filtro se alternaría tres veces.
 */
const VENTANA_ALTERNANCIA_MS = 320;

/**
 * Grilla de un álbum: las cartas obtenidas se renderizan con `app-carta` y las
 * faltantes con el slot vacío uniforme.
 *
 * Cada carta tiene un corazón propio (`app-boton-favorita`) siempre visible,
 * que es el disparo principal y el que usan teclado y touch. Fuera del modo
 * "Marcar cartas que quiero" además se puede alternar con doble click sobre la
 * carta; dentro del modo se conserva el toque simple.
 */
@Component({
  selector: 'app-grilla-album',
  imports: [CartaComponent, BotonFavorita, SlotVacio],
  templateUrl: './grilla-album.html',
  styleUrl: './grilla-album.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrillaAlbum {
  readonly cartas = input.required<readonly CartaAlbum[]>();
  readonly modoMarcar = input(false);
  readonly favoritas = input<ReadonlySet<string>>(new Set<string>());

  readonly alternar = output<string>();

  private ultimaAlternancia = 0;

  /**
   * Conversión a `Carta` resuelta una sola vez por lote, para que `app-carta`
   * reciba una referencia estable y no re-renderice en cada ciclo.
   */
  protected readonly cartasComponente = computed(() => {
    const mapa = new Map<string, Carta>();
    for (const carta of this.cartas()) {
      mapa.set(carta.id, cartaAlbumACarta(carta));
    }
    return mapa;
  });

  protected cartaDe(carta: CartaAlbum): Carta {
    return this.cartasComponente().get(carta.id) ?? cartaAlbumACarta(carta);
  }

  protected esFavorita(carta: CartaAlbum): boolean {
    return this.favoritas().has(carta.id);
  }

  protected etiquetaObtenida(carta: CartaAlbum): string {
    const base = `Carta ${carta.nombre}, obtenida`;
    return this.esFavorita(carta) ? `${base}, marcada como que la quiero` : base;
  }

  /** Doble click sobre la carta; solo fuera del modo "Marcar cartas". */
  protected alTocarDoble(cartaId: string): void {
    if (this.modoMarcar()) {
      return;
    }
    this.alTocar(cartaId);
  }

  protected alTocar(cartaId: string): void {
    const ahora = Date.now();
    if (ahora - this.ultimaAlternancia < VENTANA_ALTERNANCIA_MS) {
      return;
    }
    this.ultimaAlternancia = ahora;
    this.alternar.emit(cartaId);
  }
}
