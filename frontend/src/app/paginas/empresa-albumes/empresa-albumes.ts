import { ChangeDetectionStrategy, Component, HostListener, computed, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { RouterLink } from '@angular/router';
import { BarraRareza } from '@compartidos/componentes/cartas/barra-rareza/barra-rareza';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { TarjetaAlbum } from '@compartidos/componentes/cartas/tarjeta-album/tarjeta-album';
import { TarjetaKpi } from '@compartidos/componentes/empresa/tarjeta-kpi/tarjeta-kpi';
import { TarjetaRecompensa } from '@compartidos/componentes/usuario/tarjeta-recompensa/tarjeta-recompensa';
import type { Carta, RarezaCarta } from '@modelos/carta.model';
import { ETIQUETA_RAREZA } from '@modelos/carta.model';
import {
  ALBUMES_EMPRESA,
  CARTAS_EMPRESA,
  EMPRESA_ACTUAL,
  ESTADISTICAS_CARTA,
  ORDEN_RAREZA,
  SIN_ESTADISTICAS,
  TOTAL_USUARIOS_EMPRESA,
  calcularResumenAlbum,
  type AlbumEmpresa,
  type EstadoAlbum,
  type EstadisticasCartaEmpresa,
  type ResumenAlbum,
} from '@modelos/empresa.mock';

export type CriterioOrdenAlbum = 'nombre-asc' | 'nombre-desc' | 'rareza';

/** Álbum con su resumen ya calculado, listo para pintar en la grilla. */
interface AlbumConResumen extends AlbumEmpresa {
  readonly resumen: ResumenAlbum;
}

/**
 * Vista de álbumes de empresa: primero una grilla con todos los álbumes (nombre,
 * descripción, recompensa y estadísticas agregadas) y, al elegir uno, el detalle
 * de la colección con sus cartas, filtros y el modal de estadísticas por carta.
 *
 * La empresa maneja una sola categoría y varios álbumes, así que el filtro
 * rápido es por rareza (no por categoría). Todo el contenido es mock
 * (`modelos/empresa.mock.ts`) y las tarjetas provienen de componentes
 * compartidos para poder mostrarlas también en la galería.
 */
@Component({
  selector: 'app-empresa-albumes',
  standalone: true,
  imports: [
    NgIcon,
    RouterLink,
    CartaComponent,
    TarjetaAlbum,
    TarjetaKpi,
    BarraRareza,
    TarjetaRecompensa,
  ],
  templateUrl: './empresa-albumes.html',
  styleUrl: './empresa-albumes.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumes {
  protected readonly empresa = EMPRESA_ACTUAL;
  protected readonly totalUsuarios = TOTAL_USUARIOS_EMPRESA;
  protected readonly etiquetaRareza = ETIQUETA_RAREZA;

  /** Álbumes con sus métricas agregadas (se calculan una sola vez). */
  protected readonly albumes: readonly AlbumConResumen[] = ALBUMES_EMPRESA.map((album) => ({
    ...album,
    resumen: calcularResumenAlbum(album),
  }));

  protected readonly albumActivo = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly rarezaActiva = signal<RarezaCarta | null>(null);
  protected readonly criterioOrden = signal<CriterioOrdenAlbum>('nombre-asc');
  protected readonly cartaSeleccionada = signal<Carta | null>(null);

  /** Álbum abierto en el detalle (`null` = se ve la grilla de álbumes). */
  protected readonly albumActual = computed<AlbumConResumen | null>(() => {
    const id = this.albumActivo();
    return id === null ? null : (this.albumes.find((album) => album.id === id) ?? null);
  });

  /** Cartas del álbum activo, siempre "obtenidas" (la empresa las posee todas). */
  protected readonly cartasDelAlbum = computed<readonly Carta[]>(() => {
    const album = this.albumActual();
    if (album === null) {
      return [];
    }
    return album.cartasIds
      .map((id) => CARTAS_EMPRESA.find((carta) => carta.id === id))
      .filter((carta): carta is Carta => carta !== undefined)
      .map((carta) => ({ ...carta, obtenida: true }));
  });

  /** Tarjetas de métricas del álbum abierto (cifras agregadas). */
  protected readonly kpisAlbum = computed(() => {
    const album = this.albumActual();
    if (album === null) {
      return [];
    }
    const resumen = album.resumen;
    return [
      {
        etiqueta: 'Cartas',
        valor: String(resumen.totalCartas),
        detalle: 'En toda la colección',
        icono: 'phosphorCardsFill',
      },
      {
        etiqueta: 'Completaron',
        valor: `${resumen.porcentajeCompletado}%`,
        detalle: `${album.jugadoresCompletaron} jugadores`,
        icono: 'phosphorTrophyFill',
      },
      {
        etiqueta: 'Favoritos',
        valor: resumen.favoritos.toLocaleString('es-AR'),
        detalle: 'Marcas de tus cartas',
        icono: 'phosphorHeartFill',
      },
      {
        etiqueta: 'Intercambios',
        valor: resumen.intercambios.toLocaleString('es-AR'),
        detalle: 'Entre jugadores',
        icono: 'phosphorArrowsLeftRightFill',
      },
    ];
  });

  /** Rarezas presentes en el álbum, para el filtro rápido. */
  protected readonly rarezasDelAlbum = computed(() => {
    const presentes = new Set(this.cartasDelAlbum().map((carta) => carta.rareza));
    return [...presentes]
      .sort((a, b) => ORDEN_RAREZA[a] - ORDEN_RAREZA[b])
      .map((rareza) => ({ rareza, etiqueta: ETIQUETA_RAREZA[rareza] }));
  });

  protected readonly cartasFiltradas = computed(() => {
    let cartas = this.cartasDelAlbum();

    const termino = this.busqueda().trim().toLowerCase();
    if (termino) {
      cartas = cartas.filter((carta) => carta.nombre.toLowerCase().includes(termino));
    }

    const rareza = this.rarezaActiva();
    if (rareza) {
      cartas = cartas.filter((carta) => carta.rareza === rareza);
    }

    const orden = this.criterioOrden();
    return [...cartas].sort((a, b) => {
      switch (orden) {
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre, 'es');
        case 'rareza':
          return ORDEN_RAREZA[a.rareza] - ORDEN_RAREZA[b.rareza];
        case 'nombre-asc':
        default:
          return a.nombre.localeCompare(b.nombre, 'es');
      }
    });
  });

  protected readonly sinResultados = computed(() => this.cartasFiltradas().length === 0);

  /** Estadísticas de la carta abierta en el modal (null si no hay ninguna). */
  protected readonly estadisticasSeleccionada = computed(() => {
    const carta = this.cartaSeleccionada();
    return carta ? this.estadisticasDe(carta.id) : null;
  });

  protected seleccionarAlbum(id: string): void {
    this.albumActivo.set(id);
    this.rarezaActiva.set(null);
    this.busqueda.set('');
    this.cartaSeleccionada.set(null);
  }

  protected volverAAlbumes(): void {
    this.albumActivo.set(null);
    this.cartaSeleccionada.set(null);
  }

  protected actualizarBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  protected toggleRareza(rareza: RarezaCarta): void {
    this.rarezaActiva.update((actual) => (actual === rareza ? null : rareza));
  }

  protected cambiarOrden(evento: Event): void {
    this.criterioOrden.set((evento.target as HTMLSelectElement).value as CriterioOrdenAlbum);
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.rarezaActiva.set(null);
    this.criterioOrden.set('nombre-asc');
  }

  protected abrirCarta(carta: Carta): void {
    this.cartaSeleccionada.set(carta);
  }

  protected cerrarCarta(): void {
    this.cartaSeleccionada.set(null);
  }

  protected etiquetaEstado(estado: EstadoAlbum): string {
    return estado === 'activo' ? 'Activo' : 'Finalizado';
  }

  protected estadisticasDe(id: string): EstadisticasCartaEmpresa {
    return ESTADISTICAS_CARTA[id] ?? SIN_ESTADISTICAS;
  }

  @HostListener('document:keydown.escape')
  protected alPresionarEscape(): void {
    if (this.cartaSeleccionada() !== null) {
      this.cerrarCarta();
      return;
    }
    this.volverAAlbumes();
  }
}
