import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCardsFill,
  phosphorChartBarFill,
  phosphorEyeFill,
  phosphorMegaphoneFill,
  phosphorPaletteFill,
} from '@ng-icons/phosphor-icons/fill';
import {
  BeneficioPlan,
  IconoBeneficio,
  PlanEmpresa,
} from '../../../modelos/landing-empresa.model';

const ICONOS_BENEFICIO: Record<IconoBeneficio, string> = {
  megafono: 'phosphorMegaphoneFill',
  estadisticas: 'phosphorChartBarFill',
  ojo: 'phosphorEyeFill',
  paleta: 'phosphorPaletteFill',
  cartas: 'phosphorCardsFill',
};

const CLASES_ETIQUETA_BASE =
  'flex items-center justify-center px-6 py-4 text-center font-titulo text-xl uppercase tracking-wide text-landing-claro-fondo md:w-48 md:min-w-[11rem] md:py-6 md:text-2xl';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [NgIcon],
  providers: [
    provideIcons({
      phosphorMegaphoneFill,
      phosphorChartBarFill,
      phosphorEyeFill,
      phosphorPaletteFill,
      phosphorCardsFill,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plan-card.html',
  styleUrl: './plan-card.scss',
})
export class PlanCard {
  readonly plan = input.required<PlanEmpresa>();

  protected readonly clasesEtiqueta = computed(() => {
    const variante =
      this.plan().variante === 'azul'
        ? 'bg-[var(--color-azul-empresa)]'
        : this.plan().variante === 'violeta'
          ? 'bg-[var(--color-violeta-empresa)]'
          : 'bg-gradient-to-r from-[var(--color-azul-empresa)] to-[var(--color-violeta-empresa)]';

    return `${CLASES_ETIQUETA_BASE} ${variante}`;
  });

  protected iconoDe(beneficio: BeneficioPlan): string {
    return ICONOS_BENEFICIO[beneficio.icono];
  }

  /** Destaca la cantidad de cartas ("Hasta 12 cartas" → 12 en negrita). */
  protected resaltarNumero(texto: string): string {
    return texto.replace(/(\d+)/g, '<strong class="font-extrabold">$1</strong>');
  }
}
