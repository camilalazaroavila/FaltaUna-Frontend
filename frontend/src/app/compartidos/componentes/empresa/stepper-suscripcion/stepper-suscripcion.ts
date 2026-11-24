import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Indicador de pasos 1 a 5 del flujo de empresa:
 * Círculos numerados (1) - (2) - (3) - (4) - (5).
 * El paso activo se pinta de violeta con número blanco; los inactivos son blancos con borde y número negro.
 */
@Component({
  selector: 'app-stepper-suscripcion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="flex items-center justify-center gap-1.5 sm:gap-2" aria-label="Pasos para crear tu campaña">
      @for (etiqueta of etiquetas(); track etiqueta; let i = $index; let ultimo = $last) {
        <li class="flex items-center gap-1.5 sm:gap-2" [attr.aria-current]="i + 1 === pasoActual() ? 'step' : null">
          <span
            class="flex size-7 sm:size-8 items-center justify-center rounded-full border-2 border-black font-titulo font-bold text-xs sm:text-sm select-none transition-transform duration-200"
            style="box-shadow: 3px 3px 0 #584462;"
            [class]="
              i + 1 === pasoActual()
                ? 'bg-[#584462] text-white'
                : 'bg-white text-black'
            "
          >
            {{ i + 1 }}
            <span class="sr-only">{{ etiqueta }}</span>
          </span>
          @if (!ultimo) {
            <span class="h-0.5 w-3 bg-black sm:w-5" aria-hidden="true"></span>
          }
        </li>
      }
    </ol>
  `,
})
export class StepperSuscripcion {
  readonly pasoActual = input(1);
  readonly etiquetas = input<string[]>(['Plan', 'Marca', 'Álbum', 'Vista previa', 'Pago']);
}