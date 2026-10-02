import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Contenedor de una muestra dentro de la galeria.
 *
 * Recibe el nombre del selector como titulo y proyecta el contenido de la
 * muestra. El slot `[slot='nota']` queda reservado para las aclaraciones de lo
 * que se esta revisando.
 */
@Component({
  selector: 'app-tarjeta-muestra',
  templateUrl: './tarjeta-muestra.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaMuestra {
  readonly titulo = input.required<string>();
  readonly descripcion = input<string>();
}