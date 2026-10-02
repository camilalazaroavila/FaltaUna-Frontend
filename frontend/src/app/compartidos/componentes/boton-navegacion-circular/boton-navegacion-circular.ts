import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

export type TamanioBotonNavegacion = 'sm' | 'md' | 'lg';

const CLASES_BASE = [
  'relative inline-flex items-center justify-center shrink-0',
  'border font-interfaz font-bold uppercase leading-none',
  'transition-[background-color,border-color,color,box-shadow] duration-200 ease-out',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco',
  'motion-reduce:transition-none',
].join(' ');

/**
 * Los estados hover/active se AUSAN cuando el control está deshabilitado, con
 * la misma variante `habilitado` que usa `app-boton`.
 */
const CLASES_INACTIVO = [
  'rounded-pildora border-borde-default bg-fondo-superficie text-texto-secundario',
  'habilitado:hover:bg-btn-terciario-hover habilitado:hover:text-texto-primario',
  'habilitado:active:bg-btn-terciario-activo',
].join(' ');

const CLASES_ACTIVO = [
  'rounded-pildora border-transparent bg-marca-primaria text-marca-sobre-primaria',
  'shadow-baja habilitado:hover:shadow-media',
].join(' ');

const CLASES_DESHABILITADO = 'cursor-not-allowed opacity-50 shadow-none';

const CLASES_TAMANIO: Record<TamanioBotonNavegacion, string> = {
  sm: 'h-9 min-w-9 px-2.5 text-xs',
  md: 'h-11 min-w-11 px-3 text-sm',
  lg: 'h-[3.25rem] min-w-[3.25rem] px-4 text-base',
};

/**
 * Item de navegacion circular para la barra lateral y el encabezado.
 * El estado activo lo puede fijar el consumidor o el propio item activo de
 * `app-barra-lateral`; el componente no consulta el Router por su cuenta.
 *
 * El host solo aporta su participacion en el layout; la capa visual vive en el
 * `<button>` interno.
 */
@Component({
  selector: 'app-boton-navegacion-circular',
  imports: [NgIcon],
  templateUrl: './boton-navegacion-circular.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
  },
})
export class BotonNavegacionCircular {
  readonly icono = input.required<string>();
  readonly etiquetaAria = input.required<string>();
  readonly activo = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly tamanio = input<TamanioBotonNavegacion>('md');
  readonly insignia = input<number | string | null>(null);
  readonly deshabilitado = input<boolean, unknown>(false, { transform: booleanAttribute });

  readonly accion = output<void>();

  protected readonly clases = computed(() => {
    const clases = [
      CLASES_BASE,
      this.activo() ? CLASES_ACTIVO : CLASES_INACTIVO,
      CLASES_TAMANIO[this.tamanio()],
    ];

    if (this.deshabilitado()) {
      clases.push(CLASES_DESHABILITADO);
    }

    return clases.join(' ');
  });

  /** La insignia es decorativa: su valor se integra al nombre accesible. */
  protected readonly etiquetaAccesible = computed(() => {
    const insignia = this.insignia();
    return insignia === null ? this.etiquetaAria() : `${this.etiquetaAria()} (${insignia})`;
  });
}
