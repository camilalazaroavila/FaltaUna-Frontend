import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

let contador = 0;

/** Ícono "i" con globo de ayuda. Se abre con hover o foco de teclado. */
@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="group relative inline-flex">
      <button
        type="button"
        class="inline-flex cursor-help items-center text-marca-primaria focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco"
        aria-label="Más información"
        [attr.aria-describedby]="id"
      >
        <ng-icon name="phosphorInfoFill" class="size-5" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        [id]="id"
        class="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden w-44 -translate-x-1/2 rounded-lg bg-texto-primario px-3 py-2 text-center font-interfaz text-xs font-bold normal-case text-texto-sobre-oscuro shadow-media group-focus-within:block group-hover:block"
      >
        {{ texto() }}
      </span>
    </span>
  `,
})
export class InfoTooltip {
  readonly texto = input.required<string>();
  protected readonly id = `info-tooltip-${++contador}`;
}