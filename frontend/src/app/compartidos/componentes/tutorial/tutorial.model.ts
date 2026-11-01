import type { PoseJaime } from '@compartidos/componentes/tutorial/jaime/jaime';

/**
 * Acción concreta que el jugador tiene que hacer en el tablero para que el
 * tutorial pueda avanzar al paso siguiente.
 */
export type EventoTutorial = 'carta-vista' | 'carta-jugada' | 'turno-finalizado';

/** Un paso del tutorial guiado de la partida contra el bot. */
export interface PasoTutorial {
  readonly titulo: string;
  readonly texto: string;
  /** Pose que adopta Jaime en este paso (si falta, Jaime señala). */
  readonly pose?: PoseJaime;
  /**
   * Valor del atributo `data-tutorial` del elemento que se resalta. Si no se
   * indica, el globo se centra en la pantalla (bienvenida y cierre).
   */
  readonly ancla?: string;
  /** Ayuda extra que aparece si el jugador tarda en avanzar. */
  readonly pista?: string;
  /** Acción que el jugador debe completar antes de poder avanzar. */
  readonly espera?: EventoTutorial;
}
