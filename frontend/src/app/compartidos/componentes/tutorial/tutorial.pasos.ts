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
      'Soy Jaime, a tu servicio. Te voy a guiar en esta primera ronda contra el bot para que aprendas a jugar. Primero te muestro el tablero y las reglas, y después vas a poder jugar a tu gusto.',
    pista: 'Podés salir del tutorial cuando quieras.',
  },
  {
    ancla: 'cupones',
    titulo: 'Los cupones',
    texto:
      'Cada carta cuesta cupones para bajarla a la mesa. Ahora tenés 3, y en cada ronda vas a recibir más. Usalos con criterio.',
    pista: 'En esta práctica arrancás con 3 cupones.',
  },
  {
    ancla: 'mano',
    titulo: 'Tu mano',
    texto:
      'Estas son tus cartas, acomodadas en abanico. Cada una cuenta con su propio costo en cupones, poder de combate y habilidades especiales.',
    pista: 'Las cartas se inclinan según su posición en la mano.',
  },
  {
    ancla: 'mano',
    anclaAlIniciarAccion: 'carta-detalle',
    titulo: 'Costo y poder',
    texto: 'Tocá una carta de tu mano para mirarla de cerca.',
    textoAlIniciarAccion:
      'Fijate en los números: el de la izquierda es el costo en cupones; el de la derecha, el poder que sumás a la zona. Abajo tenés su habilidad especial y su categoría. Tocá "Siguiente" o cerrá el detalle para continuar.',
    espera: 'carta-vista',
    pista: 'Tocá una carta de tu mano para abrir su detalle.',
  },
  {
    ancla: 'zonas',
    titulo: 'Las dos zonas',
    texto:
      'El juego se disputa en dos zonas, una a cada lado. Cada una tiene un local y un efecto que puede subir o bajar el poder de ciertas categorías. Ojo con eso.',
  },
  {
    ancla: 'zona-izquierda',
    titulo: 'Efectos de cartas y locales',
    texto:
      'Al lado de la foto de cada zona ves los modificadores de categoría (+ y −). Grido, por ejemplo, suma +1 a Gastronomía. Además, fijate en las habilidades de tus cartas: combinarlas con el local correcto es la clave para ganar.',
    pista: 'Mirá los iconos de suma y resta junto al logo del local.',
  },
  {
    pose: 'no',
    ancla: 'slots-propios',
    titulo: 'Dónde bajar cartas',
    texto:
      'En este lado se juegan tus cartas, en los casilleros libres. Eso sí: una carta jugada no se puede mover, así que pensalo bien.',
    pista: 'Los casilleros resaltados son los que están disponibles.',
  },
  {
    ancla: 'slots-propios',
    titulo: 'Ahora te toca a vos',
    texto:
      'Bajá a Danonino (1 cupón) a un casillero de la izquierda: al ser de Gastronomía, ¡el local le sumará +1 de poder automáticamente!',
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
    ancla: 'zona-izquierda',
    titulo: 'Puntajes por diferencia',
    texto:
      '¡Mirá los marcadores de las zonas! Los puntajes se restan: si en una zona el rival tiene 5 de poder y vos 4, él suma solo 1 punto (la diferencia) y vos 0. Quien sume más poder en la zona se lleva los puntos.',
    pista: 'Ganar por mayor diferencia aporta más puntos a tu barra.',
  },
  {
    ancla: 'barra-propia',
    pose: 'si',
    titulo: 'La barra de puntos',
    texto:
      'Esa diferencia de puntos va directo a tu barra. El objetivo es llegar a 100 puntos antes que tu rival, o tener más puntos al terminar la ronda 6.',
    pista: 'La barra muestra tu progreso hacia la victoria.',
  },
  {
    ancla: 'aviso-rotacion',
    titulo: 'Rotación de zonas',
    texto:
      'En el medio del tablero, te indico qué zona va a cambiar el turno que viene. Cuando una zona cambia, entra un nuevo local con nuevos efectos y categorías, alterando la mesa.',
    pista: 'Planificá tus jugadas anticipando el cambio de local.',
  },
  {
    pose: 'si',
    titulo: '¡Rondas 5 y 6 hacia la victoria!',
    texto:
      '¡Ya dominás las reglas! Para ver la acción completa, te salteo a las rondas finales con 5 cupones y cartas poderosas. ¡Encadená efectos y ganale al bot!',
    pista: 'Elegí "Seguir jugando" para las rondas finales o "Volver al menú".',
  },
];

/** Paso que muestra la galería de componentes, sin partida real. */
export const PASO_VISTA_PREVIA: PasoTutorial = PASOS_TUTORIAL[1];
