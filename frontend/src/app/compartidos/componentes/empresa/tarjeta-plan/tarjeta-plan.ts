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
    <article class="flex h-full flex-col items-center justify-between text-texto-primario w-full max-w-sm mx-auto">
      <div class="flex flex-col items-center w-full">
        <!-- Cuadro orgánico estilizado reutilizado de la landing de empresa -->
        <div class="w-56 h-36 flex items-center justify-center">
          <app-cuadro-plan [tipo]="plan().id" [titulo]="plan().nombre" />
        </div>

        <!-- Lista de beneficios -->
        <ul class="mt-6 flex flex-col gap-1.5 w-fit max-w-[260px] mx-auto text-left font-cuerpo text-sm sm:text-base text-[#122B2E]">
          @for (beneficio of plan().beneficios; track beneficio) {
            <li class="flex items-center gap-2">
              <span class="text-[#122B2E] text-base font-bold leading-none">•</span>
              <span class="leading-snug">{{ beneficio }}</span>
            </li>
          }
        </ul>
      </div>

      <div class="mt-8 flex flex-col items-center w-full">
        <!-- Precio -->
        <div class="mb-4 text-center">
          <span class="font-titulo text-3xl sm:text-4xl font-extrabold text-[#122B2E] tracking-tight">
            \${{ precioFormateado() }}
          </span>
          <span class="font-titulo text-xl sm:text-2xl font-bold text-[#122B2E]">/mes</span>
        </div>

        <!-- Botón de selección -->
        @if (plan().id === 'basico') {
          <button
            type="button"
            class="w-full max-w-xs py-3 px-6 rounded-full bg-[#0D2E33] hover:bg-[#15464d] text-white font-titulo text-sm sm:text-base uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md hover:scale-[1.02] active:scale-[0.98]"
            (click)="elegir.emit(plan())"
          >
            ELEGIR PLAN BÁSICO
          </button>
        } @else {
          <button
            type="button"
            disabled
            class="w-full max-w-xs py-3 px-6 rounded-full bg-[#0D2E33]/40 text-white/70 font-titulo text-sm sm:text-base uppercase tracking-wider cursor-not-allowed shadow-none"
            [title]="'Plan ' + plan().nombre + ' estará disponible próximamente'"
          >
            ELEGIR PLAN {{ plan().nombre.toUpperCase() }}
          </button>
        }
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