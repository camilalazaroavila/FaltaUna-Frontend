import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { injectModoAuth } from '../auth-layout/auth-modo';
import urlLogoClaro from '../../SVGs/Imagotipo_claro.svg';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="m-5 flex items-center gap-2 rounded-md px-3 py-2 shadow-md text-landing-oscuro-texto sm:gap-4 sm:px-4 lg:gap-6 lg:rounded-2xl lg:px-8 lg:py-3"
      [class.bg-landing-oscuro-fondo]="!enAuth()"
      [class.bg-header-auth-fondo]="enAuth()"
    >
      <a routerLink="/" class="shrink-0" aria-label="Falta Una, ir al inicio">
        <img
          [src]="urlLogo"
          alt=""
          class="w-auto lg:h-[75px]"
          [class.h-8]="!enAuth()"
          [class.sm:h-9]="!enAuth()"
          [class.h-12]="enAuth()"
          [class.sm:h-14]="enAuth()"
          [class.brightness-0]="enAuth() && modo() === 'empresa'"
          [class.invert]="enAuth() && modo() === 'empresa'"
        />
      </a>

      @if (!enAuth()) {
        <form
          role="search"
          class="relative min-w-0 flex-1 md:w-64 md:flex-none lg:w-[290px]"
          (submit)="buscarCampania($event)"
        >
          <label class="sr-only" for="buscador-campania">Buscar campaña</label>
          <svg
            class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-landing-claro-texto/60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5 21 21" />
          </svg>
          <input
            id="buscador-campania"
            type="search"
            autocomplete="off"
            placeholder="Buscá tu campaña preferida..."
            [value]="termino()"
            (input)="termino.set($any($event.target).value)"
            class="w-full rounded-pildora border border-transparent bg-landing-claro-fondo py-1.5 pl-8 pr-3 font-interfaz text-[11px] text-landing-claro-texto outline-none placeholder:text-landing-claro-texto/55 focus-visible:border-landing-marca md:h-10 md:text-sm"
          />
        </form>
      }

      <nav class="ml-auto flex shrink-0 items-center gap-2 sm:gap-4" aria-label="Acceso a la cuenta">
        <a
          routerLink="/login"
          routerLinkActive="hidden"
          [routerLinkActiveOptions]="{ exact: true }"
          queryParamsHandling="preserve"
          class="font-interfaz text-[10px] font-bold uppercase tracking-wide text-landing-oscuro-texto transition-colors sm:text-[11px] lg:font-titulo lg:text-xl"
          [class.hover:text-landing-marca]="!enAuth()"
          [class.hover:text-marca-primaria]="enAuth() && modo() === 'jugador'"
          [class.hover:text-landing-acento]="enAuth() && modo() === 'empresa'"
        >
          Iniciar sesión
        </a>
        <a
          routerLink="/registro"
          routerLinkActive="hidden"
          [routerLinkActiveOptions]="{ exact: true }"
          queryParamsHandling="preserve"
          class="font-interfaz text-[10px] font-bold uppercase tracking-wide text-landing-oscuro-texto transition-colors sm:text-[11px] lg:font-titulo lg:text-xl"
          [class.hover:text-landing-marca]="!enAuth()"
          [class.hover:text-marca-primaria]="enAuth() && modo() === 'jugador'"
          [class.hover:text-landing-acento]="enAuth() && modo() === 'empresa'"
        >
          Registrarse
        </a>
      </nav>
    </header>
  `,
})
export class Header {
  protected readonly modo = injectModoAuth();

  /** Logo claro: el header siempre usa fondo oscuro (teal en jugador, marrón en empresa). */
  protected readonly urlLogo = urlLogoClaro;

  protected readonly termino = signal('');

  /**
   * Variante para las pantallas de autenticación (Login/Registro): resuelve los
   * colores a tokens por modo (jugador/empresa), agranda el logo en pantallas
   * chicas y oculta el buscador. Por defecto se mantiene el aspecto de la landing.
   */
  readonly enAuth = input(false);

  /** Emite el texto buscado al enviar el formulario (Enter). */
  readonly buscar = output<string>();

  protected buscarCampania(evento: Event): void {
    evento.preventDefault();
    const valor = this.termino().trim();
    if (valor) {
      this.buscar.emit(valor);
    }
  }
}
