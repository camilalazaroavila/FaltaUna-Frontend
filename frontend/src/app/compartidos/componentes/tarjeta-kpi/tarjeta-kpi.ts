import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TONO_EMPRESA, type TonoAlbum } from '../../../modelos/empresa.mock';

/**
 * Tarjeta de indicador del panel de empresa: valor grande, etiqueta y un acento
 * lateral del color recibido. Se reutiliza en cualquier grilla de KPIs (detalle
 * de álbum, panel y galería de componentes).
 */
@Component({
  selector: 'app-tarjeta-kpi',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './tarjeta-kpi.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
})
export class TarjetaKpi {
  readonly etiqueta = input.required<string>();
  readonly valor = input.required<string>();
  readonly detalle = input<string>();
  readonly icono = input<string>();
  readonly tono = input<TonoAlbum>('violeta');

  protected readonly acento = computed(() => TONO_EMPRESA[this.tono()]);
}
