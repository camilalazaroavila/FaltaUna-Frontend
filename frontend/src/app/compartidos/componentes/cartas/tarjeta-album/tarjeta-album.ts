import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { type AlbumEmpresa, type ResumenAlbum } from '@modelos/empresa.mock';

/**
 * Tarjeta de álbum de empresa: banda violeta con el nombre del álbum,
 * métricas agregadas y botón de acción.
 */
@Component({
  selector: 'app-tarjeta-album',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './tarjeta-album.html',
  styleUrl: './tarjeta-album.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
})
export class TarjetaAlbum {
  readonly album = input.required<AlbumEmpresa>();
  readonly resumen = input.required<ResumenAlbum>();
  readonly seleccionar = output<string>();

  protected readonly tituloAlbum = computed(() => {
    return this.album().nombre
      .replace(/^(?:[áa]lbum\s+|colecci[oó]n\s*)/gi, '')
      .replace(/colecci[oó]n\s*/gi, '')
      .trim()
      .toUpperCase();
  });

  protected readonly descripcionAlbum = computed(() => {
    return this.album().descripcion
      .replace(/la colecci[oó]n/gi, 'el álbum')
      .replace(/las colecciones/gi, 'los álbumes')
      .replace(/colecci[oó]n/gi, 'álbum')
      .replace(/colecciones/gi, 'álbumes');
  });
  protected readonly estado = computed(() =>
    this.album().estado === 'activo' ? 'Activo' : 'Finalizado',
  );
  protected readonly completado = computed(() => `${this.resumen().porcentajeCompletado}%`);
  protected readonly favoritos = computed(() => this.resumen().favoritos.toLocaleString('es-AR'));
}
