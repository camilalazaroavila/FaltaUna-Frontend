import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TONO_EMPRESA, type TonoAlbum } from '@modelos/empresa.mock';

/**
 * Cupón de recompensa de un álbum: qué gana el jugador cuando completa la
 * colección. Estética de cupón (borde punteado + sello de color) para reforzar
 * la idea de premio canjeable.
 */
@Component({
  selector: 'app-tarjeta-recompensa',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './tarjeta-recompensa.html',
  styleUrl: './tarjeta-recompensa.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaRecompensa {
  readonly recompensa = input.required<string>();
  readonly rotulo = input('Recompensa al completar');
  readonly tono = input<TonoAlbum>('azul');

  protected readonly acento = computed(() => TONO_EMPRESA[this.tono()]);
}
