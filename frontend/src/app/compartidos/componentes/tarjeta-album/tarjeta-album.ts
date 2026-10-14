import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { TONO_EMPRESA, type AlbumEmpresa, type ResumenAlbum } from '../../../modelos/empresa.mock';
import { BarraRareza } from '../barra-rareza/barra-rareza';
import { TarjetaRecompensa } from '../tarjeta-recompensa/tarjeta-recompensa';

/**
 * Tarjeta de álbum de empresa con estética de cupón: banda del color del álbum
 * con el nombre, cupón de recompensa, métricas agregadas y medidor de rareza.
 * Es la tarjeta que usan la grilla de empresa y la galería de componentes.
 */
@Component({
  selector: 'app-tarjeta-album',
  standalone: true,
  imports: [NgIcon, BarraRareza, TarjetaRecompensa],
  templateUrl: './tarjeta-album.html',
  styleUrl: './tarjeta-album.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
})
export class TarjetaAlbum {
  readonly album = input.required<AlbumEmpresa>();
  readonly resumen = input.required<ResumenAlbum>();
  readonly seleccionar = output<string>();

  protected readonly acento = computed(() => TONO_EMPRESA[this.album().tono]);
  protected readonly estado = computed(() =>
    this.album().estado === 'activo' ? 'Activo' : 'Finalizado',
  );
  protected readonly completado = computed(() => `${this.resumen().porcentajeCompletado}%`);
  protected readonly favoritos = computed(() => this.resumen().favoritos.toLocaleString('es-AR'));
}
