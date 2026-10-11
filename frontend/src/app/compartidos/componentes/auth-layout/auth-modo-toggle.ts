import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModoAuth } from './auth-modo';

@Component({
  selector: 'app-auth-modo-toggle',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="group"
      aria-label="Tipo de cuenta"
      class="grid grid-cols-2 gap-1 rounded-lg bg-fondo-app p-1"
    >
      @for (opcion of opciones; track opcion.valor) {
        <a
          routerLink="."
          [queryParams]="{ modo: opcion.valor }"
          queryParamsHandling="merge"
          [replaceUrl]="true"
          [attr.aria-current]="modo() === opcion.valor ? 'true' : null"
          class="rounded-md px-4 py-3 text-center font-interfaz text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          [class.bg-btn-primario-bg]="modo() === opcion.valor"
          [class.text-btn-primario-texto]="modo() === opcion.valor"
          [class.text-texto-secundario]="modo() !== opcion.valor"
          [class.hover:text-texto-primario]="modo() !== opcion.valor"
        >
          {{ opcion.etiqueta }}
        </a>
      }
    </div>
  `,
})
export class AuthModoToggle {
  readonly modo = input.required<ModoAuth>();

  protected readonly opciones: { valor: ModoAuth; etiqueta: string }[] = [
    { valor: 'jugador', etiqueta: 'Usuario' },
    { valor: 'empresa', etiqueta: 'Empresa' },
  ];
}