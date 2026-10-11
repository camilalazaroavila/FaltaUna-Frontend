import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { StepperSuscripcion } from '../stepper-suscripcion/stepper-suscripcion';

/**
 * Cabecera de cada paso del alta de campaña/álbum:
 * "← Volver", título grande y breadcrumb numerado (1—2—3—4—5).
 * Reutilizable en cualquier pantalla del flujo de empresa.
 */
@Component({
  selector: 'app-encabezado-paso',
  standalone: true,
  imports: [RouterLink, NgIcon, StepperSuscripcion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rutaVolver()) {
      <a
        [routerLink]="rutaVolver()"
        class="inline-flex items-center gap-2 font-interfaz text-xs font-bold uppercase text-texto-primario hover:text-marca-primaria"
      >
        <ng-icon name="phosphorArrowLeftFill" aria-hidden="true" />
        {{ etiquetaVolver() }}
      </a>
    }

    <div class="mt-4 grid items-start gap-6 md:grid-cols-[1fr_auto_1fr]">
      <h1
        class="font-titulo text-4xl uppercase leading-[0.95] text-marca-primaria sm:text-5xl"
        [class.max-w-[10ch]]="tituloAngosto()"
      >
        {{ titulo() }}
      </h1>

      <app-stepper-suscripcion [pasoActual]="paso()" />

      <span class="hidden md:block" aria-hidden="true"></span>
    </div>
  `,
})
export class EncabezadoPaso {
  readonly titulo = input.required<string>();
  readonly paso = input.required<number>();
  readonly rutaVolver = input<string | string[] | null>(null);
  readonly etiquetaVolver = input('Volver');
  readonly tituloAngosto = input(true);
}