import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { RouterLink } from '@angular/router';
import { BarraRareza } from '@compartidos/componentes/cartas/barra-rareza/barra-rareza';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { TarjetaAlbum } from '@compartidos/componentes/cartas/tarjeta-album/tarjeta-album';
import { TarjetaKpi } from '@compartidos/componentes/empresa/tarjeta-kpi/tarjeta-kpi';
import { TarjetaRecompensa } from '@compartidos/componentes/usuario/tarjeta-recompensa/tarjeta-recompensa';
import type { Carta, RarezaCarta } from '@modelos/carta.model';
import { ETIQUETA_RAREZA } from '@modelos/carta.model';

import { AlbumesService } from '@servicios/albumes.service';
import { AlbumRespuesta } from '@modelos/album.model';
import {
  EMPRESA_ACTUAL,
  ESTADISTICAS_CARTA,
  ORDEN_RAREZA,
  RAREZAS_ORDENADAS,
  COLOR_RAREZA,
  SIN_ESTADISTICAS,
  TOTAL_USUARIOS_EMPRESA,
  type AlbumEmpresa,
  type EstadoAlbum,
  type EstadisticasCartaEmpresa,
  type ResumenAlbum,
} from '@modelos/empresa.mock';

export type CriterioOrdenAlbum = 'nombre-asc' | 'nombre-desc' | 'rareza';

interface AlbumConResumen extends AlbumEmpresa {
  readonly resumen: ResumenAlbum;
  /** Nombre real de la marca, tomado del backend (reemplaza a empresa.nombre del mock). */
  readonly marcaNombre: string;
}

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
export class EmpresaAlbumes implements OnInit {
  private readonly albumesService = inject(AlbumesService);

  /** Datos crudos traídos del backend */
  protected readonly coleccionesBackend = signal<AlbumRespuesta[]>([]);
  protected readonly cargando = signal(true);

  protected readonly empresa = EMPRESA_ACTUAL;
  protected readonly totalUsuarios = TOTAL_USUARIOS_EMPRESA;
  protected readonly etiquetaRareza = ETIQUETA_RAREZA;

  ngOnInit(): void {
    this.cargarColecciones();
  }

  private cargarColecciones(): void {
    this.cargando.set(true);
    this.albumesService.obtenerMisAlbumes().subscribe({
      next: (colecciones) => {
        this.coleccionesBackend.set(colecciones);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener álbumes del backend:', err);
        this.cargando.set(false);
      },
    });
  }

  /** Mapea la respuesta del backend a la estructura usada por la vista */
  protected readonly albumes = computed<AlbumConResumen[]>(() => {
    return this.coleccionesBackend().map((c) => {
      const imagenes = c.imagenesAlbum || [];
      const totalCartas = imagenes.length;

      const albumEmpresa: AlbumEmpresa = {
        id: String(c.id),
        nombre: c.nombre,
        temporada: new Date(c.fechaInicio).getFullYear().toString(),
        estado: c.activa ? 'activo' : 'finalizado',
        tono: 'azul',
        descripcion: c.descripcion,
        recompensa: 'Premio por completar la colección',
        imagenPortada: c.marcaLogoUrl,
        cartasIds: imagenes.map((img) => String(img.id)),
        jugadoresCompletaron: 0,
      };

      const reparto = RAREZAS_ORDENADAS.map((rareza) => {
        const cantidad = rareza === 'comun' ? totalCartas : 0;
        return {
          rareza,
          etiqueta: ETIQUETA_RAREZA[rareza],
          cantidad,
          porcentaje: totalCartas === 0 ? 0 : Math.round((cantidad / totalCartas) * 100),
          color: COLOR_RAREZA[rareza],
        };
      }).filter((tramo) => tramo.cantidad > 0);

      const resumen: ResumenAlbum = {
        totalCartas,
        reparto,
        favoritos: 0,
        intercambios: 0,
        porcentajeCompletado: 0,
      };

      return {
        ...albumEmpresa,
        marcaNombre: c.marcaNombre,
        resumen,
      };
    });
  });

  /** Nombre de la marca para el encabezado de la grilla de álbumes. */
  protected readonly nombreMarca = computed(() => this.albumes()[0]?.marcaNombre ?? '');

  protected readonly albumActivo = signal<string | null>(null);
  protected readonly busqueda = signal('');
  protected readonly rarezaActiva = signal<RarezaCarta | null>(null);
  protected readonly criterioOrden = signal<CriterioOrdenAlbum>('nombre-asc');
  protected readonly cartaSeleccionada = signal<Carta | null>(null);

  protected readonly albumActual = computed<AlbumConResumen | null>(() => {
    const id = this.albumActivo();
    return id === null ? null : (this.albumes().find((album) => album.id === id) ?? null);
  });

  /** Mapea dinámicamente las imágenes guardadas en el backend como cartas de Angular */
  protected readonly cartasDelAlbum = computed<readonly Carta[]>(() => {
    const album = this.albumActual();
    if (album === null) return [];

    const coleccionBackend = this.coleccionesBackend().find((c) => String(c.id) === album.id);
    if (!coleccionBackend) return [];

    return (coleccionBackend.imagenesAlbum || []).map((img, idx) => ({
      id: String(img.id),
      nombre: img.descripcion || `${coleccionBackend.nombre} #${idx + 1}`,
      imagenUrl: img.imagenUrl,
      rareza: 'comun',
      categoria: 'gastronomia',
      atributoIzquierdo: 10,
      atributoDerecho: 10,
      obtenida: true,
    }));
  });

  protected readonly kpisAlbum = computed(() => {
    const album = this.albumActual();
    if (album === null) return [];
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