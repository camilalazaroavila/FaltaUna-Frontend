/**
 * Colores de texto compartidos por los componentes de `textual/`.
 *
 * Todas las clases salen de tokens semánticos (`--texto-*`, `--marca-primaria`),
 * así que cambian solos con `data-modo`. La opción `heredar` no aplica ninguna
 * clase: el componente toma el color de su contenedor (por ejemplo el
 * `text-{estado}-texto` de una caja de feedback o el color del body).
 */
export type ColorTexto = 'heredar' | 'primario' | 'secundario' | 'apagado' | 'marca';

export const CLASES_COLOR: Record<ColorTexto, string> = {
  heredar: '',
  primario: 'text-texto-primario',
  secundario: 'text-texto-secundario',
  apagado: 'text-texto-apagado',
  marca: 'text-marca-primaria',
};
