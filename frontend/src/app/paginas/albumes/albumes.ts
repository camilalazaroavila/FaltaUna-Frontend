import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from 'ngx-sonner';

import { EncabezadoAlbum } from '@compartidos/componentes/encabezado-album/encabezado-album';
import { Tooltip } from '@compartidos/componentes/feedback/tooltip/tooltip';
import { FiltrosCategoriaAlbum } from '@compartidos/componentes/filtros-categoria-album/filtros-categoria-album';
import { GrillaAlbum } from '@compartidos/componentes/grilla-album/grilla-album';
import { Header } from '@compartidos/componentes/layout/header/header';
import {
  categoriaCartaDesdeNombre,
  type CategoriaAlbum,
  type DetalleAlbum,
  type ResumenAlbum,
} from '@modelos/album-jugador.model';
import { esCartaSinMarca } from '@modelos/catalogo-cartas-imagenes';
import { normalizarNombre } from '@modelos/categoria.model';
import { categoriaCuponDesdeCarta, type CategoriaCupon } from '@modelos/cupon.model';
import { AlbumesJugadorService } from '@servicios/albumes-jugador.service';

/**
 * Vista "Álbumes" del jugador.
 *
 * A la izquierda, filtro por categoría de marca, buscador por nombre y listado
 * de álbumes; a la derecha, el álbum seleccionado con su progreso y su grilla.
 * Al entrar (o al cambiar de categoría/búsqueda) se selecciona el primer álbum
 * visible. En mobile se navega en dos pantallas (listado → detalle).
 *
 * Los álbumes se cargan una sola vez desde `AlbumesJugadorService`; el filtro
 * por categoría se deriva de ese listado y el filtrado/búsqueda es en cliente.
 */
@Component({
  selector: 'app-albumes',
  imports: [NgIcon, RouterLink, Header, FiltrosCategoriaAlbum, EncabezadoAlbum, GrillaAlbum, Tooltip],
  templateUrl: './albumes.html',
  styleUrl: './albumes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Albumes implements OnInit {
  private readonly servicio = inject(AlbumesJugadorService);

  protected readonly categoriaActiva = signal<number | null>(null);

  protected readonly albumes = signal<readonly ResumenAlbum[]>([]);
  protected readonly busqueda = signal('');
  protected readonly cargandoAlbumes = signal(true);
  protected readonly errorAlbumes = signal<string | null>(null);

  /**
   * Categorías del filtro, derivadas de los álbumes cargados: solo aparecen las
   * que tienen al menos un álbum. `categoriaCartaDesdeNombre` traduce el nombre
   * del backend a la categoría de carta y descarta las desconocidas.
   */
  protected readonly categorias = computed<readonly CategoriaAlbum[]>(() => {
    const porId = new Map<number, CategoriaAlbum>();

    for (const album of this.albumes()) {
      if (album.categoriaId === null || porId.has(album.categoriaId)) {
        continue;
      }
      porId.set(album.categoriaId, {
        id: album.categoriaId,
        nombre: album.categoriaNombre ?? 'Sin categoría',
        categoria: categoriaCartaDesdeNombre(album.categoriaNombre),
      });
    }

    return [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  protected readonly albumSeleccionado = signal<ResumenAlbum | null>(null);
  protected readonly detalle = signal<DetalleAlbum | null>(null);
  protected readonly cargandoDetalle = signal(false);
  protected readonly errorDetalle = signal<string | null>(null);

  protected readonly favoritas = signal<ReadonlySet<string>>(new Set<string>());

  /** Id de la carta cuyo guardado está en vuelo; evita el doble toque. */
  private readonly marcando = signal<string | null>(null);

  /** Logos de álbum que fallaron al cargar, para mostrar la inicial. */
  protected readonly logosFallidos = signal<ReadonlySet<number>>(new Set<number>());

  /** Álbumes visibles: los de la categoría activa filtrados por el buscador. */
  protected readonly albumesVisibles = computed(() => {
    const categoriaId = this.categoriaActiva();
    const termino = normalizarNombre(this.busqueda());

    return this.albumes().filter(
      (album) =>
        (categoriaId === null || album.categoriaId === categoriaId) &&
        (!termino || normalizarNombre(album.marcaNombre ?? '').includes(termino)),
    );
  });

  /** Categoría de cupón del álbum seleccionado, para el CTA "Canjear cupón". */
  protected readonly categoriaCuponSeleccionada = computed<CategoriaCupon | null>(() => {
    const album = this.albumSeleccionado();
    if (!album || album.categoriaId === null) {
      return null;
    }
    const categoria = this.categorias().find((c) => c.id === album.categoriaId)?.categoria;
    return categoria ? categoriaCuponDesdeCarta(categoria) : null;
  });

  ngOnInit(): void {
    this.cargarAlbumes();
  }

  protected cargarAlbumes(): void {
    this.cargandoAlbumes.set(true);
    this.errorAlbumes.set(null);

    this.servicio.listarAlbumes().subscribe({
      next: (albumes) => {
        const validos = (albumes ?? []).filter(
          (album) => Boolean(album?.marcaNombre?.trim()) && album.total > 0,
        );
        this.albumes.set(validos);
        this.cargandoAlbumes.set(false);
        this.asegurarSeleccion();
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
    this.asegurarSeleccion();
  }

  protected buscar(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    this.busqueda.set(valor);
    this.asegurarSeleccion();
  }

  protected seleccionarAlbum(resumen: ResumenAlbum): void {
    this.albumSeleccionado.set(resumen);
    this.cargarDetalle(resumen.id);
  }

  /**
   * Mantiene una selección coherente con lo visible: si no hay ningún álbum
   * visible, limpia el panel; si el seleccionado dejó de estarlo, elige el
   * primero visible.
   */
  private asegurarSeleccion(): void {
    const visibles = this.albumesVisibles();
    const actual = this.albumSeleccionado();

    if (visibles.length === 0) {
      this.volverALista();
      return;
    }

    if (!actual || !visibles.some((album) => album.id === actual.id)) {
      this.seleccionarAlbum(visibles[0]);
    }
  }

  private cargarDetalle(id: number): void {
    this.cargandoDetalle.set(true);
    this.errorDetalle.set(null);
    this.detalle.set(null);

    this.servicio.obtenerDetalleAlbum(id).subscribe({
      next: (detalle) => {
        const cartasValidas = (detalle.cartas ?? []).filter((carta) => !esCartaSinMarca(carta));
        this.detalle.set({
          ...detalle,
          cartas: cartasValidas,
        });
        this.favoritas.set(
          new Set(cartasValidas.filter((carta) => carta.favorita).map((carta) => carta.id)),
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
    this.cargarAlbumes();
  }

  protected volverALista(): void {
    this.albumSeleccionado.set(null);
    this.detalle.set(null);
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

  protected mostrarLogo(album: ResumenAlbum): boolean {
    return !!album.logoUrl && !this.logosFallidos().has(album.id);
  }

  protected inicialMarca(album: ResumenAlbum): string {
    return (album.marcaNombre?.trim().charAt(0) || '?').toUpperCase();
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
