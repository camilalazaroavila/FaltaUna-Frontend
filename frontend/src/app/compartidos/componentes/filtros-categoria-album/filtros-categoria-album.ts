import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorCaretDownFill, phosphorStackFill } from '@ng-icons/phosphor-icons/fill';

import { IconoCategoriaComponent } from '@compartidos/componentes/cartas/icono-categoria/icono-categoria.component';
import type { CategoriaAlbum } from '@modelos/album-jugador.model';
import { ETIQUETA_CATEGORIA } from '@modelos/carta.model';

/**
 * Selector superior de categorías para Álbumes: muestra un botón con la
 * categoría activa (o "Categorías") y despliega un menú anclado accesible
 * con "Todas" y cada categoría con su icono.
 */
@Component({
  selector: 'app-filtros-categoria-album',
  imports: [NgIcon, IconoCategoriaComponent],
  viewProviders: [provideIcons({ phosphorCaretDownFill, phosphorStackFill })],
  templateUrl: './filtros-categoria-album.html',
  styleUrl: './filtros-categoria-album.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-block' },
})
export class FiltrosCategoriaAlbum {
  private readonly elementoRef = inject(ElementRef<HTMLElement>);

  readonly categorias = input.required<readonly CategoriaAlbum[]>();
  readonly categoriaActiva = input<number | null>(null);

  readonly cambiar = output<number | null>();

  protected readonly abierto = signal(false);
  protected readonly etiquetaDe = ETIQUETA_CATEGORIA;

  /** Solo las categorías reconocidas: descarta las marcas sin categoría. */
  protected readonly conIcono = computed(() =>
    this.categorias().filter((categoria) => categoria.categoria !== null),
  );

  protected readonly categoriaActivaObj = computed(() => {
    const activaId = this.categoriaActiva();
    if (activaId === null) return null;
    return this.categorias().find((c) => c.id === activaId) ?? null;
  });

  @HostListener('document:click', ['$event'])
  alHacerClicFuera(evento: MouseEvent): void {
    if (!this.elementoRef.nativeElement.contains(evento.target as Node)) {
      this.abierto.set(false);
    }
  }

  @HostListener('keydown.escape')
  alPresionarEscape(): void {
    this.abierto.set(false);
  }

  alternar(): void {
    this.abierto.update((v) => !v);
  }

  abrir(): void {
    this.abierto.set(true);
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  alElegir(id: number): void {
    this.cambiar.emit(this.categoriaActiva() === id ? null : id);
    this.abierto.set(false);
  }

  alElegirTodas(): void {
    this.cambiar.emit(null);
    this.abierto.set(false);
  }
}
