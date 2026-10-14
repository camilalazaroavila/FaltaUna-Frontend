import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModoAuth } from '@compartidos/componentes/layout/auth-layout/auth-modo';
import urlLogoClaro from '@svgs/Imagotipo_claro.svg';
import urlLogoOscuro from '@svgs/Imagotipo_Alt.svg';

interface EnlaceFooter {
  etiqueta: string;
  ruta: string;
  queryParams?: Record<string, string>;
}

/**
 * Pie de página compartido por las landings pública y de empresa.
 *
 * Toma el `modo` del contexto para elegir el logo (claro sobre superficie
 * oscura de jugador, oscuro sobre superficie clara de empresa) y para arrastrar
 * ese mismo modo al login/registro. Los colores usan tokens semánticos de rol,
 * así que se adaptan solos al `[data-modo]` que lo contiene.
 *
 * El bloque de redes sociales se omite a propósito hasta contar con URLs reales
 * (Open Decision).
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly modo = input<ModoAuth>('jugador');

  protected readonly urlLogo = computed(() =>
    this.modo() === 'empresa' ? urlLogoOscuro : urlLogoClaro,
  );

  protected readonly anio = new Date().getFullYear();

  protected readonly enlaces = computed<EnlaceFooter[]>(() => {
    if (this.modo() === 'empresa') {
      return [
        { etiqueta: 'Inicio', ruta: '/' },
        { etiqueta: 'Iniciar sesión', ruta: '/login', queryParams: { modo: 'empresa' } },
        { etiqueta: 'Registrarse', ruta: '/registro', queryParams: { modo: 'empresa' } },
      ];
    }

    return [
      { etiqueta: 'Inicio', ruta: '/' },
      { etiqueta: 'Modo empresa', ruta: '/empresa/landing' },
      { etiqueta: 'Iniciar sesión', ruta: '/login' },
      { etiqueta: 'Registrarse', ruta: '/registro' },
    ];
  });
}
