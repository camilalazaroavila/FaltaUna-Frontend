import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../servicios/auth.service';
import urlLogoBlanco from '../../SVGs/ImagotipoBlanco.svg';

/**
 * Barra superior del área de empresa: mismo formato que el header de usuario
 * (barra flotante con márgenes, logo a la izquierda y avatar con menú de sesión
 * a la derecha), pero con la identidad violeta del panel de marcas, el imagotipo
 * en blanco y el azul corporativo como acento del avatar.
 */
@Component({
  selector: 'app-header-empresa',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <header class="relative z-40 m-5">
      <div
        class="flex items-center justify-between gap-2 rounded-md bg-marca-primaria px-3 py-2 text-marca-sobre-primaria shadow-md sm:gap-4 sm:px-4 lg:gap-6 lg:rounded-2xl lg:px-8 lg:py-3"
      >
        <a
          routerLink="/empresa/panel"
          class="flex shrink-0 items-center"
          aria-label="Ir al panel de empresa"
        >
          <img [src]="urlLogo" alt="Falta Una" class="h-8 w-auto sm:h-9 lg:h-[75px]" />
        </a>

        <div class="relative shrink-0">
          <button
            type="button"
            (click)="toggleMenu()"
            class="flex size-9 cursor-pointer items-center justify-center rounded-circulo border border-black/10 bg-marca-secundaria text-marca-sobre-secundaria shadow-sm transition hover:brightness-110 sm:size-10 2xl:size-14"
            aria-label="Menú de cuenta"
            [attr.aria-expanded]="menuAbierto()"
          >
            <svg
              class="size-5 sm:size-6 2xl:size-8"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          @if (menuAbierto()) {
            <div
              class="absolute top-full right-0 z-50 mt-2 w-56 rounded-xl border border-borde-default bg-fondo-superficie p-3 text-texto-primario shadow-alta 2xl:w-72 2xl:p-4"
            >
              <div class="mb-2 border-b border-borde-default pb-2">
                <p
                  class="font-interfaz text-xs tracking-wide text-texto-apagado uppercase 2xl:text-sm"
                >
                  Sesión activa
                </p>
                <p class="truncate font-titulo text-sm text-marca-primaria 2xl:text-lg">
                  {{ nombreEmpresa() }}
                </p>
              </div>
              <button
                type="button"
                (click)="salir()"
                class="w-full cursor-pointer rounded-lg bg-fondo-elevado px-3 py-2 text-left font-interfaz text-xs font-bold text-texto-primario transition hover:bg-error-fondo hover:text-error-texto 2xl:py-3 2xl:text-base"
              >
                Cerrar sesión
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
})
export class HeaderEmpresa {
  private readonly auth = inject(AuthService);

  /** Imagotipo blanco: contrasta sobre el violeta de la barra. */
  protected readonly urlLogo = urlLogoBlanco;

  protected readonly menuAbierto = signal(false);

  protected readonly nombreEmpresa = computed(
    () => this.auth.usuarioActual()?.nombreUsuario ?? 'Mi empresa',
  );

  readonly cerrarSesion = output<void>();

  protected toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected salir(): void {
    this.menuAbierto.set(false);
    this.cerrarSesion.emit();
  }
}
