import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { toast } from 'ngx-sonner';

import { EncabezadoAlbum } from '../../compartidos/componentes/encabezado-album/encabezado-album';
import { FiltrosCategoriaAlbum } from '../../compartidos/componentes/filtros-categoria-album/filtros-categoria-album';
import { GrillaAlbum } from '../../compartidos/componentes/grilla-album/grilla-album';
import { Header } from '../../compartidos/componentes/header/header';
import type {
  CategoriaAlbum,
  DetalleAlbum,
  ResumenAlbum,
} from '../../modelos/album-jugador.model';
import { AlbumesJugadorService } from '../../servicios/albumes-jugador.service';

/**
 * Vista "Álbumes" del jugador.
 *
 * A la izquierda, filtro por categoría de marca y listado de álbumes; a la
 * derecha, el álbum seleccionado con su progreso y su grilla. En mobile se
 * navega en dos pantallas (listado → detalle).
 *
 * Los componentes no hacen HTTP: todo pasa por `AlbumesJugadorService`, que
 * consume `ApiService` con respaldo mock mientras el backend no expone el
 * contrato acordado.
 */
@Component({
  selector: 'app-albumes',
  imports: [Header, FiltrosCategoriaAlbum, EncabezadoAlbum, GrillaAlbum],
  templateUrl: './albumes.html',
  styleUrl: './albumes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Albumes implements OnInit {
  private readonly servicio = inject(AlbumesJugadorService);

  protected readonly categorias = signal<readonly CategoriaAlbum[]>([]);
  protected readonly categoriaActiva = signal<number | null>(null);

  protected readonly albumes = signal<readonly ResumenAlbum[]>([]);
  protected readonly cargandoAlbumes = signal(true);
  protected readonly errorAlbumes = signal<string | null>(null);

  protected readonly albumSeleccionado = signal<ResumenAlbum | null>(null);
  protected readonly detalle = signal<DetalleAlbum | null>(null);
  protected readonly cargandoDetalle = signal(false);
  protected readonly errorDetalle = signal<string | null>(null);

  protected readonly modoMarcar = signal(false);
  protected readonly favoritas = signal<ReadonlySet<string>>(new Set<string>());

  /** Id de la carta cuyo guardado está en vuelo; evita el doble toque. */
  private readonly marcando = signal<string | null>(null);

  /** Logos de álbum que fallaron al cargar, para mostrar la inicial. */
  protected readonly logosFallidos = signal<ReadonlySet<number>>(new Set<number>());

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarAlbumes(null);
  }

  private cargarCategorias(): void {
    this.servicio.listarCategorias().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: () => this.categorias.set([]),
    });
  }

  protected cargarAlbumes(categoriaId: number | null): void {
    this.cargandoAlbumes.set(true);
    this.errorAlbumes.set(null);

    this.servicio.listarAlbumes(categoriaId).subscribe({
      next: (albumes) => {
        this.albumes.set(albumes);
        this.cargandoAlbumes.set(false);
      },
      error: () => {
        this.cargandoAlbumes.set(false);
        this.errorAlbumes.set('No pudimos cargar los álbumes.');
      },
    });
  }

  protected cambiarCategoria(categoriaId: number | null): void {
    this.categoriaActiva.set(categoriaId);
    this.volverALista();
    this.cargarAlbumes(categoriaId);
  }

  protected seleccionarAlbum(resumen: ResumenAlbum): void {
    this.albumSeleccionado.set(resumen);
    this.modoMarcar.set(false);
    this.cargarDetalle(resumen.id);
  }

  private cargarDetalle(id: number): void {
    this.cargandoDetalle.set(true);
    this.errorDetalle.set(null);
    this.detalle.set(null);

    this.servicio.obtenerDetalleAlbum(id).subscribe({
      next: (detalle) => {
        this.detalle.set(detalle);
        this.favoritas.set(
          new Set(detalle.cartas.filter((carta) => carta.favorita).map((carta) => carta.id)),
        );
        this.cargandoDetalle.set(false);
      },
      error: () => {
        this.cargandoDetalle.set(false);
        this.errorDetalle.set('No pudimos cargar este álbum.');
      },
    });
  }

  protected reintentarDetalle(): void {
    const album = this.albumSeleccionado();
    if (album) {
      this.cargarDetalle(album.id);
    }
  }

  protected reintentarAlbumes(): void {
    this.cargarAlbumes(this.categoriaActiva());
  }

  protected volverALista(): void {
    this.albumSeleccionado.set(null);
    this.detalle.set(null);
    this.modoMarcar.set(false);
  }

  protected alternarModoMarcar(): void {
    this.modoMarcar.update((activo) => !activo);
  }

  protected alternarFavorita(cartaId: string): void {
    if (this.marcando() !== null) {
      return;
    }

    const estabaMarcada = this.favoritas().has(cartaId);

    // Actualización optimista; se revierte si el backend rechaza.
    this.favoritas.set(this.conFavorita(cartaId, !estabaMarcada));
    this.marcando.set(cartaId);

    const peticion = estabaMarcada
      ? this.servicio.desmarcarFavorita(cartaId)
      : this.servicio.marcarFavorita(cartaId);

    peticion.subscribe({
      next: () => {
        this.marcando.set(null);
        toast.success(
          estabaMarcada ? 'La sacamos de tus cartas deseadas.' : '¡Guardada en tus cartas deseadas!',
        );
      },
      error: () => {
        this.favoritas.set(this.conFavorita(cartaId, estabaMarcada));
        this.marcando.set(null);
        toast.error('No pudimos guardar la marca. Probá de nuevo.');
      },
    });
  }

  protected hayFavoritas(): boolean {
    return this.favoritas().size > 0;
  }

  protected mostrarLogo(album: ResumenAlbum): boolean {
    return !!album.logoUrl && !this.logosFallidos().has(album.id);
  }

  protected alFallarLogo(album: ResumenAlbum): void {
    this.logosFallidos.update((set) => new Set(set).add(album.id));
  }

  private conFavorita(cartaId: string, marcada: boolean): ReadonlySet<string> {
    const copia = new Set(this.favoritas());
    if (marcada) {
      copia.add(cartaId);
    } else {
      copia.delete(cartaId);
    }
    return copia;
  }
}
