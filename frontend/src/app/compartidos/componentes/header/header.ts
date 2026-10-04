import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import urlLogo from '../../SVGs/Imagotipo_claro.svg';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      class="flex items-center gap-2 bg-landing-oscuro-fondo px-3 py-2 text-landing-oscuro-texto sm:gap-4 sm:px-4 rounded-md shadow-md m-5 lg:gap-6 lg:rounded-2xl lg:px-8 lg:py-3"
    >
      <a routerLink="/" class="shrink-0" aria-label="Falta Una, ir al inicio">
        <img [src]="urlLogo" alt="" class="h-8 w-auto sm:h-9 lg:h-[75px]" />
      </a>

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

      <nav class="flex shrink-0 items-center gap-2 sm:gap-4 md:ml-auto" aria-label="Acceso a la cuenta">
        <a
          routerLink="/login"
          class="font-interfaz text-[10px] font-bold uppercase tracking-wide text-landing-oscuro-texto transition-colors hover:text-landing-marca sm:text-[11px] lg:font-titulo lg:text-xl"
        >
          Iniciar sesión
        </a>
        <a
          routerLink="/registro"
          class="font-interfaz text-[10px] font-bold uppercase tracking-wide text-landing-oscuro-texto transition-colors hover:text-landing-marca sm:text-[11px] lg:font-titulo lg:text-xl"
        >
          Registrarse
        </a>
      </nav>
    </header>
  `,
})
export class Header {
  protected readonly urlLogo = urlLogo;
  protected readonly termino = signal('');

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
