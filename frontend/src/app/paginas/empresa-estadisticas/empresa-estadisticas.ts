import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { EstadisticasEmpresaService } from '@app/servicios/estadisticas-empresa-service';
import { AlbumesService } from '@servicios/albumes.service';

/** Tarjeta de métrica general (una cifra destacada + contexto). */
interface KpiEmpresa {
  readonly id: string;
  readonly etiqueta: string;
  readonly valor: string;
  readonly detalle: string;
  readonly icono: string;
  readonly tendencia: string;
  readonly tendenciaPositiva: boolean;
}

interface MarcaOpcion {
  readonly id: number;
  readonly nombre: string;
}

/** Reparto de favoritos por rareza (tramo del donut). */
interface TramoRareza {
  readonly etiqueta: string;
  readonly cantidad: number;
  readonly porcentaje: number;
  readonly color: string;
}

/** Carta más marcada como favorita por los jugadores. */
interface CartaTopEmpresa {
  readonly nombre: string;
  readonly album: string;
  readonly favoritos: number;
}

/* -------------------------------------------------- */
export interface FavoritoPorAlbum {
  readonly coleccionId: number;
  readonly nombreAlbum: string;
  readonly cantidadFavoritos: number;
}

export interface FavoritoPorRareza {
  readonly rareza: string;
  readonly orden: number;
  readonly cantidad: number;
  readonly porcentaje: number;
}

export interface CartaMasQuerida {
  readonly posicion: number;
  readonly cartaId: number;
  readonly nombreCarta: string;
  readonly nombreAlbum: string;
  readonly cantidadFavoritos: number;
}

export interface EvolucionFavorito {
  readonly mes: string;
  readonly cantidadFavoritos: number;
}

export interface EstadisticasEmpresaRespuesta {
  readonly nombreMarca: string;
  readonly categoria: string;
  readonly totalJugadoresInteractuando: number;
  readonly jugadoresCompletaronAlbumes: number;
  readonly porcentajeJugadoresCompletaron: number;
  readonly variacionCompletaronPorcentaje: number;
  readonly cartasIntercambiadas: number;
  readonly variacionIntercambiosPorcentaje: number;
  readonly jugadoresConCartasFavoritas: number;
  readonly variacionJugadoresFavoritasPorcentaje: number;
  readonly partidasConTusCartas: number;
  readonly variacionPartidasPorcentaje: number;
  readonly totalFavoritos: number;
  readonly favoritosPorAlbum: readonly FavoritoPorAlbum[];
  readonly favoritosPorRareza: readonly FavoritoPorRareza[];
  readonly cartasMasQueridas: readonly CartaMasQuerida[];
  readonly evolucionFavoritos: readonly EvolucionFavorito[];
}

/**
 * Vista de estadísticas generales del panel de empresa: KPIs de participación,
 * favoritos por álbum, reparto por rareza, cartas más marcadas y evolución.
 */
