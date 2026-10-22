import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AcordeonPregunta } from '@compartidos/componentes/landing/acordeon-preguntas/acordeon-preguntas';
import { CarruselMarcas, MarcaCarrusel } from '@compartidos/componentes/landing/carousel-marcas/carousel-marcas';
import { TeamSection } from '@compartidos/componentes/landing/team-section/team-section';
import { Header } from '@compartidos/componentes/layout/header/header';
import { Footer } from '@compartidos/componentes/layout/footer/footer';
import { PasoForma } from '@compartidos/componentes/landing/paso-forma/paso-forma';
import { INTEGRANTES_EQUIPO } from '@app/datos/landing-empresa.data';
import urlLogo from '@svgs/Imagotipo_claro.svg';

interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

interface PasoLanding {
  numero: number;
  forma: 1 | 2 | 3 ;
  imagenUrl: string;
  alt: string;
  texto: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    RouterLink,
    Header,
    CarruselMarcas,
    AcordeonPregunta,
    TeamSection,
    Footer,
    PasoForma,
  ],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  protected readonly urlLogo = urlLogo;

  protected readonly marcas: MarcaCarrusel[] = [
    { nombre: 'Levi\'s', logoUrl: '/imagenes/logos-landing/levis.png' },
    { nombre: 'Adidas', logoUrl: '/imagenes/logos-landing/adidas.png' },
    { nombre: 'Converse', logoUrl: '/imagenes/logos-landing/converse.png' },
    { nombre: 'Tommy', logoUrl: '/imagenes/logos-landing/tommy.png' },
    { nombre: 'McDonald\'s', logoUrl: '/imagenes/logos-landing/mcdonalds.png' },
    { nombre: 'Grido', logoUrl: '/imagenes/logos-landing/grido.png' },
  ];

  protected readonly pasosFunciona: PasoLanding[] = [
    {
      numero: 1,
      forma: 1,
      imagenUrl: '/imagenes/landing-usuario/2cartas.png',
      alt: 'Sobres diarios',
      texto: 'Abrí tus sobres diarios',
    },
    {
      numero: 2,
      forma: 2,
      imagenUrl: '/imagenes/landing-usuario/pelea.png',
      alt: 'Jugá para conseguir más sobres',
      texto: 'Jugá para conseguir más sobres',
    },
    {
      numero: 3,
      forma: 3,
      imagenUrl: '/imagenes/landing-usuario/libro abierta.png',
      alt: 'Coleccioná y completá álbumes',
      texto: 'Coleccioná y completá los álbumes',
    },
    {
      numero: 4,
      forma: 1,
      imagenUrl: '/imagenes/landing-usuario/regaloqr.png',
      alt: 'Canjeá en tus locales',
      texto: 'Canjeá en tus locales preferidos',
    },
  ];

  protected readonly pasosNegocio: PasoLanding[] = [
    {
      numero: 1,
      forma: 1,
      imagenUrl: '/imagenes/landing-usuario/libros.png',
      alt: 'Creá tu álbum',
      texto: 'Creá tu álbum',
    },
    {
      numero: 2,
      forma: 2,
      imagenUrl: '/imagenes/landing-usuario/metricas.png',
      alt: 'Mirá tus estadísticas',
      texto: 'Mirá tus estadísticas',
    },
    {
      numero: 3,
      forma: 3,
      imagenUrl: '/imagenes/landing-usuario/globitos.png',
      alt: 'Aumentá la publicidad de tu negocio',
      texto: 'Aumentá la publicidad de tu negocio',
    },
    {
      numero: 4,
      forma: 1,
      imagenUrl: '/imagenes/landing-usuario/mercadito.png',
      alt: 'Más usuarios, más clientes',
      texto: 'Más usuarios, más clientes',
    },
  ];

  protected readonly preguntas: PreguntaFrecuente[] = [
    {
      pregunta: '¿Qué es Falta Una?',
      respuesta:
        'La plataforma donde coleccionás cartas de tus marcas favoritas y ganás descuentos.',
    },
    {
      pregunta: '¿Qué es el sobre diario?',
      respuesta:
        'Un sobre gratuito que podés abrir una vez por día para seguir completando tu álbum.',
    },
    {
      pregunta: '¿Necesito pagar para jugar?',
      respuesta: 'No. Crear tu cuenta y abrir el sobre diario es gratuito.',
    },
    {
      pregunta: '¿Cómo consigo las cartas?',
      respuesta:
        'Abriendo sobres y completando misiones. Cada acción suma chances de cartas nuevas.',
    },
    {
      pregunta: '¿Puedo intercambiar las cartas?',
      respuesta:
        'Sí. Cambiá tus repetidas con otros coleccionistas y conseguí las que te faltan.',
    },
    {
      pregunta: '¿Cómo canjeo un cupón?',
      respuesta:
        'Elegí el cupón de una marca y mostralo en el local para que validen el canje.',
    },
  ];

  protected readonly equipo = INTEGRANTES_EQUIPO;
}
