import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

export type VarianteBotonIcono = 'fantasma' | 'superficie';
export type TamanioBotonIcono = 'sm' | 'md';

const CLASES_BASE = [
  'inline-flex items-center justify-center shrink-0',
  'font-interfaz cursor-pointer select-none',
  'transition-[background-color,border-color,color,transform] duration-200 ease-out',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco',
  'habilitado:hover:-translate-y-px habilitado:active:scale-[0.97]',
  'motion-reduce:transition-none motion-reduce:transform-none',
].join(' ');

const CLASES_VARIANTE: Record<VarianteBotonIcono, string> = {
  fantasma: [
    'rounded-circulo border border-transparent bg-btn-fantasma-bg text-btn-fantasma-texto',
    'habilitado:hover:bg-btn-fantasma-hover',
    'habilitado:hover:text-texto-primario',
    'habilitado:active:bg-btn-fantasma-activo',
  ].join(' '),
  superficie: [
    'rounded-circulo border border-borde-default bg-fondo-elevado text-texto-primario shadow-baja',
    'habilitado:hover:bg-marca-acento',
    'habilitado:hover:text-marca-sobre-acento',
    'habilitado:hover:border-marca-acento',
    'habilitado:active:bg-marca-acento-activo',
  ].join(' '),
};

const CLASES_TAMANIO: Record<TamanioBotonIcono, string> = {
  sm: 'area-tactil size-8',
  md: 'size-11',
};

/**
 * Control compacto de una sola accion, sin texto visible.
 * Pensado para cerrar modales, flechas de carrusel y acciones de tarjeta.
 *
 * El host solo aporta su participacion en el layout; la capa visual vive en el
 * `<button>` interno para conservar la semantica nativa de `disabled`.
 */
@Component({
  selector: 'app-boton-icono',
  imports: [NgIcon],
  templateUrl: './boton-icono.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
  },
})
export class BotonIcono {
  readonly icono = input.required<string>();
  readonly etiquetaAria = input.required<string>();
  readonly variante = input<VarianteBotonIcono>('fantasma');
  readonly tamanio = input<TamanioBotonIcono>('md');
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });

  readonly accion = output<void>();

  protected readonly clases = computed(() => {
    const clases = [CLASES_BASE, CLASES_VARIANTE[this.variante()], CLASES_TAMANIO[this.tamanio()]];

    if (this.disabled()) {
      clases.push('cursor-not-allowed opacity-50 shadow-none');
    }

    return clases.join(' ');
  });
}
