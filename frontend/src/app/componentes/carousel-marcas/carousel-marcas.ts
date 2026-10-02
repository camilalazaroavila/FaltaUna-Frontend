import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-carrusel-marcas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="carrusel" aria-label="Marcas participantes">
      <ul class="carrusel__pista" [style.--duracion.s]="duracionSegundos()">
        @for (marca of marcas(); track marca.nombre) {
          <li>
            <img [src]="marca.logoUrl" [alt]="marca.nombre" height="40" loading="lazy" />
          </li>
        }
        <!-- Copia decorativa para lograr el bucle continuo -->
        @for (marca of marcas(); track marca.nombre) {
          <li class="carrusel__copia" aria-hidden="true">
            <img [src]="marca.logoUrl" alt="" height="40" loading="lazy" />
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .carrusel {
      overflow: hidden;
      padding-block: 1.25rem;
      background: var(--acento);
      mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
    }

    .carrusel__pista {
      display: flex;
      align-items: center;
      width: max-content;
      margin: 0;
      padding: 0;
      list-style: none;
      animation: desplazar var(--duracion, 30s) linear infinite;
    }

    .carrusel:hover .carrusel__pista,
    .carrusel:focus-within .carrusel__pista {
      animation-play-state: paused;
    }

    .carrusel__pista li {
      display: flex;
      align-items: center;
      padding-inline: 2rem;
    }

    .carrusel__pista img {
      height: 2.5rem;
      width: auto;
      filter: grayscale(1);
      opacity: 0.85;
    }

    @keyframes desplazar {
      to {
        transform: translateX(-50%);
      }
    }

    /* Sin movimiento: lista estática y desplazable con scroll horizontal */
    @media (prefers-reduced-motion: reduce) {
      .carrusel {
        overflow-x: auto;
        mask-image: none;
      }
      .carrusel__pista {
        animation: none;
      }
      .carrusel__copia {
        display: none !important;
      }
    }
  `,
})
export class CarruselMarcas {
  readonly marcas = input.required<MarcaCarrusel[]>();

  /** Duración de una vuelta completa; más alto = más lento. */
  readonly duracionSegundos = input(30);
}
export interface MarcaCarrusel {
  nombre: string;
  logoUrl: string;
}