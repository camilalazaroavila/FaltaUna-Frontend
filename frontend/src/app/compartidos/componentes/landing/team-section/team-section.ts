import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IntegranteEquipo } from '@modelos/landing-empresa.model';

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

  protected readonly filaSuperior = computed(() => this.integrantes().slice(0, 4));
  protected readonly filaInferior = computed(() => this.integrantes().slice(4));

  protected iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }
}
