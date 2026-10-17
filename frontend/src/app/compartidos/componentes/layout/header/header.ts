import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { injectModoAuth } from '@compartidos/componentes/layout/auth-layout/auth-modo';
import { AuthService } from '@servicios/auth.service';
import urlLogoClaro from '@svgs/Imagotipo_claro.svg';
import urlLogoAlt from '@svgs/Imagotipo_Negro.svg'; // NUEVO

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  
  host: { class: 'block' },
  template: `
    @if (logueado()) {
      <!-- VARIANTE LOGUEADO: sin cambios -->
      <header class="relative z-40 m-5">
        <div
          class="flex items-center justify-between gap-2 rounded-md bg-landing-oscuro-fondo px-3 py-2 text-landing-oscuro-texto shadow-md sm:gap-4 sm:px-4 lg:gap-6 lg:rounded-2xl lg:px-8 lg:py-3"
        >
          <a
            [routerLink]="destinoLogo()"
            class="flex shrink-0 items-center"
            aria-label="Ir al inicio de Falta Una"
          >
            <img [src]="urlLogo" alt="Falta Una" class="h-8 w-auto sm:h-9 lg:h-[75px]" />
          </a>

          <div class="relative shrink-0">
            <button
              type="button"
              (click)="toggleMenuUsuario()"
              class="flex size-9 cursor-pointer items-center justify-center rounded-circulo shadow-sm transition hover:brightness-105 hover:scale-105 sm:size-10 2xl:size-14"
              aria-label="Menú de perfil"
              [attr.aria-expanded]="menuUsuarioAbierto()"
            >
              <svg
                class="size-15 --landing-claro-texto sm:size-10 2xl:size-10"
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

            @if (menuUsuarioAbierto()) {
              <div
                class="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/10 bg-[#072428] p-3 shadow-alta backdrop-blur-md 2xl:w-72 2xl:p-4"
              >
                <div class="mb-2 border-b border-white/10 pb-2">
                  <p class="font-interfaz text-xs uppercase tracking-wide text-texto-apagado 2xl:text-sm">
                    Sesión activa
                  </p>
                  <p class="truncate font-titulo text-sm text-marca-acento 2xl:text-lg">
                    {{ nombreUsuario() }}
                  </p>
                </div>
                <button
                  type="button"
                  (click)="cerrarSesion()"
                  class="w-full cursor-pointer rounded-lg bg-white/10 px-3 py-2 text-left font-interfaz text-xs font-bold text-white transition hover:bg-error/30 hover:text-white 2xl:py-3 2xl:text-base"
                >
                  Cerrar sesión
                </button>
              </div>
            }
          </div>
        </div>
      </header>
    } @else {
      <!-- VARIANTES PÚBLICA (landing, opcionalmente amarilla) Y AUTH (login/registro) -->
      <header
        class="m-5 flex items-center gap-2 rounded-md px-3 py-2 shadow-md sm:gap-4 sm:px-4 lg:gap-6 lg:rounded-2xl lg:px-8 lg:py-3"
        [class.bg-landing-oscuro-fondo]="!enAuth() && !fondoAmarillo()"
        [class.bg-marca-acento]="fondoAmarillo()"
        [class.bg-header-auth-fondo]="enAuth()"
        [class.text-landing-oscuro-texto]="!fondoAmarillo()"
        [class.text-black]="fondoAmarillo()"
      >
        <a [routerLink]="destinoLogo()" class="shrink-0" aria-label="Falta Una, ir al inicio">
          <img
            [src]="fondoAmarillo() ? urlLogoOscuro : urlLogo"
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

        <nav class="ml-auto flex shrink-0 items-center gap-2 sm:gap-4" aria-label="Acceso a la cuenta">
          <a
            routerLink="/login"
            routerLinkActive="hidden"
            [routerLinkActiveOptions]="{ exact: true }"
            queryParamsHandling="preserve"
            class="font-interfaz text-[10px] font-bold uppercase tracking-wide transition-colors sm:text-[11px] lg:font-titulo lg:text-xl"
            [class.text-landing-oscuro-texto]="!fondoAmarillo()"
            [class.text-black]="fondoAmarillo()"
            [class.hover:text-landing-marca]="!enAuth() && !fondoAmarillo()"
            [class.hover:text-landing-oscuro-fondo]="fondoAmarillo()"
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
            class="font-interfaz text-[10px] font-bold uppercase tracking-wide transition-colors sm:text-[11px] lg:font-titulo lg:text-xl"
            [class.text-landing-oscuro-texto]="!fondoAmarillo()"
            [class.text-black]="fondoAmarillo()"
            [class.hover:text-landing-marca]="!enAuth() && !fondoAmarillo()"
            [class.hover:text-landing-oscuro-fondo]="fondoAmarillo()"
            [class.hover:text-marca-primaria]="enAuth() && modo() === 'jugador'"
            [class.hover:text-landing-acento]="enAuth() && modo() === 'empresa'"
          >
            Registrarse
          </a>
        </nav>
      </header>
    }
  `,
})
export class Header {
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  protected readonly modo = injectModoAuth();

  /** Logo claro: para fondos oscuros (teal en jugador, marrón en empresa). */
  protected readonly urlLogo = urlLogoClaro;

  /** NUEVO: logo oscuro, para el header amarillo de la landing. */
  protected readonly urlLogoOscuro = urlLogoAlt;

  protected readonly termino = signal('');

  /** Variante para Login/Registro. */
  readonly enAuth = input(false);

  /** Variante con sesión iniciada. Ignora `enAuth`. */
  readonly logueado = input(false);

  /** NUEVO: header amarillo con texto y logo negros. Solo se usa en la landing. */
  readonly amarillo = input(false);

  /** NUEVO: el amarillo nunca se aplica en las vistas de auth. */
  protected readonly fondoAmarillo = computed(() => this.amarillo() && !this.enAuth());

  readonly enlaceLogo = input<string | null>(null);

  protected readonly destinoLogo = computed(
    () => this.enlaceLogo() ?? (this.logueado() ? '/usuario' : '/'),
  );

  readonly buscar = output<string>();

  protected readonly menuUsuarioAbierto = signal(false);

  private authService: AuthService | null = null;
  private obtenerAuth(): AuthService {
    return (this.authService ??= this.injector.get(AuthService));
  }

  protected readonly nombreUsuario = computed(() =>
    this.logueado() ? (this.obtenerAuth().usuarioActual()?.nombreUsuario ?? 'Usuario') : '',
  );

  protected buscarCampania(evento: Event): void {
    evento.preventDefault();
    const valor = this.termino().trim();
    if (valor) {
      this.buscar.emit(valor);
    }
  }

  protected toggleMenuUsuario(): void {
    this.menuUsuarioAbierto.update((abierto) => !abierto);
  }

  protected cerrarSesion(): void {
    this.menuUsuarioAbierto.set(false);
    this.obtenerAuth().logout();
    this.router.navigate(['/login']);
  }
}