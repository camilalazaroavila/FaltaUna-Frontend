import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'app-carrusel-marcas',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="contenedor-pista bg-landing-marcas-fondo py-3 md:py-5 lg:py-7"
      [ngClass]="animado() ? 'overflow-hidden' : 'franja-estatica overflow-x-auto'"
      aria-label="Marcas participantes"
    >
      <div class="contenedor-landing">
        <ul
          class="flex items-center"
          [ngClass]="animado() ? 'w-max mx-auto pista-animada' : 'w-full justify-between gap-0.5'"
          [style.--duracion.s]="duracionSegundos()"
        >
          @for (marca of marcas(); track $index) {
            <li class="flex items-center" [ngClass]="animado() ? 'px-6 md:px-10 lg:px-14' : 'px-0.5 shrink-0'">
              @if (marca.logoUrl) {
                <img
                  [src]="marca.logoUrl"
                  [alt]="marca.nombre"
                  class="h-8 w-auto rounded-[var(--radio-circulo)] md:h-14 lg:h-16"
                  loading="lazy"
                />
              } @else {
                <span
                  class="whitespace-nowrap font-titulo uppercase leading-none text-landing-claro-texto/80"
                  [ngClass]="
                    animado()
                      ? 'text-lg md:text-2xl lg:text-landing-wordmark'
                      : 'text-[10px] tracking-tighter min-[400px]:text-[11px] sm:text-xs md:text-2xl lg:text-3xl'
                  "
                >
                  {{ marca.nombre }}
                </span>
              }
            </li>
          }

          @if (animado()) {
            <!-- Copia decorativa para lograr el bucle continuo -->
            @for (marca of marcas(); track $index) {
              <li class="copia flex items-center px-6 md:px-10 lg:px-14" aria-hidden="true">
                @if (marca.logoUrl) {
                  <img [src]="marca.logoUrl" alt="" class="h-8 w-auto rounded-[var(--radio-circulo)] md:h-14 lg:h-16" loading="lazy" />
                } @else {
                  <span class="whitespace-nowrap font-titulo text-lg uppercase leading-none text-landing-claro-texto/80 md:text-2xl lg:text-landing-wordmark">
                    {{ marca.nombre }}
                  </span>
                }
              </li>
            }
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .pista-animada {
      animation: desplazar var(--duracion, 30s) linear infinite;
    }

    section:hover .pista-animada,
    section:focus-within .pista-animada {
      animation-play-state: paused;
    }

    @keyframes desplazar {
      to {
        transform: translateX(-50%);
      }
    }

    /* Franja estática: scroll manual solo como fallback en pantallas mínimas */
    .franja-estatica {
      scrollbar-width: none;
    }

    .franja-estatica::-webkit-scrollbar {
      display: none;
    }

    /* Con reduced-motion la pista deja de animarse pero sigue siendo usable:
       el overflow-hidden de Tailwind se revierte a scroll-x manual con la
       scrollbar oculta, para poder recorrer las marcas a mano. */
    @media (prefers-reduced-motion: reduce) {
      .contenedor-pista {
        overflow-x: auto !important;
        scrollbar-width: none;
      }

      .contenedor-pista::-webkit-scrollbar {
        display: none;
      }

      .pista-animada {
        animation: none;
      }

      .copia {
        display: none !important;
      }
    }
  `,
})
export class CarruselMarcas {
  readonly marcas = input.required<MarcaCarrusel[]>();

  /** Duración de una vuelta completa; más alto = más lento. */
  readonly duracionSegundos = input(30);

  /** `false` deja la franja estática, sin marquee ni copia decorativa. */
  readonly animado = input(true, { transform: booleanAttribute });
}

export interface MarcaCarrusel {
  nombre: string;
  /** Si no hay logo, el nombre se renderiza como wordmark tipográfico. */
  logoUrl?: string;
}
