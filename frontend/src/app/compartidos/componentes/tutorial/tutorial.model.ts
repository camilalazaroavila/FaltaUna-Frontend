import type { PoseJaime } from '@compartidos/componentes/tutorial/jaime/jaime';

/**
 * Eventos del tablero que pueden completar una espera del tutorial.
 * Se incluyen alias en infinitivo e indicativo para tolerar ambos estilos.
 */
export type EventoTutorial =
  | 'carta-vista'
  | 'carta-jugada'
  | 'jugar-carta'
  | 'turno-finalizado'
  | 'finalizar-turno';

/**
 * Paso individual del guion del tutorial.
 * Puede tener una segunda ancla (`anclaAlIniciarAccion`) que el overlay usa
 * cuando la acción del paso empezó (por ejemplo, al abrir el detalle de una carta).
 */
export interface PasoTutorial {
  readonly ancla?: string;
  readonly anclaExtra?: string;
  readonly anclaAlIniciarAccion?: string;
  readonly textoAlIniciarAccion?: string;
  readonly titulo: string;
  readonly texto: string;
  readonly pista?: string;
  readonly espera?: EventoTutorial;
  readonly pose?: PoseJaime;
}
