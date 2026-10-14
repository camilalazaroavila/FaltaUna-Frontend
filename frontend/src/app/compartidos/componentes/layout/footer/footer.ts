import { NgClass } from '@angular/common';
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
 * Se organiza en bloques (marca, navegación y cuenta) más una franja inferior
 * con el copyright y el descargo. Toma el `modo` del contexto para elegir el
 * logo (claro sobre superficie oscura de jugador, oscuro sobre superficie clara
 * de empresa) y para arrastrar ese mismo modo al login/registro.
 *
 * Los colores usan exclusivamente tokens semánticos de landing (superficies
 * oscuras y claras ya definidas para la landing, independientes de data-modo):
 * el componente selecciona el juego de tokens que corresponde a su `modo`.
 *
 * El bloque de redes sociales y los enlaces legales/de ayuda se omiten a
 * propósito: todavía no existen URLs ni rutas reales (Open Decision).
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, NgClass],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  readonly modo = input<ModoAuth>('jugador');

  private readonly esEmpresa = computed(() => this.modo() === 'empresa');

  protected readonly urlLogo = computed(() =>
    this.esEmpresa() ? urlLogoOscuro : urlLogoClaro,
  );

  protected readonly anio = new Date().getFullYear();

  /** Superficie, texto y borde superior del pie según la landing. */
  protected readonly clasesPie = computed(() =>
    this.esEmpresa()
      ? 'border-t border-landing-claro-borde bg-landing-claro-superficie text-landing-claro-texto'
      : 'border-t border-landing-oscuro-borde bg-landing-oscuro-fondo text-landing-oscuro-texto',
  );

  /** Color de los textos secundarios (descripción, títulos y textos legales). */
  protected readonly clasesTextoTenue = computed(() =>
    this.esEmpresa() ? 'text-landing-claro-texto/75' : 'text-landing-oscuro-tenue',
  );

  /** Color del divisor de la franja inferior. */
  protected readonly claseBorde = computed(() =>
    this.esEmpresa() ? 'border-landing-claro-borde' : 'border-landing-oscuro-borde',
  );

  protected readonly descripcion =
    'La plataforma donde coleccionás cartas de tus marcas favoritas y ganás descuentos.';

  /** Descargo provisorio (pendiente de aprobación, Open Decision). */
  protected readonly descargo =
    'Falta Una es un proyecto académico desarrollado por estudiantes, sin fines comerciales. Las marcas, cupones y recompensas que se muestran son demostrativos.';

  protected readonly navegacion = computed<EnlaceFooter[]>(() =>
    this.esEmpresa()
      ? [
          { etiqueta: 'Inicio', ruta: '/empresa/landing' },
          { etiqueta: 'Modo usuario', ruta: '/' },
        ]
      : [
          { etiqueta: 'Inicio', ruta: '/' },
          { etiqueta: 'Modo empresa', ruta: '/empresa/landing' },
        ],
  );

  protected readonly cuenta = computed<EnlaceFooter[]>(() =>
    this.esEmpresa()
      ? [
          { etiqueta: 'Iniciar sesión', ruta: '/login', queryParams: { modo: 'empresa' } },
          { etiqueta: 'Registrarse', ruta: '/registro', queryParams: { modo: 'empresa' } },
        ]
      : [
          { etiqueta: 'Iniciar sesión', ruta: '/login' },
          { etiqueta: 'Registrarse', ruta: '/registro' },
        ],
  );
}
