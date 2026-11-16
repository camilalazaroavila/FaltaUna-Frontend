import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

import { BarraProgreso } from '@compartidos/componentes/feedback/barra-progreso/barra-progreso';
import { SobreMarca } from '@compartidos/componentes/cartas/sobre-marca/sobre-marca';
import { ETIQUETAS_CATEGORIA } from '@modelos/categoria.model';
import type { Mision } from '@modelos/misiones.model';

/**
 * Tarjeta compacta de una misión: título, estado con ícono, barra `sm` y recompensa opcional.
 *
 * - En modo Diaria (`mostrarRecompensa = false`): sin sobre ni botón, no clickeable;
 *   solo estados `En curso` y `Completada` (atenuada con tilde).
 * - En modo Semanal / Permanente (`mostrarRecompensa = true`): sobre a la derecha y
 *   cuatro estados (`En curso`, `Lista para reclamar` con token `--energia`, `Reclamada`
 *   y `Próximamente`).
 */
@Component({
  selector: 'app-tarjeta-mision',
  imports: [NgIcon, BarraProgreso, SobreMarca],
  templateUrl: './tarjeta-mision.html',
  styleUrl: './tarjeta-mision.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class TarjetaMision {
  readonly mision = input.required<Mision>();
  readonly mostrarRecompensa = input<boolean>(true);

  readonly reclamar = output<number>();

  protected readonly disponible = computed(() => this.mision().disponible);

  /** En Diaria, tanto `completada` como `reclamada` se muestran como `Completada` (atenuada, sin cobro). */
  protected readonly completadaDiaria = computed(
    () =>
      !this.mostrarRecompensa() &&
      this.disponible() &&
      (this.mision().estado === 'completada' || this.mision().estado === 'reclamada'),
  );

  protected readonly reclamada = computed(
    () => this.mostrarRecompensa() && this.disponible() && this.mision().estado === 'reclamada',
  );

  /** Completada sin reclamar en modos con recompensa individual. */
  protected readonly listaParaReclamar = computed(
    () => this.mostrarRecompensa() && this.disponible() && this.mision().estado === 'completada',
  );

  protected readonly enCurso = computed(
    () =>
      this.disponible() &&
      !this.completadaDiaria() &&
      !this.reclamada() &&
      !this.listaParaReclamar(),
  );

  protected readonly atenuada = computed(
    () => !this.disponible() || this.reclamada() || this.completadaDiaria(),
  );

  /** Ícono único de estado para no duplicar lógica en el template. */
  protected readonly iconoEstado = computed(() => {
    if (!this.disponible()) return 'phosphorLockFill';
    if (this.reclamada() || this.completadaDiaria()) return 'phosphorCheckCircleFill';
    if (this.listaParaReclamar()) return 'heroCheckSolid';
    return 'phosphorClock';
  });

  /** Texto visible que acompaña al título según modo y estado. */
  protected readonly textoEstado = computed(() => {
    if (!this.disponible()) return 'Próximamente';
    if (this.completadaDiaria()) return 'Completada';
    if (this.reclamada()) return 'Reclamada';
    if (this.listaParaReclamar()) return 'Lista para reclamar';
    return 'En curso';
  });

  /** Texto compacto de progreso numérico (`actual/objetivo`). */
  protected readonly progresoTexto = computed(
    () => `${this.mision().actual}/${this.mision().objetivo}`,
  );

  protected readonly recompensa = computed(() => this.mision().recompensa);

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
