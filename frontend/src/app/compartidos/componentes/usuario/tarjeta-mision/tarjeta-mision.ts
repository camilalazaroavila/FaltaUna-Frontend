import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { BarraProgreso } from '@compartidos/componentes/feedback/barra-progreso/barra-progreso';
import { SobreMarca } from '@compartidos/componentes/cartas/sobre-marca/sobre-marca';
import { ETIQUETAS_CATEGORIA } from '@modelos/categoria.model';
import type { Mision } from '@modelos/misiones.model';

/**
 * Tarjeta compacta de una misión: estado, título, barra de progreso y recompensa.
 *
 * Cuatro estados visuales, cada uno con un indicador que se entiende sin
 * depender solo del color (ícono + texto visible):
 * - `en_curso`: contorno neutro con reloj (estático, nunca animado).
 * - `completada`: energía naranja con ícono de regalo, etiqueta
 *   "Lista para reclamar", botón "Reclamar" y sobre clickeable con halo animado
 *   que respeta `prefers-reduced-motion` y `data-movimiento="reducido"`.
 * - `reclamada`: atenuada, ícono de check y etiqueta "Reclamada".
 * - no disponible (`disponible: false`): candado y tarjeta atenuada.
 */
@Component({
  selector: 'app-tarjeta-mision',
  imports: [NgIcon, BarraProgreso, SobreMarca, Boton],
  templateUrl: './tarjeta-mision.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class TarjetaMision {
  readonly mision = input.required<Mision>();

  readonly reclamar = output<number>();

  protected readonly disponible = computed(() => this.mision().disponible);

  protected readonly reclamada = computed(() => this.mision().estado === 'reclamada');

  /** Completada sin reclamar: la recompensa está lista para reclamar. */
  protected readonly listaParaReclamar = computed(
    () => this.mision().disponible && this.mision().estado === 'completada',
  );

  /** Ni reclamada ni lista: sigue en curso (o aún no disponible). */
  protected readonly enCurso = computed(() => !this.reclamada() && !this.listaParaReclamar());

  /** Texto visible que acompaña al título, según el estado. */
  protected readonly textoEstado = computed(() => {
    if (!this.disponible()) return 'Próximamente';
    if (this.reclamada()) return 'Reclamada';
    if (this.listaParaReclamar()) return 'Lista para reclamar';
    return 'En curso';
  });

  /** Texto compacto de progreso numérico (`actual/objetivo`). */
  protected readonly progresoTexto = computed(
    () => `${this.mision().actual}/${this.mision().objetivo}`,
  );

  /** Descripción accesible del indicador circular (nunca depende solo del color). */
  protected readonly textoIndicador = computed(() => {
    if (!this.disponible()) return 'Misión no disponible todavía';
    if (this.reclamada()) return 'Recompensa reclamada';
    if (this.listaParaReclamar()) return 'Recompensa lista para reclamar';
    return 'Misión en curso';
  });

  /** Ícono del indicador de estado: se entiende sin leer el color. */
  protected readonly iconoEstado = computed(() => {
    if (!this.disponible()) return 'phosphorLockFill';
    if (this.reclamada()) return 'phosphorCheckCircleFill';
    if (this.listaParaReclamar()) return 'phosphorGiftFill';
    return 'phosphorClockFill';
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
