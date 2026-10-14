import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { BarraProgreso } from '../barra-progreso/barra-progreso';
import { SobreMarca } from '../sobre-marca/sobre-marca';
import { ETIQUETAS_CATEGORIA } from '../../../modelos/categoria.model';
import { faltantesPity, UMBRAL_CASI_PITY, type ProgresoPity } from '../../../modelos/misiones.model';

/**
 * Fila del PT System: sobres abiertos de un tipo desde la última legendaria.
 * El sobre de la derecha es informativo (nunca clickeable): solo comunica de
 * qué tipo es la recompensa que está en camino.
 *
 * La jerarquía pone primero el dato que importa (cuántos sobres faltan) y deja
 * el nombre del sobre como dato secundario. Cuando la fila está cerca de la
 * legendaria (faltantes <= UMBRAL_CASI_PITY) se destaca con el acento amarillo.
 */
@Component({
  selector: 'app-tarjeta-pity',
  imports: [BarraProgreso, SobreMarca],
  templateUrl: './tarjeta-pity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class TarjetaPity {
  readonly progreso = input.required<ProgresoPity>();

  protected readonly faltantes = computed(() => faltantesPity(this.progreso()));

  /**
   * Rótulo visible del tipo de sobre. No repite la palabra "sobres" del título:
   * el sobre de la derecha ya comunica que se trata de un sobre.
   */
  protected readonly nombreSobre = computed(() => {
    const sobre = this.progreso().sobre;
    switch (sobre.tipo) {
      case 'categoria':
        return ETIQUETAS_CATEGORIA[sobre.categoria];
      case 'marca':
        return sobre.nombre;
      default:
        return 'Generales';
    }
  });

  /** Nombre accesible completo del sobre, para la barra de progreso. */
  protected readonly etiquetaSobre = computed(() => {
    const sobre = this.progreso().sobre;
    switch (sobre.tipo) {
      case 'categoria':
        return `Sobre de ${ETIQUETAS_CATEGORIA[sobre.categoria]}`;
      case 'marca':
        return `Sobre de ${sobre.nombre}`;
      default:
        return 'Sobre general';
    }
  });

  /** Tipo de la legendaria, solo para el título de la fila ya completada. */
  private readonly tipoLegendaria = computed<string | null>(() => {
    const sobre = this.progreso().sobre;
    if (sobre.tipo === 'categoria') return ETIQUETAS_CATEGORIA[sobre.categoria];
    if (sobre.tipo === 'marca') return sobre.nombre;
    return null;
  });

  protected readonly textoFaltantes = computed(() => {
    const faltantes = this.faltantes();
    if (faltantes === 0) {
      const tipo = this.tipoLegendaria();
      return tipo ? `¡Legendaria de ${tipo} asegurada!` : '¡Legendaria asegurada!';
    }
    return faltantes === 1
      ? 'Falta 1 sobre para la legendaria'
      : `Faltan ${faltantes} sobres para la legendaria`;
  });

  /** Fila cercana a la legendaria: se destaca con acento (faltantes 1..umbral). */
  protected readonly casi = computed(() => {
    const faltantes = this.faltantes();
    return faltantes > 0 && faltantes <= UMBRAL_CASI_PITY;
  });

  protected readonly textoBarra = computed(
    () => `${this.progreso().abiertos} / ${this.progreso().umbral}`,
  );

  protected readonly categoria = computed(() => {
    const sobre = this.progreso().sobre;
    return sobre.tipo === 'categoria' ? sobre.categoria : null;
  });

  protected readonly nombre = computed(() => {
    const sobre = this.progreso().sobre;
    return sobre.tipo === 'marca' ? sobre.nombre : null;
  });

  protected readonly logoUrl = computed(() => {
    const sobre = this.progreso().sobre;
    return sobre.tipo === 'marca' ? sobre.logoUrl : null;
  });
}
