import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
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
  readonly modo = input<'jugador' | 'empresa'>('jugador');

  protected readonly esEmpresa = computed(() => this.modo() === 'empresa');

  protected readonly clasesSeccion = computed(() =>
    this.esEmpresa()
      ? 'bg-[#675679] py-14 sm:py-20 md:py-24 lg:py-28 text-white'
      : 'bg-landing-claro-fondo py-14 sm:py-20 md:py-24 lg:py-28 xl:py-32 2xl:py-40 text-landing-claro-texto',
  );

  protected readonly clasesTitulo = computed(() =>
    this.esEmpresa() ? 'text-white' : 'text-landing-claro-texto',
  );

  protected readonly clasesTexto = computed(() =>
    this.esEmpresa() ? 'text-white' : 'text-landing-claro-texto',
  );

  protected readonly clasesBordeAvatar = computed(() =>
    this.esEmpresa() ? 'border-white' : 'border-landing-claro-texto',
  );

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
