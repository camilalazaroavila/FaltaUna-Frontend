import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { PlanEmpresa } from '@modelos/landing-empresa.model';
import { CuadroPlan } from '@compartidos/componentes/empresa/cuadro-plan/cuadro-plan';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CuadroPlan],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-card.html',
  styleUrl: './plan-card.scss',
})
export class PlanCard {
  readonly plan = input.required<PlanEmpresa>();

  /** Controla si la tarjeta está expandida en mobile */
  readonly expandido = signal(false);

  protected readonly precio = computed(() => this.plan().precio ?? '$15.000');
  protected readonly periodo = computed(() => this.plan().periodo ?? '/mes');

  protected alternarExpandir(): void {
    this.expandido.update((v) => !v);
  }

  /** Destaca la cantidad de números ("Hasta 12 cartas" → 12 en negrita). */
  protected resaltarNumero(texto: string): string {
    return texto.replace(/(\d+)/g, '<strong class="font-extrabold text-[#0A2E36]">$1</strong>');
  }
}
