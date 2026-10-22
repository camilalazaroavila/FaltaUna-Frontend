import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

@Component({
  selector: 'app-carrusel-marcas',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="contenedor-pista bg-landing-marcas-fondo py-4 md:py-6 lg:py-8"
      [ngClass]="animado() ? 'overflow-hidden' : 'franja-estatica overflow-x-auto'"
      aria-label="Marcas participantes"
    >
      <div class="contenedor-landing">
        <ul
          class="flex items-center"
          [ngClass]="animado() ? 'w-max mx-auto pista-animada' : 'w-full justify-between gap-4'"
          [style.--duracion.s]="duracionSegundos()"
        >
          @for (marca of marcas(); track $index) {
            <li class="flex items-center px-8 sm:px-10 md:px-12 lg:px-16 shrink-0">
              @if (marca.logoUrl) {
                <img
                  [src]="marca.logoUrl"
                  [alt]="marca.nombre"
                  class="h-9 w-auto object-contain sm:h-11 md:h-14 lg:h-16 max-w-[140px] md:max-w-[190px] lg:max-w-[240px]"
                  loading="lazy"
                />
              } @else {
                <span
                  class="whitespace-nowrap font-titulo uppercase leading-none text-landing-claro-texto/80"
                  [ngClass]="
                    animado()
                      ? 'text-xl md:text-2xl lg:text-landing-wordmark'
                      : 'text-xs md:text-2xl lg:text-3xl'
                  "
                >
                  {{ marca.nombre }}
                </span>
              }
            </li>
          }

          @if (animado()) {
            <!-- Copia decorativa para lograr el bucle continuo idéntico -->
            @for (marca of marcas(); track $index) {
              <li class="copia flex items-center px-8 sm:px-10 md:px-12 lg:px-16 shrink-0" aria-hidden="true">
                @if (marca.logoUrl) {
                  <img
                    [src]="marca.logoUrl"
                    alt=""
                    class="h-9 w-auto object-contain sm:h-11 md:h-14 lg:h-16 max-w-[140px] md:max-w-[190px] lg:max-w-[240px]"
                    loading="lazy"
                  />
                } @else {
                  <span class="whitespace-nowrap font-titulo text-xl uppercase leading-none text-landing-claro-texto/80 md:text-2xl lg:text-landing-wordmark">
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
