import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Variante de color del cuerpo de texto. `normal` usa el texto primario. */
export type VarianteTexto = 'normal' | 'secundario' | 'apagado' | 'heredar';

/** Tamaño acotado a la escala semántica de lectura. */
export type TamanoTexto = 'cuerpo' | 'menor';

const CLASES_BASE = 'font-cuerpo font-peso-lectura leading-cuerpo break-words';

const CLASES_TAMANO: Record<TamanoTexto, string> = {
  cuerpo: 'text-cuerpo',
  menor: 'text-menor',
};

const CLASES_VARIANTE: Record<VarianteTexto, string> = {
  normal: 'text-texto-primario',
  secundario: 'text-texto-secundario',
  apagado: 'text-texto-apagado',
  heredar: '',
};

/**
 * Texto de cuerpo del sistema de contenido.
 *
 * Es una directiva de atributo sobre `p` o `span`, así el nivel semántico lo
 * define la etiqueta. Usa la familia de lectura y la escala semántica de
 * tamaños. Las variantes de color salen solo de tokens (`texto-primario`,
 * `texto-secundario`, `texto-apagado`); `heredar` no aplica color para convivir
 * con contenedores que ya definen el suyo (por ejemplo una caja de feedback).
 *
 * Uso: `<p app-texto>…</p>`
 */
@Component({
  selector: 'p[app-texto], span[app-texto]',
  template: '<ng-content />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'clases()',
  },
})
export class Texto {
  readonly variante = input<VarianteTexto>('normal');
  readonly tamano = input<TamanoTexto>('cuerpo');

  protected readonly clases = computed(() =>
    [CLASES_BASE, CLASES_TAMANO[this.tamano()], CLASES_VARIANTE[this.variante()]]
      .join(' ')
      .trim(),
  );
}
