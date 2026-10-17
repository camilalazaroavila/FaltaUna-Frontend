import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CLASES_COLOR, type ColorTexto } from '@compartidos/componentes/textual/colores';

/** Nivel visual del subtítulo. `md` es el tamaño base de subtítulo. */
export type TamanoSubtitulo = 'md' | 'sm';

const CLASES_BASE = 'block font-titulo font-peso-titular leading-titulo tracking-titulo break-words';

const CLASES_TAMANO: Record<TamanoSubtitulo, string> = {
  md: 'text-subtitulo',
  sm: 'text-menor',
};

/**
 * Subtítulo del sistema de contenido.
 *
 * Es la variante secundaria del título: misma familia display, pero con el
 * color de texto secundario por defecto. Es una directiva de atributo sobre la
 * etiqueta que elijas (`p` o `h1`…`h6`), así el nivel semántico lo define la
 * etiqueta y el nivel visual lo define `tamano`.
 *
 * Uso: `<p app-subtitulo>…</p>`
 */
@Component({
  selector:
    'p[app-subtitulo], span[app-subtitulo], h1[app-subtitulo], h2[app-subtitulo], h3[app-subtitulo], h4[app-subtitulo], h5[app-subtitulo], h6[app-subtitulo]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'clases()',
  },
})
export class Subtitulo {
  readonly tamano = input<TamanoSubtitulo>('md');
  readonly color = input<ColorTexto>('secundario');

  protected readonly clases = computed(() =>
    [CLASES_BASE, CLASES_TAMANO[this.tamano()], CLASES_COLOR[this.color()]].join(' ').trim(),
  );
}
