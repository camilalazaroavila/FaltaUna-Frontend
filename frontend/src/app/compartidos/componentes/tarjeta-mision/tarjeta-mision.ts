import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

import { BarraProgreso } from '../barra-progreso/barra-progreso';
import { SobreMarca } from '../sobre-marca/sobre-marca';
import { ETIQUETAS_CATEGORIA } from '../../../modelos/categoria.model';
import { ETIQUETAS_PERIODICIDAD, type Mision } from '../../../modelos/misiones.model';

/**
 * Fila de una misión: estado, título, barra de progreso y recompensa.
 *
 * Tres estados visuales bien diferenciados:
 * - `en_curso`: indicador neutro (contorno crema), sobre no clickeable.
 * - `completada`: indicador de atención (amarillo) + sobre clickeable, que
 *   habilita el efecto holográfico de `app-sobre-marca` y el reclamo.
 * - `reclamada`: círculo verde con check, sobre no clickeable.
 *
 * El sobre usa el modo `clickeable` de `app-sobre-marca` (con su hover y
 * holográfico) en lugar de envolverlo en un botón propio.
 */
@Component({
  selector: 'app-tarjeta-mision',
  imports: [NgIcon, BarraProgreso, SobreMarca],
  templateUrl: './tarjeta-mision.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class TarjetaMision {
  readonly mision = input.required<Mision>();

  readonly reclamar = output<number>();

  protected readonly etiquetaPeriodicidad = computed(
    () => ETIQUETAS_PERIODICIDAD[this.mision().periodicidad],
  );

  /** Las misiones diarias muestran "Se renueva cada 24 h" en vez de "Diaria". */
  protected readonly esDiaria = computed(() => this.mision().periodicidad === 'diaria');

  protected readonly disponible = computed(() => this.mision().disponible);

  protected readonly reclamada = computed(() => this.mision().estado === 'reclamada');

  /** Completada sin reclamar: la recompensa está lista para reclamar. */
  protected readonly listaParaReclamar = computed(
    () => this.mision().disponible && this.mision().estado === 'completada',
  );

  /** Ni reclamada ni lista: sigue en curso (o aún no disponible). */
  protected readonly enCurso = computed(() => !this.reclamada() && !this.listaParaReclamar());

  protected readonly textoEstado = computed(() => {
    if (this.reclamada()) return 'Recompensa reclamada';
    if (this.listaParaReclamar()) return 'Recompensa lista para reclamar';
    return 'Recompensa pendiente';
  });

  protected readonly recompensa = computed(() => this.mision().recompensa);

  /** Props sueltas para `app-sobre-marca`: la recompensa es un union discriminado. */
  protected readonly recompensaCategoria = computed(() => {
    const recompensa = this.mision().recompensa;
    return recompensa?.tipo === 'categoria' ? recompensa.categoria : null;
  });

  protected readonly recompensaNombre = computed(() => {
    const recompensa = this.mision().recompensa;
    return recompensa?.tipo === 'marca' ? recompensa.nombre : null;
  });

  protected readonly recompensaLogo = computed(() => {
    const recompensa = this.mision().recompensa;
    return recompensa?.tipo === 'marca' ? recompensa.logoUrl : null;
  });

  /** Texto humano de la recompensa, para el nombre accesible del botón. */
  protected readonly descripcionRecompensa = computed(() => {
    const recompensa = this.mision().recompensa;
    if (!recompensa) return 'una recompensa';
    switch (recompensa.tipo) {
      case 'categoria':
        return `un sobre de ${ETIQUETAS_CATEGORIA[recompensa.categoria]}`;
      case 'marca':
        return `un sobre de ${recompensa.nombre}`;
      default:
        return 'un sobre general';
    }
  });

  protected reclamarRecompensa(): void {
    if (!this.listaParaReclamar()) return;
    this.reclamar.emit(this.mision().id);
  }
}
