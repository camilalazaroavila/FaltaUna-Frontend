import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PlanEmpresa } from '../../../modelos/landing-empresa.model';
import { Boton } from '../boton/boton';
import { PlanCard } from '../plan-card/plan-card';

@Component({
  selector: 'app-plans-section',
  standalone: true,
  imports: [RouterLink, Boton, PlanCard],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plans-section.html',
  styleUrl: './plans-section.scss',
})
export class PlansSection {
  readonly planes = input.required<PlanEmpresa[]>();
}
