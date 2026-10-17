import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CLASES_COLOR, type ColorTexto } from '@compartidos/componentes/textual/colores';

const CLASES_BASE =
  'block font-interfaz font-peso-etiqueta tracking-etiqueta uppercase text-etiqueta';

/**
 * Sobretítulo (overline) del sistema de contenido.
 *
 * Rótulo corto en mayúsculas, en la familia de interfaz, para encabezar bloques
 * o secciones por encima de un título (por ejemplo el "Bienvenido de nuevo" del
 * login). Es una directiva de atributo sobre `p` o `span`, así el nivel
 * semántico lo define la etiqueta. El color sale solo de tokens.
 *
 * Uso: `<p app-sobretitulo>…</p>`
 */
@Component({
  selector: 'p[app-sobretitulo], span[app-sobretitulo]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'clases()',
  },
})
export class Sobretitulo {
  readonly color = input<ColorTexto>('apagado');

  protected readonly clases = computed(() =>
    [CLASES_BASE, CLASES_COLOR[this.color()]].join(' ').trim(),
  );
}
