import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModoAuth } from '@compartidos/componentes/layout/auth-layout/auth-modo';
import urlLogoClaro from '@svgs/Imagotipo_claro.svg';
import urlLogoEmpresa from '@svgs/Imagotipo_Empresa.svg';

/** TODO: reemplazar por la URL real del Instagram de Falta Una. */
const URL_INSTAGRAM = 'https://www.instagram.com/falta__una/';

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
 * logo (claro sobre superficie oscura de jugador, Imagotipo_Empresa sobre superficie
 * crema clara de empresa) y para arrastrar ese mismo modo al login/registro.
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
    this.esEmpresa() ? urlLogoEmpresa : urlLogoClaro,
  );

  protected readonly urlInstagram = URL_INSTAGRAM;

  protected readonly anio = new Date().getFullYear();

  /** Superficie y texto del pie según la landing (sin borde superior por tener ondas decorativas). */
  protected readonly clasesPie = computed(() =>
    this.esEmpresa()
      ? 'bg-[#FCEFE0] text-[#0A2E36]'
      : 'bg-landing-oscuro-fondo text-landing-oscuro-texto',
  );

  /** Color de los textos secundarios (descripción, títulos y textos legales). */
  protected readonly clasesTextoTenue = computed(() =>
    this.esEmpresa() ? 'text-[#3D555A]' : 'text-landing-oscuro-tenue',
  );

  /** Color del divisor de la franja inferior (mantiene únicamente la línea divisoria del copyright). */
  protected readonly claseBorde = computed(() =>
    this.esEmpresa() ? 'border-[#E3CEB5]' : 'border-landing-oscuro-borde',
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
