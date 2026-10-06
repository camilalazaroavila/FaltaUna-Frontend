import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../servicios/auth.service';
import urlLogo from '../../SVGs/Imagotipo_claro.svg';

/** Barra superior del panel de empresa: logo a la izquierda, menú de cuenta a la derecha. */
@Component({
  selector: 'app-header-empresa',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="relative flex items-center justify-between bg-marca-primaria px-4 py-2 text-marca-sobre-primaria sm:px-8"
    >
      <a routerLink="/empresa" class="shrink-0" aria-label="Falta Una, ir al panel de empresa">
        <img [src]="urlLogo" alt="" class="h-14 w-auto sm:h-[4.5rem]" />
      </a>

      <div class="relative">
        <button
          type="button"
          class="flex size-11 cursor-pointer items-center justify-center rounded-circulo bg-fondo-superficie text-marca-primaria transition-colors hover:bg-fondo-elevado focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco"
          aria-label="Menú de cuenta"
          aria-haspopup="menu"
          [attr.aria-expanded]="abierto()"
          (click)="abierto.set(!abierto())"
        >
          <i class="fa-solid fa-user text-xl" aria-hidden="true"></i>
        </button>

        @if (abierto()) {
          <div
            role="menu"
            class="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-borde-default bg-fondo-superficie p-2 text-texto-primario shadow-alta"
          >
            <p class="truncate px-3 py-2 font-interfaz text-sm font-bold">
              {{ auth.usuarioActual()?.nombreUsuario }}
            </p>
            <button
              type="button"
              role="menuitem"
              class="w-full cursor-pointer rounded-md px-3 py-2 text-left font-interfaz text-sm font-bold hover:bg-fondo-elevado"
              (click)="salir()"
            >
              Cerrar sesión
            </button>
          </div>
        }
      </div>
    </header>
  `,
})
export class HeaderEmpresa {
  protected readonly auth = inject(AuthService);
  protected readonly urlLogo = urlLogo;
  protected readonly abierto = signal(false);

  readonly cerrarSesion = output<void>();

  protected salir(): void {
    this.abierto.set(false);
    this.cerrarSesion.emit();
  }
}
