import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { porcentaje } from '../../../modelos/misiones.model';

/** `mision` = verde, `pity` = amarillo (progreso hacia la legendaria). */
export type VarianteBarra = 'mision' | 'pity';

const CLASES_RELLENO: Record<VarianteBarra, string> = {
  mision: 'bg-barra-mision-relleno',
  pity: 'bg-barra-pity-relleno',
};

/**
 * Barra de progreso en pastilla, estilo cartoon: borde grueso, sombra sólida
 * y el porcentaje escrito sobre la pastilla. El color por variante viene de
 * tokens semánticos (`--barra-*`), nunca de hex.
 */
@Component({
  selector: 'app-barra-progreso',
  templateUrl: './barra-progreso.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class BarraProgreso {
  readonly actual = input.required<number>();
  readonly objetivo = input.required<number>();
  readonly variante = input<VarianteBarra>('mision');
  /** Nombre accesible de lo que se está midiendo (p. ej. el título de la misión). */
  readonly etiqueta = input.required<string>();
  /** Texto dentro de la pastilla; por defecto "N% completado". */
  readonly texto = input<string | null>(null);

  protected readonly porcentaje = computed(() => porcentaje(this.actual(), this.objetivo()));
  protected readonly leyenda = computed(() => this.texto() ?? `${this.porcentaje()}% completado`);
  protected readonly valorAccesible = computed(
    () => `${this.actual()} de ${this.objetivo()}, ${this.porcentaje()}%`,
  );
  protected readonly clasesRelleno = computed(() => CLASES_RELLENO[this.variante()]);
}