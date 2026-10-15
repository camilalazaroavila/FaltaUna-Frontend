import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/** Ubicación del globo respecto del disparador. */
export type PosicionTooltip =
  | 'abajo-derecha'
  | 'abajo-izquierda'
  | 'arriba-derecha'
  | 'arriba-izquierda';

let contador = 0;

/**
 * Tooltip reutilizable con globo y flecha.
 *
 * Dos formas de uso:
 * - `icono` en `true`: renderiza un disparador circular con ícono "i" y
 *   `aria-describedby`, pensado para piezas informativas.
 * - `icono` en `false` (por defecto): envuelve el contenido proyectado y muestra
 *   el globo sobre un elemento propio (conviene envolver contenido no
 *   interactivo, ya que agrega un `tabindex` para el foco de teclado).
 *
 * El globo se abre con hover o foco, y sólo usa los tokens `--tip-*`.
 */
@Component({
  selector: 'app-tooltip',
  imports: [NgIcon],
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tooltip {
  readonly texto = input.required<string>();
  /** Ubicación del globo; por defecto debajo y creciendo hacia la derecha. */
  readonly posicion = input<PosicionTooltip>('abajo-derecha');
  /** `true` renderiza el disparador con ícono "i"; `false` proyecta contenido. */
  readonly icono = input(false);
  /** `aria-label` del disparador cuando `icono` es `true`. */
  readonly etiqueta = input('Más información');

  protected readonly idGlobo = `tooltip-globo-${++contador}`;

  protected readonly abajo = computed(() => this.posicion().startsWith('abajo'));
  protected readonly haciaDerecha = computed(() => this.posicion().endsWith('derecha'));
}
