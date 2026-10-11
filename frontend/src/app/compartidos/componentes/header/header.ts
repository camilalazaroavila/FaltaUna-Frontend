import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
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
      [class]="clasesTamanioHeader()"
      [class.bg-landing-oscuro-fondo]="!enAuth() || enSesion()"
      [class.bg-header-auth-fondo]="enAuth() && !enSesion()"
    >
      <a [routerLink]="enlaceLogo()" class="shrink-0" [attr.aria-label]="enlaceLogoAria()">
        <img
          [src]="urlLogo"
          alt=""
          class="w-auto object-contain"
          [class]="clasesLogo()"
          [class.brightness-0]="enAuth() && !enSesion() && modo() === 'empresa'"
          [class.invert]="enAuth() && !enSesion() && modo() === 'empresa'"
        />
      </a>

      @if (!enAuth() && !enSesion()) {
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
            placeholder="Buscá tu álbum preferido..."
            [value]="termino()"
            (input)="termino.set($any($event.target).value)"
            class="w-full rounded-pildora border border-transparent bg-landing-claro-fondo py-1.5 pl-8 pr-3 font-interfaz text-[11px] text-landing-claro-texto outline-none placeholder:text-landing-claro-texto/55 focus-visible:border-landing-marca md:h-10 md:text-sm"
          />
        </form>
      }

      @if (enSesion()) {
        <div class="relative ml-auto shrink-0">
          <button
            type="button"
            class="flex cursor-pointer items-center justify-center rounded-circulo border border-black/10 bg-marca-acento text-marca-sobre-acento shadow-sm transition hover:brightness-105"
            [class]="clasesBotonPerfil()"
            aria-label="Menú de perfil"
            [attr.aria-expanded]="menuAbierto()"
            (click)="alternarMenu()"
          >
            <svg
              class="size-5 sm:size-6"
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
              class="absolute top-full right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-fondo-hundido p-3 shadow-alta backdrop-blur-md"
            >
              <div class="mb-2 border-b border-white/10 pb-2">
                <p class="font-interfaz text-xs tracking-wide text-texto-apagado uppercase">
                  Sesión activa
                </p>
                <p class="truncate font-titulo text-sm text-marca-acento">
                  {{ nombreUsuario() || 'Usuario' }}
                </p>
              </div>
              <button
                type="button"
                class="w-full cursor-pointer rounded-lg bg-white/10 px-3 py-2 text-left font-interfaz text-xs font-bold text-white transition hover:bg-error/30 hover:text-white"
                (click)="cerrarSesion.emit()"
              >
                Cerrar sesión
              </button>
            </div>
          }
        </div>
      } @else {
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
      }
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

  /**
   * Variante "en sesión" (jugador logueado): oculta el buscador y los accesos de
   * Login/Registro, y muestra el botón de perfil con el menú de cerrar sesión.
   * Apagada por defecto: la landing y el auth conservan su comportamiento.
   */
  readonly enSesion = input(false);

  /**
   * Escala del header. `normal` = actual (landing/auth); `grande` agranda logo,
   * padding y el bloque de perfil para las vistas de contenido (Misiones).
   */
  readonly tamanio = input<'normal' | 'grande'>('normal');

  /** Destino del logo. La landing/auth apuntan a `/`; las vistas de jugador a su panel. */
  readonly enlaceLogo = input('/');

  /** Nombre a mostrar en el menú de perfil (solo en la variante `enSesion`). */
  readonly nombreUsuario = input('');

  /** Emite el texto buscado al enviar el formulario (Enter). */
  readonly buscar = output<string>();

  /** Emite al elegir "Cerrar sesión" en el menú de perfil (solo `enSesion`). */
  readonly cerrarSesion = output<void>();

  protected readonly menuAbierto = signal(false);

  protected readonly clasesTamanioHeader = computed(() =>
    this.tamanio() === 'grande' ? 'lg:px-10 lg:py-5' : '',
  );

  protected readonly clasesLogo = computed(() => {
    if (this.tamanio() === 'grande') return 'h-12 sm:h-14 lg:h-24';
    return this.enAuth() ? 'h-12 sm:h-14 lg:h-[75px]' : 'h-8 sm:h-9 lg:h-[75px]';
  });

  protected readonly clasesBotonPerfil = computed(() =>
    this.tamanio() === 'grande' ? 'size-11 sm:size-12' : 'size-9 sm:size-10',
  );

  protected readonly enlaceLogoAria = computed(() =>
    this.enSesion() ? 'Volver a Mi cuenta' : 'Falta Una, ir al inicio',
  );

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected buscarCampania(evento: Event): void {
    evento.preventDefault();
    const valor = this.termino().trim();
    if (valor) {
      this.buscar.emit(valor);
    }
  }
}
