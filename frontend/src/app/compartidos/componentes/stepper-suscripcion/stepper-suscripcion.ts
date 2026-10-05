import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Indicador de pasos 1 a 5 del alta de campaña. El paso actual va resaltado. */
@Component({
  selector: 'app-stepper-suscripcion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="flex items-center justify-center" aria-label="Pasos para crear tu campaña">
      @for (etiqueta of etiquetas(); track etiqueta; let i = $index; let ultimo = $last) {
        <li class="flex items-center" [attr.aria-current]="i + 1 === pasoActual() ? 'step' : null">
          <span
            class="flex size-8 items-center justify-center rounded-circulo border-2 border-texto-primario font-titulo text-sm sm:size-9 sm:text-base"
            [class]="
              i + 1 === pasoActual()
                ? 'bg-[var(--color-amarillo-acento)] text-texto-primario'
                : 'bg-texto-primario text-texto-sobre-oscuro'
            "
          >
            {{ i + 1 }}
            <span class="sr-only">{{ etiqueta }}</span>
          </span>
          @if (!ultimo) {
            <span class="h-0.5 w-5 bg-texto-primario sm:w-8" aria-hidden="true"></span>
          }
        </li>
      }
    </ol>
  `,
})
export class StepperSuscripcion {
  readonly pasoActual = input(1);
  readonly etiquetas = input<string[]>(['Plan', 'Marca', 'Pago', 'Colección', 'Listo']);
}
