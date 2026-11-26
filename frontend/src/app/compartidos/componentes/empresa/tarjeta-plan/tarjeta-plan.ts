import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { Plan } from '@modelos/plan.model';
import { CuadroPlan } from '@compartidos/componentes/empresa/cuadro-plan/cuadro-plan';

/**
 * Tarjeta de un plan del flujo de empresa:
 * Cuadro sketch estilizado de la landing (app-cuadro-plan), beneficios, precio y botón de selección.
 */
@Component({
  selector: 'app-tarjeta-plan',
  standalone: true,
  imports: [CuadroPlan],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="flex h-full flex-col items-center justify-between text-texto-primario w-full max-w-sm lg:max-w-md 2xl:max-w-lg mx-auto py-1 sm:py-2">
      <div class="flex flex-col items-center w-full">
        <!-- Cuadro orgánico estilizado reutilizado de la landing de empresa -->
        <div class="w-full max-w-[260px] sm:max-w-[300px] lg:max-w-[320px] xl:max-w-[240px] 2xl:max-w-[400px] aspect-[240/180] flex items-center justify-center transition-transform hover:scale-[1.02]">
          <app-cuadro-plan [tipo]="plan().id" [titulo]="plan().nombre" />
        </div>

        <!-- Lista de beneficios alineada a la izquierda -->
        <ul class="mt-3 sm:mt-4 xl:mt-2.5 2xl:mt-7 flex flex-col gap-1.5 sm:gap-2 xl:gap-1.5 2xl:gap-3 w-full max-w-[260px] sm:max-w-[300px] lg:max-w-[320px] xl:max-w-[240px] 2xl:max-w-[400px] mx-auto text-left font-cuerpo text-xs sm:text-sm xl:text-xs 2xl:text-lg text-[#122B2E] pl-1 sm:pl-2">
          @for (beneficio of plan().beneficios; track beneficio) {
            <li class="flex items-center gap-2 2xl:gap-3.5">
              <span class="text-[#122B2E] text-sm sm:text-base xl:text-sm 2xl:text-2xl font-bold leading-none">•</span>
              <span class="leading-snug">{{ beneficio }}</span>
            </li>
          }
        </ul>
      </div>

      <div class="mt-4 sm:mt-6 xl:mt-3 2xl:mt-10 flex flex-col items-center w-full">
        <!-- Precio -->
        <div class="mb-2 sm:mb-3 xl:mb-2 2xl:mb-5 text-center">
          <span class="font-titulo text-3xl sm:text-4xl xl:text-3xl 2xl:text-6xl font-extrabold text-[#122B2E] tracking-tight">
            \${{ precioFormateado() }}
          </span>
          <span class="font-titulo text-xl sm:text-2xl xl:text-xl 2xl:text-3xl font-bold text-[#122B2E]">/mes</span>
        </div>

        <!-- Botón de selección -->
        <button
          type="button"
          class="w-full max-w-xs sm:max-w-sm xl:max-w-[220px] 2xl:max-w-md py-2.5 sm:py-3 xl:py-2 2xl:py-4 px-4 sm:px-6 xl:px-4 2xl:px-8 rounded-full bg-[#0D2E33] hover:bg-[#15464d] text-white font-titulo text-xs sm:text-sm xl:text-xs 2xl:text-base uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
          (click)="elegir.emit(plan())"
        >
          ELEGIR PLAN {{ plan().nombre.toUpperCase() }}
        </button>
      </div>
    </article>
  `,
})
export class TarjetaPlan {
  readonly plan = input.required<Plan>();
  readonly cargando = input<boolean>(false);

  readonly elegir = output<Plan>();

  protected readonly precioFormateado = computed(() =>
    this.plan().precio.toLocaleString('es-AR'),
  );
}