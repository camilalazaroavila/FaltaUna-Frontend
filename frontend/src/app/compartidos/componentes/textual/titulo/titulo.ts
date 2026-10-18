import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CLASES_COLOR, type ColorTexto } from '@compartidos/componentes/textual/colores';

/** Nivel visual del título. `display` es el más grande; los demás van bajando. */
export type TamanoTitulo = 'display' | 'lg' | 'md' | 'sm';

const CLASES_BASE = 'block font-titulo font-peso-titular leading-titulo tracking-titulo break-words';

const CLASES_TAMANO: Record<TamanoTitulo, string> = {
  display: 'text-display',
  lg: 'text-titulo',
  md: 'text-subtitulo',
  sm: 'text-cuerpo',
};

/**
 * Título del sistema de contenido.
 *
 * Es una directiva de atributo sobre encabezados nativos (`h1`…`h6`), así el
 * nivel semántico se elige con la etiqueta y el nivel visual con `tamano`, de
 * forma independiente. Cada página debe tener un único `h1`: usá `h2` en
 * adelante para el resto de los bloques.
 *
 * Uso: `<h2 app-titulo tamano="lg">…</h2>`
 */
@Component({
  selector: 'h1[app-titulo], h2[app-titulo], h3[app-titulo], h4[app-titulo], h5[app-titulo], h6[app-titulo]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'clases()',
  },
})
export class Titulo {
  readonly tamano = input<TamanoTitulo>('md');
  readonly color = input<ColorTexto>('heredar');

  protected readonly clases = computed(() =>
    [CLASES_BASE, CLASES_TAMANO[this.tamano()], CLASES_COLOR[this.color()]].join(' ').trim(),
  );
}
