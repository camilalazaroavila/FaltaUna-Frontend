import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { EstrellaRarezaComponent } from '@compartidos/componentes/cartas/estrella-rareza/estrella-rareza.component';
import {
  ESTRELLAS_POR_RAREZA,
  ETIQUETA_RAREZA,
  type RarezaCarta,
} from '@modelos/carta.model';
import urlMisterio from '@svgs/PaqueteHuh.svg';

/**
 * Casilla de carta faltante dentro de un álbum.
 *
 * Muestra el sobre de la incógnita (`PaqueteHuh`) recortado como símbolo de
 * "carta misteriosa", y debajo el nombre y la rareza (estrellas) de la carta que
 * falta. Es una casilla informativa: la marca de favorita vive en el corazón que
 * la grilla superpone a cada celda.
 */
@Component({
  selector: 'app-slot-vacio',
  imports: [EstrellaRarezaComponent],
  templateUrl: './slot-vacio.html',
  styleUrl: './slot-vacio.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
})
export class SlotVacio {
  /** Nombre de la carta que falta. */
  readonly nombre = input.required<string>();
  /** Rareza de la carta que falta; define cuántas estrellas se muestran. */
  readonly rareza = input.required<RarezaCarta>();

  protected readonly urlMisterio = urlMisterio;

  protected readonly estrellas = computed(() =>
    Array.from({ length: ESTRELLAS_POR_RAREZA[this.rareza()] }, (_, i) => i),
  );

  protected readonly ariaLabel = computed(
    () => `Carta faltante: ${this.nombre()}, ${ETIQUETA_RAREZA[this.rareza()]}`,
  );
}
