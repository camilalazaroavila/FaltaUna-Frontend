import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Nivel de superficie de la caja. Los estados de feedback reutilizan sus 5 tokens. */
export type VarianteCaja =
  | 'base'
  | 'elevada'
  | 'hundida'
  | 'destacada'
  | 'exito'
  | 'error'
  | 'advertencia'
  | 'atencion'
  | 'info';

/** Sombra de la caja, resuelta con los tokens `--sombra-*` (misma en ambos modos). */
export type SombraCaja = 'ninguna' | 'baja' | 'media' | 'alta';

/** Relleno interno, resuelto con la escala de espaciado de Tailwind. */
export type PaddingCaja = 'sm' | 'md' | 'lg';

/** Radio de borde, resuelto con los tokens `--radio-*`. */
export type RadioCaja = 'sm' | 'md' | 'lg';

/** Borde donde se dibuja la franja de acento. `ninguno` no dibuja franja. */
export type AcentoCaja = 'ninguno' | 'derecha';

const CLASES_BASE = 'flex flex-col gap-3 border border-solid';

const CLASES_VARIANTE: Record<VarianteCaja, string> = {
  base: 'bg-superficie border-borde-default text-texto-primario',
  elevada: 'bg-elevado border-borde-default text-texto-primario',
  hundida: 'bg-hundido border-borde-default text-texto-primario',
  destacada: 'bg-marca-primaria-suave border-marca-primaria text-texto-primario',
  exito: 'bg-exito-fondo border-exito-borde text-exito-texto',
  error: 'bg-error-fondo border-error-borde text-error-texto',
  advertencia: 'bg-advertencia-fondo border-advertencia-borde text-advertencia-texto',
  atencion: 'bg-atencion-fondo border-atencion-borde text-atencion-texto',
  info: 'bg-info-fondo border-info-borde text-info-texto',
};

const CLASES_SOMBRA: Record<SombraCaja, string> = {
  ninguna: '',
  baja: 'shadow-baja',
  media: 'shadow-media',
  alta: 'shadow-alta',
};

const CLASES_PADDING: Record<PaddingCaja, string> = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

const CLASES_RADIO: Record<RadioCaja, string> = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
};

/**
 * Caja contenedora del sistema de contenido.
 *
 * Resuelve todo por tokens: superficies y bordes (`--fondo-*`, `--borde-*`),
 * los 5 tokens por estado para las variantes de feedback, sombras (`--sombra-*`)
 * y radios (`--radio-*`). Nunca define colores propios, así respeta el modo
 * activo (`data-modo`).
 *
 * El contenido se proyecta con `ng-content`. Los slots `[slot='encabezado']` y
 * `[slot='pie']` son opcionales y se renderizan antes y después del contenido.
 * Las cuatro variantes de superficie fijan `text-texto-primario` y las de
 * feedback fijan `text-{estado}-texto`; los componentes de `textual/` pueden
 * heredar ese color con `color="heredar"` sin depender del color del `body`.
 *
 * La opción `acento="derecha"` dibuja una franja fina en el borde derecho. Su
 * color es el de marca por defecto; el consumidor puede cambiarlo sin salir de
 * los tokens definiendo la custom property `--acento-caja` en la caja (por
 * ejemplo `--exito` o `--error` para una variación). La franja nunca se separa
 * del borde: va dentro del recorte de la caja, así no genera scroll lateral.
 */
@Component({
  selector: 'app-caja',
  templateUrl: './caja.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'clases()',
  },
})
export class Caja {
  readonly variante = input<VarianteCaja>('base');
  readonly sombra = input<SombraCaja>('ninguna');
  readonly padding = input<PaddingCaja>('md');
  readonly radio = input<RadioCaja>('md');
  readonly acento = input<AcentoCaja>('ninguno');

  protected readonly clases = computed(() =>
    [
      CLASES_BASE,
      this.acento() === 'derecha' ? 'relative overflow-hidden' : '',
      CLASES_VARIANTE[this.variante()],
      CLASES_SOMBRA[this.sombra()],
      CLASES_PADDING[this.padding()],
      CLASES_RADIO[this.radio()],
    ]
      .join(' ')
      .trim(),
  );
}
