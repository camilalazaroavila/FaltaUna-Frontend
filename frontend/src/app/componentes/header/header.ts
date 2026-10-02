import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="encabezado">
      <a routerLink="/" class="encabezado__logo" aria-label="Falta Una, ir al inicio">
        <img src="assets/logo-falta-una.svg" alt="" width="56" height="56" />
      </a>

      <form class="encabezado__buscador" role="search" (submit)="buscarCampania($event)">
        <label class="solo-lectores" for="buscador-campania">Buscar campaña</label>
        <svg
          class="encabezado__lupa"
          viewBox="0 0 24 24"
          width="22"
          height="22"
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
        />
      </form>

      <nav class="encabezado__acciones" aria-label="Acceso a la cuenta">
        <a routerLink="/iniciar-sesion">Iniciar sesión</a>
        <a routerLink="/registro">Registrarse</a>
      </nav>
    </header>
  `,
  styles: `
    :host {
      display: block;
    }

    .encabezado {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      border-radius: var(--radio-lg);
      background: var(--superficie);
      color: var(--texto);
      box-shadow: var(--sombra-media);
    }

    .encabezado__logo {
      display: inline-flex;
      flex-shrink: 0;
      border-radius: var(--radio-md);
    }

    .encabezado__buscador {
      position: relative;
      flex: 0 1 20rem;
      margin-inline-end: auto;
    }

    .encabezado__lupa {
      position: absolute;
      inset-inline-start: 0.75rem;
      top: 50%;
      translate: 0 -50%;
      color: var(--texto-sobre-tarjeta);
      pointer-events: none;
    }

    .encabezado__buscador input {
      width: 100%;
      padding: 0.6rem 1rem 0.6rem 2.6rem;
      border: 0;
      border-radius: var(--radio-pildora);
      background: var(--tarjeta);
      color: var(--texto-sobre-tarjeta);
      font-family: system-ui, sans-serif;
      font-size: 0.9rem;
    }

    .encabezado__acciones {
      display: flex;
      gap: 1.5rem;
    }

    .encabezado__acciones a {
      font-family: 'Russo One', system-ui, sans-serif;
      font-size: 0.95rem;
      color: var(--texto);
      text-decoration: none;
      padding: 0.25rem 0.125rem;
      border-radius: var(--radio-sm);
    }

    .encabezado__acciones a:hover {
      color: var(--marca);
    }

    :is(a, input):focus-visible {
      outline: 3px solid var(--marca);
      outline-offset: 3px;
    }

    .solo-lectores {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    @media (max-width: 640px) {
      .encabezado {
        flex-wrap: wrap;
        padding: 0.75rem 1rem;
      }
      .encabezado__buscador {
        order: 3;
        flex: 1 1 100%;
      }
      .encabezado__acciones {
        gap: 1rem;
      }
    }
  `,
})
export class Header {
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