import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Ilustración de tienda/local para la landing.
 *
 * No existe un asset de tienda en el repositorio, así que se dibuja simple y
 * sólida: toldo trapezoidal con banda de marca, cuerpo y vanos. Consume
 * `currentColor` (estructura) y tokens semánticos (acento y vanos), sin hex
 * propios (regla de oro).
 */
@Component({
  selector: 'app-ilustracion-tienda',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="h-auto w-full"
      viewBox="0 0 120 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <!-- Cuerpo -->
      <rect x="20" y="40" width="80" height="66" rx="3" fill="currentColor" />
      <!-- Toldo -->
      <path d="M8 40 22 16h76l14 24H8Z" fill="currentColor" />
      <!-- Banda ondulada del toldo -->
      <path
        d="M8 40h104v5a8.67 8.67 0 0 1-17.33 0 8.67 8.67 0 0 1-17.34 0 8.67 8.67 0 0 1-17.33 0 8.67 8.67 0 0 1-17.34 0 8.67 8.67 0 0 1-17.33 0 8.67 8.67 0 0 1-17.33 0Z"
        fill="var(--landing-marca)"
      />
      <!-- Puerta y ventanas -->
      <rect x="50" y="66" width="22" height="40" rx="2" fill="var(--landing-claro-fondo)" />
      <rect x="27" y="54" width="16" height="14" rx="1.5" fill="var(--landing-claro-fondo)" />
      <rect x="77" y="54" width="16" height="14" rx="1.5" fill="var(--landing-claro-fondo)" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class IlustracionTienda {}
