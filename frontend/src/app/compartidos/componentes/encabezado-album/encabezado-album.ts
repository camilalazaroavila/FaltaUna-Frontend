import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

import { BarraProgreso } from '@compartidos/componentes/feedback/barra-progreso/barra-progreso';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import type { ResumenAlbum } from '@modelos/album-jugador.model';
import type { CategoriaCupon } from '@modelos/cupon.model';

/**
 * Encabezado del álbum seleccionado: marca, descripción y progreso de obtención.
 * Cuando el álbum está completo ofrece un acceso directo a los cupones de esa
 * categoría.
 *
 * Soporta marca sin logo y logo que no carga (muestra la inicial de la marca).
 */
@Component({
  selector: 'app-encabezado-album',
  imports: [NgIcon, RouterLink, Boton, BarraProgreso],
  templateUrl: './encabezado-album.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncabezadoAlbum {
  readonly album = input.required<ResumenAlbum>();
  /** Categoría de cupón a preseleccionar en "Mis cupones"; `null` si no aplica. */
  readonly categoriaCupon = input<CategoriaCupon | null>(null);

  /** URL del logo que ya falló; se limpia sola al cambiar de álbum. */
  private readonly logoFallido = signal<string | null>(null);

  /** El álbum tiene todas sus cartas (y al menos una). */
  protected readonly completo = computed(
    () => this.album().total > 0 && this.album().obtenidas === this.album().total,
  );

  protected readonly queryParamsCupon = computed(() => {
    const categoria = this.categoriaCupon();
    return categoria ? { categoria } : {};
  });

  protected readonly mostrarLogo = computed(() => {
    const url = this.album().logoUrl;
    return !!url && this.logoFallido() !== url;
  });

  protected readonly inicial = computed(() =>
    (this.album().marcaNombre ?? '').trim().charAt(0).toUpperCase(),
  );

  protected alFallarLogo(): void {
    this.logoFallido.set(this.album().logoUrl);
  }
}
