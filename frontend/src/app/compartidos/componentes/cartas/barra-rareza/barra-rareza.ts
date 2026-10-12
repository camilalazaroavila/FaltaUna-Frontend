import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RepartoRareza } from '@modelos/empresa.mock';

/**
 * Medidor del reparto de cartas por rareza de un álbum: una barra segmentada
 * (un tramo por rareza, ancho proporcional) con leyenda opcional. Los colores
 * llegan resueltos a tokens en la propia entrada `reparto`.
 */
@Component({
  selector: 'app-barra-rareza',
  standalone: true,
  templateUrl: './barra-rareza.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class BarraRareza {
  readonly reparto = input.required<readonly RepartoRareza[]>();
  readonly mostrarLeyenda = input(true);
  readonly etiqueta = input('Reparto de cartas por rareza');
}
