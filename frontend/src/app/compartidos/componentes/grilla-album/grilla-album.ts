import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { SlotVacio } from '@compartidos/componentes/slot-vacio/slot-vacio';
import {
  cartaAlbumACarta,
  type CartaAlbum,
} from '@modelos/album-jugador.model';
import type { Carta } from '@modelos/carta.model';

/**
 * Grilla de un álbum: las cartas obtenidas se renderizan con `app-carta` y las
 * faltantes con el slot vacío uniforme. En modo "Marcar cartas que quiero"
 * tanto las obtenidas como las faltantes se vuelven botones con `aria-pressed`.
 */
@Component({
  selector: 'app-grilla-album',
  imports: [NgIcon, CartaComponent, SlotVacio],
  templateUrl: './grilla-album.html',
  styleUrl: './grilla-album.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrillaAlbum {
  readonly cartas = input.required<readonly CartaAlbum[]>();
  readonly modoMarcar = input(false);
  readonly favoritas = input<ReadonlySet<string>>(new Set<string>());

  readonly alternar = output<string>();

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
}
