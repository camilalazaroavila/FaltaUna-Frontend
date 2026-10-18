import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { RarezaCarta } from '@modelos/carta.model';
import { ETIQUETA_RAREZA } from '@modelos/carta.model';
import {
  ALBUMES_EMPRESA,
  CARTAS_EMPRESA,
  COLOR_RAREZA,
  EMPRESA_ACTUAL,
  ESTADISTICAS_CARTA,
  RAREZAS_ORDENADAS,
  TOTAL_USUARIOS_EMPRESA,
} from '@modelos/empresa.mock';
import { EVOLUCION_FAVORITOS, KPIS_EMPRESA } from './empresa-estadisticas.mock';

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

/**
 * Vista de estadísticas generales del panel de empresa: KPIs de participación,
 * favoritos por álbum, reparto por rareza, cartas más marcadas y evolución.
 *
 * Todos los datos son mock. Los agregados que dependen del catálogo (favoritos
 * por álbum, reparto por rareza y cartas más queridas) se derivan de
 * `modelos/empresa.mock.ts` para que la vista quede siempre coherente.
 */
@Component({
  selector: 'app-empresa-estadisticas',
  standalone: true,
  imports: [NgIcon],
  templateUrl: './empresa-estadisticas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaEstadisticas {
  protected readonly empresa = EMPRESA_ACTUAL;
  protected readonly totalUsuarios = TOTAL_USUARIOS_EMPRESA;
  protected readonly kpis = KPIS_EMPRESA;

  /** Álbum al que pertenece cada carta (toma el primero si está en varios). */
  private readonly albumPorCarta = new Map<string, string>(
    ALBUMES_EMPRESA.flatMap((album) => album.cartasIds.map((id) => [id, album.nombre] as const)),
  );

  /** Favoritos por álbum: suma las métricas de sus cartas y normaliza el ancho. */
  protected readonly favoritosPorAlbum = computed(() => {
    const filas = ALBUMES_EMPRESA.map((album) => ({
      id: album.id,
      etiqueta: album.nombre,
      cantidad: album.cartasIds.reduce(
        (total, id) => total + (ESTADISTICAS_CARTA[id]?.favoritos ?? 0),
        0,
      ),
    }));
    const maximo = Math.max(...filas.map((fila) => fila.cantidad), 1);
    return filas
      .map((fila) => ({ ...fila, porcentaje: Math.round((fila.cantidad / maximo) * 100) }))
      .sort((a, b) => b.cantidad - a.cantidad);
  });

  /** Reparto de los favoritos según la rareza de las cartas. */
  protected readonly distribucionRareza = computed<readonly TramoRareza[]>(() => {
    const favoritosPorRareza = new Map<RarezaCarta, number>();
    for (const carta of CARTAS_EMPRESA) {
      const favoritos = ESTADISTICAS_CARTA[carta.id]?.favoritos ?? 0;
      favoritosPorRareza.set(carta.rareza, (favoritosPorRareza.get(carta.rareza) ?? 0) + favoritos);
    }

    const total = [...favoritosPorRareza.values()].reduce((suma, valor) => suma + valor, 0) || 1;

    return RAREZAS_ORDENADAS.map((rareza) => {
      const cantidad = favoritosPorRareza.get(rareza) ?? 0;
      return {
        etiqueta: ETIQUETA_RAREZA[rareza],
        cantidad,
        porcentaje: Math.round((cantidad / total) * 100),
        color: COLOR_RAREZA[rareza],
      };
    });
  });

  /** Ranking de cartas por cantidad de favoritos (top 5). */
  protected readonly topCartas = computed<readonly CartaTopEmpresa[]>(() =>
    [...CARTAS_EMPRESA]
      .map((carta) => ({
        nombre: carta.nombre,
        album: this.albumPorCarta.get(carta.id) ?? EMPRESA_ACTUAL.nombre,
        favoritos: ESTADISTICAS_CARTA[carta.id]?.favoritos ?? 0,
      }))
      .sort((a, b) => b.favoritos - a.favoritos)
      .slice(0, 5),
  );

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
    this.distribucionRareza()
      .reduce((total, tramo) => total + tramo.cantidad, 0)
      .toLocaleString('es-AR'),
  );

  /** Mini evolución: normaliza cada valor a una altura porcentual. */
  protected readonly evolucion = computed(() => {
    const maximo = Math.max(...EVOLUCION_FAVORITOS.map((punto) => punto.valor));
    return EVOLUCION_FAVORITOS.map((punto) => ({
      etiqueta: punto.etiqueta,
      valor: punto.valor,
      altura: Math.round((punto.valor / maximo) * 100),
    }));
  });
}
