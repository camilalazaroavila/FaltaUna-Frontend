import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BarraRareza } from '@compartidos/componentes/cartas/barra-rareza/barra-rareza';
import { HeaderEmpresa } from '@compartidos/componentes/layout/header-empresa/header-empresa';
import { TarjetaAlbum } from '@compartidos/componentes/cartas/tarjeta-album/tarjeta-album';
import { TarjetaKpi } from '@compartidos/componentes/empresa/tarjeta-kpi/tarjeta-kpi';

import { TarjetaRecompensa } from '@compartidos/componentes/usuario/tarjeta-recompensa/tarjeta-recompensa';
import {
  ALBUMES_EMPRESA,
  calcularResumenAlbum,
  type AlbumEmpresa,
  type ResumenAlbum,
  type TonoAlbum,
} from '@modelos/empresa.mock';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';

/** Álbum de muestra con su resumen ya calculado, listo para la tarjeta. */
interface AlbumMuestra {
  readonly album: AlbumEmpresa;
  readonly resumen: ResumenAlbum;
}

/** Tarjeta KPI de muestra, cubriendo los estados y la variación del contrato. */
interface KpiMuestra {
  readonly etiqueta: string;
  readonly valor: string;
  readonly contexto?: string;
}

/**
 * Sección de galería del área de empresa: expone los componentes compartidos del
 * panel de marcas (header, tarjeta de álbum, KPI, medidor de rareza y cupón de
 * recompensa) con datos reales del mock. Pensada para revisarse en modo empresa.
 */
@Component({
  selector: 'app-seccion-area-empresa',
  imports: [
    HeaderEmpresa,
    TarjetaAlbum,
    TarjetaKpi,
    BarraRareza,
    TarjetaRecompensa,
    TarjetaMuestra,
  ],
  templateUrl: './seccion-area-empresa.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionAreaEmpresa {
  /** Dos álbumes reales del mock, para mostrar la tarjeta con datos de verdad. */
  protected readonly muestras: readonly AlbumMuestra[] = ALBUMES_EMPRESA.slice(0, 2).map(
    (album) => ({ album, resumen: calcularResumenAlbum(album) }),
  );

  /** El primer álbum, atajo para las muestras que no necesitan variar. */
  private readonly primario = this.muestras[0];

  protected readonly tonos: readonly TonoAlbum[] = ['violeta', 'azul', 'acento'];

  /** Tarjetas KPI de muestra: valor con variación, cargando, sin datos y error. */
  protected readonly kpisMuestra: readonly KpiMuestra[] = [
    {
      etiqueta: 'Cartas',
      valor: String(this.primario.resumen.totalCartas),
      contexto: 'En toda la colección',
    },
    {
      etiqueta: 'Completaron',
      valor: `${this.primario.resumen.porcentajeCompletado}%`,
      contexto: 'Sube respecto al mes pasado',
    },
    {
      etiqueta: 'Favoritos',
      valor: this.primario.resumen.favoritos.toLocaleString('es-AR'),
      contexto: 'Baja respecto al mes pasado',
    },
    {
      etiqueta: 'Intercambios',
      valor: this.primario.resumen.intercambios.toLocaleString('es-AR'),
    },
    {
      etiqueta: 'Cupones canjeados',
      valor: '0',
    },
    {
      etiqueta: 'Jugadores activos',
      valor: '0',
      contexto: 'Servidor no disponible',
    },
  ];

  /** Último álbum elegido en las tarjetas de muestra (para leer el output). */
  protected readonly seleccionado = signal<string | null>(null);
}
