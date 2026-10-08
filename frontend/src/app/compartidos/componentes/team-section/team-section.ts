import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IntegranteEquipo } from '../../../modelos/landing-empresa.model';

@Component({
  selector: 'app-team-section',
  standalone: true,
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './team-section.html',
  styleUrl: './team-section.scss',
})
export class TeamSection {
  readonly integrantes = input.required<IntegranteEquipo[]>();

  protected iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }
}
