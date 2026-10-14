import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { AcordeonPregunta } from '@compartidos/componentes/landing/acordeon-preguntas/acordeon-preguntas';
import { CarruselMarcas, MarcaCarrusel } from '@compartidos/componentes/landing/carousel-marcas/carousel-marcas';
import { TeamSection } from '@compartidos/componentes/landing/team-section/team-section';
import { Header } from '@compartidos/componentes/layout/header/header';
import { Footer } from '@compartidos/componentes/layout/footer/footer';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { IlustracionTienda } from '@compartidos/ilustraciones/ilustracion-tienda/ilustracion-tienda';
import { INTEGRANTES_EQUIPO } from '@app/datos/landing-empresa.data';
import urlCartaRara from '@svgs/CartaRara.svg';
import urlEpicarta from '@svgs/Epicarta.svg';
import urlUnicarta from '@svgs/Unicarta.svg';
import urlLogo from '@svgs/Imagotipo_Alt.svg';
import urlSobre from '@svgs/PaqueteHuh.svg';
import urlSobreCentro from '@svgs/Paquete1.svg';
import urlSobreDerecha from '@svgs/Paquete2.svg';
import urlSobreIzquierda from '@svgs/PaqueteHuh.svg';

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

/**
 * Landing pública de Falta Una (ruta raíz `''`).
 *
 * Superficies alternadas oscuro/crema, mobile-first y sin lógica de negocio.
 * Reutiliza `Header`, `CarruselMarcas`, `AcordeonPregunta`, `Boton` e
 * `IlustracionTienda`, y consume solo tokens semánticos de landing.
 */
@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, NgIcon, Header, CarruselMarcas, AcordeonPregunta, TeamSection, Footer, Boton, IlustracionTienda],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  protected readonly urlLogo = urlLogo;
  protected readonly urlCartaIzquierda = urlCartaRara;
  protected readonly urlCartaCentro = urlUnicarta;
  protected readonly urlCartaDerecha = urlEpicarta;
  protected readonly urlSobre = urlSobre;

  /** Abanico apaisado del hero: sobre izquierdo, central y derecho. */
  protected readonly urlSobreIzquierda = urlSobreIzquierda;
  protected readonly urlSobreCentro = urlSobreCentro;
  protected readonly urlSobreDerecha = urlSobreDerecha;

  /**
   * Marcas sin asset de logo: se muestran como wordmark tipográfico.
   * Al contar con cada SVG real basta con poblarla `logoUrl` sin tocar el resto.
   */
  protected readonly marcas: MarcaCarrusel[] = [
    { nombre: 'Levi\'s' },
    { nombre: 'Adidas' },
    { nombre: 'Converse' },
    { nombre: 'Tommy' },
    { nombre: 'McDonald\'s' },
    { nombre: 'Grido' },
  ];

  protected readonly pasos: string[] = [
    'Registrate y empezá tu colección.',
    'Abrí tu sobre diario y descubrí cartas nuevas.',
    'Intercambiá repetidas y completá tu álbum.',
    'Canjeá recompensas en tus marcas favoritas.',
  ];

  protected readonly beneficios: string[] = [
    'Publicá tu colección de cartas personalizada.',
    'Ofrecé cupones y llegá a más coleccionistas.',
    'Gestioná tu campaña desde un panel propio.',
    'Medí el impacto de tus campañas.',
  ];

  protected readonly preguntas: PreguntaFrecuente[] = [
    {
      pregunta: '¿Qué es Falta Una?',
      respuesta:
        'La plataforma donde coleccionás cartas de tus marcas favoritas y ganás descuentos.',
    },
    {
      pregunta: '¿Cómo consigo cartas?',
      respuesta: 'Abriendo sobres y completando misiones. Cada acción suma chances de cartas nuevas.',
    },
    {
      pregunta: '¿Qué es el sobre diario?',
      respuesta: 'Un sobre gratuito que podés abrir una vez por día para seguir completando tu álbum.',
    },
    {
      pregunta: '¿Puedo intercambiar cartas?',
      respuesta: 'Sí. Cambiá tus repetidas con otros coleccionistas y conseguí las que te faltan.',
    },
    {
      pregunta: '¿Qué hago con las repetidas?',
      respuesta: 'Pueden servirte para intercambiar o para canjear recompensas dentro de la app.',
    },
    {
      pregunta: '¿Cómo canjeo un cupón?',
      respuesta: 'Elegí el cupón de una marca y mostralo en el local para que validen el canje.',
    },
    {
      pregunta: '¿Necesito pagar para jugar?',
      respuesta: 'No. Crear tu cuenta y abrir el sobre diario es gratuito.',
    },
    {
      pregunta: '¿Cómo sumo mi negocio?',
      respuesta: 'Creá una cuenta de empresa, publicá tu colección y empezá a ofrecer cupones.',
    },
  ];

  /** Integrantes del equipo con su foto; compartidos con la landing de empresa. */
  protected readonly equipo = INTEGRANTES_EQUIPO;
}
