import type { PasoTutorial } from './tutorial.model';

/**
 * Guion del tutorial guiado, narrado por Jaime (mayordomo: formal y simpático).
 * Los textos son un borrador a aprobar en voseo, sujetos a la revisión de copy del equipo.
 * Los pasos con `espera` no dejan avanzar hasta que el jugador hace la acción.
 */
export const PASOS_TUTORIAL: readonly PasoTutorial[] = [
  {
    pose: 'si',
    titulo: '¡Bienvenido a Falta Una!',
    texto:
      'Soy Jaime, a tu servicio. Te voy a guiar en esta primera ronda contra el bot para que aprendas a jugar. Primero te muestro el tablero y después jugás una carta de verdad.',
    pista: 'Podés salir del tutorial cuando quieras.',
  },
  {
    ancla: 'cupones',
    titulo: 'Los cupones',
    texto:
      'Cada carta cuesta cupones para jugarla. Ahora tenés 3, y en cada ronda vas a recibir más. Usalos con criterio.',
    pista: 'En esta práctica arrancás con 3 cupones.',
  },
  {
    ancla: 'mano',
    titulo: 'Tu mano',
    texto: 'Estas son tus cartas, acomodadas en abanico. Tocá una para verla de cerca.',
    pista: 'Las cartas se inclinan según su posición en la mano.',
  },
  {
    ancla: 'carta-mano',
    titulo: 'Costo y poder',
    texto:
      'Fijate en los números: el de la izquierda es el costo en cupones; el de la derecha, el poder que sumás a la zona. Tocá una carta para mirarla.',
    espera: 'carta-vista',
    pista: 'Tocá una carta de tu mano para verla.',
  },
  {
    ancla: 'zonas',
    titulo: 'Las dos zonas',
    texto:
      'El juego se disputa en dos zonas, una a cada lado. Cada una tiene un local y un efecto que puede subir o bajar el poder de ciertas categorías. Ojo con eso.',
  },
  {
    pose: 'no',
    ancla: 'slots-propios',
    titulo: 'Dónde bajar cartas',
    texto:
      'Arrastrá una carta a un casillero libre de tu lado. Si preferís, seleccionala con Espacio y tocá el botón del casillero. Eso sí: una carta jugada no se puede mover, así que pensalo bien.',
    pista: 'Los casilleros resaltados son los que están libres.',
  },
  {
    ancla: 'zona-izquierda',
    titulo: 'Ahora te toca a vos',
    texto:
      'Bajá una carta a la zona izquierda y mirá cómo su poder se suma al marcador.',
    espera: 'carta-jugada',
    pista: 'Arrastrá la carta o usá el botón del casillero resaltado.',
  },
  {
    ancla: 'control-turno',
    titulo: 'Cerrá la ronda',
    texto:
      'Cuando hayas terminado, tocá el botón de turno. Yo me encargo de revelar la carta del bot y de comparar los puntos de cada zona.',
    espera: 'turno-finalizado',
    pista: 'El botón muestra el número de ronda, por ejemplo 1/6.',
  },
  {
    pose: 'si',
    titulo: '¡Excelente jugada!',
    texto:
      'Ya conocés lo básico: cupones, mano, zonas y cierre de ronda. Cuando quieras, practicá contra el bot. Fue un placer acompañarte.',
    pista: 'Podés volver a este tutorial cuando quieras.',
  },
];

/** Paso que muestra la galería de componentes, sin partida real. */
export const PASO_VISTA_PREVIA: PasoTutorial = PASOS_TUTORIAL[1];
