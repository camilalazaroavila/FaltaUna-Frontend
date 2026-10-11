import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { BarraProgreso } from '../barra-progreso/barra-progreso';
import { SobreMarca } from '../sobre-marca/sobre-marca';
import { ETIQUETAS_CATEGORIA } from '../../../modelos/categoria.model';
import { faltantesPity, type ProgresoPity } from '../../../modelos/misiones.model';

/**
 * Fila del PT System: sobres abiertos de un tipo desde la última legendaria.
 * El sobre de la derecha es informativo (nunca clickeable): solo comunica de
 * qué tipo es la recompensa que está en camino.
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

  protected readonly etiquetaSobre = computed(() => {
    const sobre = this.progreso().sobre;
    switch (sobre.tipo) {
      case 'categoria':
        return `Sobres de ${ETIQUETAS_CATEGORIA[sobre.categoria]}`;
      case 'marca':
        return `Sobres de ${sobre.nombre}`;
      default:
        return 'Sobres generales';
    }
  });

  protected readonly textoFaltantes = computed(() => {
    const faltantes = this.faltantes();
    return faltantes === 1
      ? 'Falta 1 sobre para la legendaria'
      : `Faltan ${faltantes} sobres para la legendaria`;
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
