import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { Plan, PlanId } from '../../../modelos/plan.model';
import { Boton } from '../boton/boton';

const FONDO_TITULO: Record<PlanId, string> = {
  basico: 'bg-marca-acento',
  standard: 'bg-marca-primaria',
  premium: 'bg-gradient-to-br from-marca-acento to-texto-primario',
};

/**
 * Tarjeta de un plan: nombre enmarcado, beneficios,
 * nivel de precio y botón para elegirlo.
 */
@Component({
  selector: 'app-tarjeta-plan',
  standalone: true,
  imports: [Boton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="flex h-full flex-col items-center gap-6 text-texto-primario">
      <h2
        class="flex h-20 w-44 items-center justify-center border-4 border-texto-primario px-3 text-center font-titulo text-2xl uppercase text-marca-sobre-primaria"
        [class]="fondoTitulo()"
        style="border-radius: 14px 6px 16px 8px / 8px 16px 6px 14px"
      >
        {{ plan().nombre }}
      </h2>

      <ul
        class="flex-1 list-disc space-y-0.5 pl-5 font-interfaz text-sm font-semibold"
      >
        @for (beneficio of plan().beneficios; track beneficio) {
          <li>{{ beneficio }}</li>
        }
      </ul>

      <div class="text-center">
        <p
          class="font-titulo text-3xl leading-none tracking-wider sm:text-4xl"
          [attr.aria-label]="'Precio $' + plan().precio + ' pesos por mes'"
        >
          \${{ precioFormateado() }}
        </p>
        <span class="font-interfaz text-xs font-semibold text-texto-secundario">/ mes</span>
      </div>

      <button
        app-boton
        type="button"
        variante="secundario"
        [cargando]="cargando()"
        (click)="elegir.emit(plan())"
      >
        Elegir plan {{ plan().nombre }}
      </button>
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

  protected readonly fondoTitulo = computed(
    () => FONDO_TITULO[this.plan().id],
  );
}