@Component({
  selector: 'app-empresa-estadisticas',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './empresa-estadisticas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaEstadisticas implements OnInit {
  private readonly estadisticasService = inject(EstadisticasEmpresaService);
  private readonly albumesService = inject(AlbumesService);

  protected readonly datos = signal<EstadisticasEmpresaRespuesta | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly marcas = signal< readonly MarcaOpcion[]>([]);
  protected readonly marcaSeleccionadaId = signal<number | undefined>(undefined);

  ngOnInit(): void {
    this.cargarMarcas();
    this.cargarEstadisticas();
  }

  protected seleccionarMarca(marcaId?: number): void {
    if (this.marcaSeleccionadaId() === marcaId) return;
    this.marcaSeleccionadaId.set(marcaId);
    this.cargarEstadisticas(marcaId);
  }

  private cargarMarcas(): void {
    this.albumesService.obtenerMisAlbumes().subscribe({
      next: (colecciones) => {
        const mapa = new Map<number, string>();
        for (const c of colecciones) {
          if (c.marcaId && c.marcaNombre && !mapa.has(c.marcaId)) {
            mapa.set(c.marcaId, c.marcaNombre);
          }
        }
        this.marcas.set(Array.from(mapa, ([id, nombre]) => ({ id, nombre })));
      },
    });
  }

  private cargarEstadisticas(marcaId?: number): void {
    this.cargando.set(true);
    this.estadisticasService.obtenerEstadisticas(marcaId).subscribe({
      next: (res) => {
        this.datos.set(res);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron obtener las estadísticas');
        this.cargando.set(false);
      },
    });
  }

  protected readonly nombreMarca = computed(() => this.datos()?.nombreMarca ?? '');
  protected readonly categoria = computed(() => this.datos()?.categoria ?? '');
  protected readonly totalUsuarios = computed(() =>
    (this.datos()?.totalJugadoresInteractuando ?? 0).toLocaleString('es-AR'),
  );

  private formatearTendencia(variacion: number): string {
    return `${variacion >= 0 ? '+' : ''}${variacion}%`;
  }

  protected readonly kpis = computed<readonly KpiEmpresa[]>(() => {
    const d = this.datos();
    if (!d) return [];

    return [
      {
        id: 'completaron',
        etiqueta: 'Completaron tus álbumes',
        valor: d.jugadoresCompletaronAlbumes.toLocaleString('es-AR'),
        detalle: `${d.porcentajeJugadoresCompletaron}% de los jugadores`,
        icono: 'phosphorTrophyFill',
        tendencia: this.formatearTendencia(d.variacionCompletaronPorcentaje),
        tendenciaPositiva: d.variacionCompletaronPorcentaje >= 0,
      },
      {
        id: 'intercambios',
        etiqueta: 'Cartas intercambiadas',
        valor: d.cartasIntercambiadas.toLocaleString('es-AR'),
        detalle: 'Entre tus álbumes',
        icono: 'phosphorArrowsLeftRightFill',
        tendencia: this.formatearTendencia(d.variacionIntercambiosPorcentaje),
        tendenciaPositiva: d.variacionIntercambiosPorcentaje >= 0,
      },
      {
        id: 'favoritas',
        etiqueta: 'Jugadores con favoritas',
        valor: d.jugadoresConCartasFavoritas.toLocaleString('es-AR'),
        detalle: 'Marcaron alguna carta',
        icono: 'phosphorHeartFill',
        tendencia: this.formatearTendencia(d.variacionJugadoresFavoritasPorcentaje),
        tendenciaPositiva: d.variacionJugadoresFavoritasPorcentaje >= 0,
      },
      {
        id: 'partidas',
        etiqueta: 'Partidas con tus cartas',
        valor: d.partidasConTusCartas.toLocaleString('es-AR'),
        detalle: 'Usaron una carta de tu marca',
        icono: 'phosphorPlayFill',
        tendencia: this.formatearTendencia(d.variacionPartidasPorcentaje),
        tendenciaPositiva: d.variacionPartidasPorcentaje >= 0,
      },
    ];
  });

  /** Favoritos por álbum: normaliza el ancho respecto al máximo. */
  protected readonly favoritosPorAlbum = computed(() => {
    const lista = this.datos()?.favoritosPorAlbum ?? [];
    const maximo = Math.max(...lista.map((f) => f.cantidadFavoritos), 1);
    return lista.map((f) => ({
      id: f.coleccionId,
      etiqueta: f.nombreAlbum,
      cantidad: f.cantidadFavoritos,
      porcentaje: Math.round((f.cantidadFavoritos / maximo) * 100),
    }));
  });

  /** Reparto de los favoritos según la rareza de las cartas. */
  protected readonly distribucionRareza = computed<readonly TramoRareza[]>(() => {
    const colores = ['var(--rareza-1)', 'var(--rareza-2)', 'var(--rareza-3)', 'var(--rareza-4)'];
    const lista = this.datos()?.favoritosPorRareza ?? [];
    return lista.map((item, idx) => ({
      etiqueta: item.rareza,
      cantidad: item.cantidad,
      porcentaje: Math.round(item.porcentaje),
      color: colores[idx] ?? 'var(--rareza-1)',
    }));
  });

  /** Ranking de cartas por cantidad de favoritos (top 5). */
  protected readonly topCartas = computed<readonly CartaTopEmpresa[]>(() => {
    const lista = this.datos()?.cartasMasQueridas ?? [];
    return lista.map((c) => ({
      nombre: c.nombreCarta,
      album: c.nombreAlbum,
      favoritos: c.cantidadFavoritos,
    }));
  });

  /** Fondo del donut: conecta los tramos de rareza de a uno respetando su peso. */
  protected readonly donutFondo = computed(() => {
    let acumulado = 0;
    const tramos = this.distribucionRareza().map((tramo) => {
      const inicio = acumulado;
      acumulado += tramo.porcentaje;
      return `${tramo.color} ${inicio}% ${acumulado}%`;
    });
    return `conic-gradient(${tramos.join(', ')})`;
  });

  /** Total de favoritos repartidos por rareza (cifra central del donut). */
  protected readonly totalFavoritosRareza = computed(() =>
    (this.datos()?.totalFavoritos ?? 0).toLocaleString('es-AR'),
  );

  /** Mini evolución: normaliza cada valor a una altura porcentual. */
  protected readonly evolucion = computed(() => {
    const lista = this.datos()?.evolucionFavoritos ?? [];
    const maximo = Math.max(...lista.map((p) => p.cantidadFavoritos), 1);
    return lista.map((p) => ({
      etiqueta: p.mes,
      valor: p.cantidadFavoritos,
      altura: Math.round((p.cantidadFavoritos / maximo) * 100),
    }));
  });
}

