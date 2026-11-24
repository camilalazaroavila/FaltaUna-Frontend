import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { StepperSuscripcion } from '@compartidos/componentes/empresa/stepper-suscripcion/stepper-suscripcion';

/**
 * Cabecera de cada paso del alta de campaña/álbum:
 * "← Volver", título grande y breadcrumb numerado (1—2—3—4—5—6).
 * Reutilizable en cualquier pantalla del flujo de empresa.
 */
@Component({
  selector: 'app-encabezado-paso',
  standalone: true,
  imports: [RouterLink, NgIcon, StepperSuscripcion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (rutaVolver()) {
      <div class="mb-2 text-left">
        <a
          [routerLink]="rutaVolver()"
          class="inline-flex items-center gap-1.5 font-titulo text-xs sm:text-sm font-bold uppercase tracking-wider text-[#122B2E] hover:text-[#584462] transition-colors"
        >
          <ng-icon name="phosphorArrowLeftFill" aria-hidden="true" />
          {{ etiquetaVolver() }}
        </a>
      </div>
    }

    <div class="relative flex flex-col-reverse gap-4 sm:flex-row sm:items-start sm:justify-between w-full min-h-[48px]">
      <h1
        class="font-titulo font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#584462] text-left leading-none"
      >
        @if (tituloTablet() || tituloSegundaLineaTablet()) {
          <!-- Variante Tablet (768px a 1439px) -->
          <span class="hidden tablet:inline">{{ (tituloTablet() ?? titulo()) + (tituloSegundaLineaTablet() ? ' ' : '') }}</span>
          @if (tituloSegundaLineaTablet()) {
            <span class="hidden tablet:block">{{ tituloSegundaLineaTablet() }}</span>
          }

          <!-- Variante otros tamaños (< 768px y >= 1440px) -->
          <span class="tablet:hidden inline">{{ titulo() + (tituloSegundaLinea() ? ' ' : '') }}</span>
          @if (tituloSegundaLinea()) {
            <span class="tablet:hidden block">{{ tituloSegundaLinea() }}</span>
          }
        } @else if (tituloSegundaLinea()) {
          <span>{{ titulo() + ' ' }}</span><span class="block">{{ tituloSegundaLinea() }}</span>
        } @else {
          {{ titulo() }}
        }
      </h1>

      <div class="sm:absolute sm:left-1/2 sm:top-[18px] lg:top-[24px] sm:-translate-x-1/2 sm:-translate-y-1/2 flex justify-center w-full sm:w-auto">
        <app-stepper-suscripcion [pasoActual]="paso()" />
      </div>
    </div>
  `,
})
export class EncabezadoPaso {
  readonly titulo = input.required<string>();
  readonly tituloSegundaLinea = input<string | null>(null);
  readonly tituloTablet = input<string | null>(null);
  readonly tituloSegundaLineaTablet = input<string | null>(null);
  readonly paso = input.required<number>();
  readonly rutaVolver = input<string | string[] | null>(null);
  readonly etiquetaVolver = input('Volver');
  readonly tituloAngosto = input(true);
}