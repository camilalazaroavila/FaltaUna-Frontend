import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { BotonFavorita } from '@compartidos/componentes/cartas/boton-favorita/boton-favorita';
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
 * Grilla de un álbum: todas las cartas se renderizan con `app-carta`; las
 * faltantes se ven en blanco y negro (`blancoYNegro`) en lugar del signo de pregunta.
 *
 * Cada carta tiene un corazón propio (`app-boton-favorita`) siempre visible, que
 * es el disparo principal y el que usan teclado y touch; además se puede alternar
 * con doble click sobre la celda.
 */
@Component({
  selector: 'app-grilla-album',
  imports: [CartaComponent, BotonFavorita],
  templateUrl: './grilla-album.html',
  styleUrl: './grilla-album.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrillaAlbum {
  readonly cartas = input.required<readonly CartaAlbum[]>();
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

  protected alTocar(cartaId: string): void {
    const ahora = Date.now();
    if (ahora - this.ultimaAlternancia < VENTANA_ALTERNANCIA_MS) {
      return;
    }
    this.ultimaAlternancia = ahora;
    this.alternar.emit(cartaId);
  }
}