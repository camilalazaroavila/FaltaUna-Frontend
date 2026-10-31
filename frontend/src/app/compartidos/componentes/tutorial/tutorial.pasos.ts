import type { PasoTutorial } from './tutorial.model';

/**
 * Guion del tutorial guiado.
 *
 * Los textos son un borrador en voseo rioplatense y quedan sujetos a la
 * revisión de copy del equipo. Los pasos con `espera` no dejan avanzar hasta
 * que el jugador hace la acción pedida en el tablero.
 */
export const PASOS_TUTORIAL: readonly PasoTutorial[] = [
  {
    titulo: 'Tu primera ronda',
    texto:
      'Vas a jugar una ronda guiada contra el bot. Te muestro el tablero y después jugás una carta de verdad.',
    pista: 'Podés salir del tutorial cuando quieras.',
  },
  {
    ancla: 'cupones',
    titulo: 'Los cupones',
    texto:
      'Arriba de tu mano están los cupones de la ronda. Cada carta cuesta cupones y cada ronda te dan más.',
    pista: 'En esta práctica arrancás con 3 cupones.',
  },
  {
    ancla: 'mano',
    titulo: 'Tu mano',
    texto: 'Estas son las cartas que podés jugar. Tocá una para ver su detalle.',
    pista: 'Las cartas se reparten en abanico y se inclinan según su posición.',
  },
  {
    ancla: 'carta-mano',
    titulo: 'Costo y poder',
    texto:
      'El número de la izquierda es el costo en cupones; el de la derecha, el poder que aporta a la zona.',
    espera: 'carta-vista',
    pista: 'Tocá una carta de tu mano para verla.',
  },
  {
    ancla: 'zonas',
    titulo: 'Las dos zonas',
    texto:
      'Hay una zona a la izquierda y otra a la derecha. Cada una tiene un local y un efecto que puede subir o bajar el poder de algunas categorías.',
  },
  {
    ancla: 'slots-propios',
    titulo: 'Dónde bajar cartas',
    texto:
      'Arrastrá una carta a un slot libre de tu lado. También podés seleccionarla con Espacio y tocar el botón de la casilla.',
    pista: 'Los slots resaltados son los que están libres.',
  },
  {
    ancla: 'zona-izquierda',
    titulo: 'Jugá una carta',
    texto:
      'Bajá una carta a la zona izquierda. Fijate cómo se suma su poder al marcador.',
    espera: 'carta-jugada',
    pista: 'Arrastrá la carta o usá el botón de la casilla resaltada.',
  },
  {
    ancla: 'control-turno',
    titulo: 'Cerrá la ronda',
    texto:
      'Cuando termines, tocá Realizar. El bot revela su carta y se comparan los puntos de cada zona.',
    espera: 'turno-finalizado',
    pista: 'El botón muestra el número de ronda: 1/6.',
  },
  {
    titulo: '¡Listo!',
    texto:
      'Ya conocés lo básico: cupones, mano, zonas y cierre de ronda. Ahora podés practicar contra el bot.',
    pista: 'Podés volver a este tutorial cuando quieras.',
  },
];

/** Paso que muestra la galería de componentes, sin partida real. */
export const PASO_VISTA_PREVIA: PasoTutorial = PASOS_TUTORIAL[1];
