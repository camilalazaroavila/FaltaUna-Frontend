import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

const CLASES_BASE = [
  'fixed right-5 bottom-5 z-40 inline-flex size-14 items-center justify-center',
  'rounded-circulo bg-marca-primaria font-interfaz text-marca-sobre-primaria',
  'shadow-alta transition-[background-color,box-shadow,transform] duration-200 ease-out',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco',
  'habilitado:hover:-translate-y-0.5 habilitado:hover:bg-marca-primaria-hover',
  'habilitado:hover:shadow-brillo-verde habilitado:active:scale-[0.97]',
  'motion-reduce:transition-none motion-reduce:transform-none',
  'sm:right-8 sm:bottom-8',
].join(' ');

const CLASES_DESHABILITADO = 'cursor-not-allowed opacity-50 shadow-none';

/**
 * Accion principal flotante (FAB) anclada a la esquina inferior derecha.
 * Es el punto de entrada a la accion mas urgente de la pantalla: abrir un
 * sobre, iniciar un partido o crear un torneo.
 *
 * El host solo aporta su participacion en el layout; el anclaje y la capa
 * visual viven en el `<button>` interno.
 */
@Component({
  selector: 'app-boton-flotante',
  imports: [NgIcon],
  templateUrl: './boton-flotante.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
  },
})
export class BotonFlotante {
  readonly icono = input.required<string>();
  readonly etiquetaAria = input.required<string>();
  readonly contador = input<number | null>(null);
  readonly disabled = input<boolean, unknown>(false, { transform: booleanAttribute });

  readonly accion = output<void>();

  /** Solo se anuncia el contador cuando es positivo: `0` no es una novedad. */
  protected readonly hayContador = computed(() => (this.contador() ?? 0) > 0);

  protected readonly etiquetaAccesible = computed(() => {
    const contador = this.contador() ?? 0;
    return contador > 0
      ? `${this.etiquetaAria()} (${contador} pendientes)`
      : this.etiquetaAria();
  });

  protected readonly clases = computed(() => {
    const clases = [CLASES_BASE];

    if (this.disabled()) {
      clases.push(CLASES_DESHABILITADO);
    }

    return clases.join(' ');
  });
}
