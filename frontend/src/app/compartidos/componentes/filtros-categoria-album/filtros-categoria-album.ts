import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

import { IconoCategoriaComponent } from '@compartidos/componentes/cartas/icono-categoria/icono-categoria.component';
import type { CategoriaAlbum } from '@modelos/album-jugador.model';
import { ETIQUETA_CATEGORIA } from '@modelos/carta.model';

/**
 * Filtro lateral de la vista Álbumes: lista las 7 categorías de carta (con su
 * icono) y emite el `categoriaId` elegido (o `null` para "Todas"). El filtrado
 * real lo hace el backend (`?categoriaId=`), que filtra por la categoría de la
 * marca.
 */
@Component({
  selector: 'app-filtros-categoria-album',
  imports: [NgIcon, IconoCategoriaComponent],
  templateUrl: './filtros-categoria-album.html',
  styleUrl: './filtros-categoria-album.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltrosCategoriaAlbum {
  readonly categorias = input.required<readonly CategoriaAlbum[]>();
  readonly categoriaActiva = input<number | null>(null);

  readonly cambiar = output<number | null>();

  protected readonly etiquetaDe = ETIQUETA_CATEGORIA;

  /** Solo las categorías reconocidas: descarta las marcas sin categoría. */
  protected readonly conIcono = computed(() =>
    this.categorias().filter((categoria) => categoria.categoria !== null),
  );

  alElegir(id: number): void {
    this.cambiar.emit(this.categoriaActiva() === id ? null : id);
  }

  alElegirTodas(): void {
    this.cambiar.emit(null);
  }
}
