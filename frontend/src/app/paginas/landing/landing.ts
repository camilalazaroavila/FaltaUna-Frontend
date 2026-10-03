import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { AcordeonPregunta } from '../../componentes/acordeon-preguntas/acordeon-preguntas';
import { CarruselMarcas, MarcaCarrusel } from '../../componentes/carousel-marcas/carousel-marcas';
import { Header } from '../../componentes/header/header';
import { Boton } from '../../compartidos/componentes/boton/boton';
import { IlustracionTienda } from '../../compartidos/ilustraciones/ilustracion-tienda/ilustracion-tienda';
import urlCartaRara from '../../compartidos/SVGs/CartaRara.svg';
import urlEpicarta from '../../compartidos/SVGs/Epicarta.svg';
import urlUnicarta from '../../compartidos/SVGs/Unicarta.svg';
import urlLogo from '../../compartidos/SVGs/Imagotipo_Alt.svg';
import urlSobre from '../../compartidos/SVGs/PaqueteHuh.svg';
import urlSobreCentro from '../../compartidos/SVGs/Paquete1.svg';
import urlSobreDerecha from '../../compartidos/SVGs/Paquete2.svg';
import urlSobreIzquierda from '../../compartidos/SVGs/PaqueteHuh.svg';

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

interface IntegranteEquipo {
  nombre: string;
  /** Foto opcional; si no existe se usan las iniciales como fallback. */
  avatarUrl?: string;
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
  imports: [RouterLink, NgIcon, Header, CarruselMarcas, AcordeonPregunta, Boton, IlustracionTienda],
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
    'Registrate y sumate a un partido cerca tuyo.',
    'Confirmá tu asistencia y jugá con la comunidad.',
    'Abrí tu sobre diario y descubrí cartas nuevas.',
    'Intercambiá repetidas y completá tu álbum.',
  ];

  protected readonly beneficios: string[] = [
    'Publicá tus canchas y torneos en minutos.',
    'Ofrecé cupones y llegá a más jugadores.',
    'Gestioná reservas desde un panel propio.',
    'Medí el impacto de tus campañas.',
  ];

  protected readonly preguntas: PreguntaFrecuente[] = [
    {
      pregunta: '¿Qué es Falta Una?',
      respuesta:
        'La plataforma donde organizás partidos de fútbol amateur y coleccionás cartas de tus marcas favoritas.',
    },
    {
      pregunta: '¿Cómo consigo cartas?',
      respuesta: 'Jugando partidos y abriendo sobres. Cada partido confirmado suma chances de cartas nuevas.',
    },
    {
      pregunta: '¿Qué es el sobre diario?',
      respuesta: 'Un sobre gratuito que podés abrir una vez por día para seguir completando tu álbum.',
    },
    {
      pregunta: '¿Puedo intercambiar cartas?',
      respuesta: 'Sí. Cambiá tus repetidas con otros jugadores y conseguí las que te faltan.',
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
      respuesta: 'No. Crear tu cuenta, buscar partidos y abrir el sobre diario es gratuito.',
    },
    {
      pregunta: '¿Cómo sumo mi negocio?',
      respuesta: 'Creá una cuenta de empresa, publicá tus canchas y empezá a ofrecer cupones.',
    },
  ];

  /** `avatarUrl` queda preparado para cuando existan las fotos del equipo. */
  protected readonly equipo: IntegranteEquipo[] = [
    { nombre: 'Juli' },
    { nombre: 'Mateo C' },
    { nombre: 'Gonza' },
    { nombre: 'Mateo' },
    { nombre: 'Cami' },
    { nombre: 'Joaco' },
    { nombre: 'Tori' },
  ];

  protected iniciales(nombre: string): string {
    return nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join('');
  }
}
