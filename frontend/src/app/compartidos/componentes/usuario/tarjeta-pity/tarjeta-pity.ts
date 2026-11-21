import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { BarraProgreso } from '@compartidos/componentes/feedback/barra-progreso/barra-progreso';
import { SobreMarca } from '@compartidos/componentes/cartas/sobre-marca/sobre-marca';
import { estaCercaPity, type ProgresoPity } from '@modelos/misiones.model';

/**
 * Tarjeta del PT System: progreso hacia la carta legendaria garantizada.
 *
 * Tres estados:
 * - En progreso: "Faltan N sobres para la garantía"
 * - Cerca (>= 75%): badge "¡Casi!" y borde destacado
 * - Garantizada: halo legendario, sobre holográfico, botón para abrir sobre.
 *
 * Disposición responsive:
 * - Desktop (>= 1024px): tarjeta vertical con sobre grande arriba, título, barra y botón.
 * - Mobile (< 1024px): tarjeta compacta con fila superior y barra/botón abajo.
 */
@Component({
  selector: 'app-tarjeta-pity',
  imports: [BarraProgreso, SobreMarca, Boton],
  templateUrl: './tarjeta-pity.html',
  styleUrl: './tarjeta-pity.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
})
export class TarjetaPity {
  private readonly router = inject(Router);

  readonly progreso = input.required<ProgresoPity>();

  protected readonly garantizada = computed(() => this.progreso().garantizada);

  protected readonly cerca = computed(() => estaCercaPity(this.progreso()));

  protected readonly progresoRatio = computed(() => {
    const p = this.progreso();
    if (!p || p.umbral <= 0) return 0;
    return Math.min(1, Math.max(0, p.contador / p.umbral));
  });

  /** Rótulo visible: "General", "Categoría", "Marca". */
  protected readonly nombreTipo = computed(() => {
    switch (this.progreso().tipo) {
      case 'GENERAL':
        return 'General';
      case 'CATEGORIA':
        return 'Categoría';
      case 'MARCA':
        return 'Marca';
      default:
        return 'General';
    }
  });

  protected readonly etiquetaSobre = computed(() => `Sobre de ${this.nombreTipo()}`);

  protected readonly textoFaltantes = computed(() => {
    if (this.garantizada() || this.progreso().sobresRestantes <= 0) {
      return '¡Tu próximo sobre trae una legendaria!';
    }
    const faltantes = this.progreso().sobresRestantes;
    return faltantes === 1
      ? 'Falta 1 sobre para la legendaria asegurada'
      : `Faltan ${faltantes} sobres para la legendaria asegurada`;
  });

  protected readonly textoBarra = computed(
    () => `${this.progreso().contador} / ${this.progreso().umbral}`,
  );

  /**
   * Texto del botón de apertura según el tipo de sobre.
   * Borrador sujeto a aprobación final del equipo (misma capitalización en los 3).
   */
  protected readonly textoBotonAbrir = computed(() => {
    switch (this.progreso().tipo) {
      case 'GENERAL':
        return 'Abrir sobre general';
      case 'CATEGORIA':
        return 'Abrir sobre de categoría';
      case 'MARCA':
        return 'Abrir sobre de marca';
      default:
        return 'Abrir sobre';
    }
  });

  /**
   * PUNTO ÚNICO DE HABILITACIÓN DEL BOTÓN DE APERTURA:
   * Por definición de la tarea (Fase A, punto 2), el botón permanece apagado (deshabilitado)
   * en las 3 tarjetas y en TODOS los estados.
   *
   * REGLA FUTURA A APROBAR (Open Decisions):
   * Cuando el equipo defina la activación (por ejemplo, habilitar solo cuando `this.garantizada()`
   * sea true y redirigir a `/usuario/sobres`), cambiar el retorno a:
   * `return this.garantizada();`
   */
  protected readonly botonAbrirHabilitado = computed(() => {
    return false;
  });

  /**
   * Descripción asociada para lectores de pantalla mientras el botón permanece apagado.
   * Borrador neutral a la espera de la definición de la regla de activación del equipo:
   * no condiciona a la garantía, ya que en la tarjeta garantizada también permanece apagado.
   */
  protected readonly descripcionBotonDeshabilitado = computed(() => {
    return `Apertura directa del sobre ${this.nombreTipo().toLowerCase()} no disponible por el momento en esta vista.`;
  });

  protected irASobres(): void {
    if (this.botonAbrirHabilitado()) {
      this.router.navigate(['/usuario/sobres']);
    }
  }
}
