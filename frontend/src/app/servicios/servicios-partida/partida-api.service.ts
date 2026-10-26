import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from '@servicios/api.service';
import type {
  EstadoPartidaApi,
  FinalizarPartidaRespuestaApi,
  HeartbeatApi,
  JugarCartaRequestApi,
  ResultadoPartidaApi,
} from '@modelos/partida.model';

/** Cabecera que exige el middleware de idempotencia del backend. */
export const CABECERA_IDEMPOTENCIA = 'Idempotency-Key';

/**
 * Cliente HTTP de la partida.
 *
 * Es el único archivo de este flujo que conoce las rutas del backend. No
 * guarda estado ni decide nada: solo habla con la API y devuelve el contrato
 * crudo (`modelos/partida.model.ts`), que el servicio de dominio convierte en
 * datos de tablero.
 *
 * Todas las acciones mutantes reciben una `Idempotency-Key` para que un
 * reintento de red no aplique dos veces la misma jugada.
 */
@Injectable({ providedIn: 'root' })
export class PartidaApiService {
  private readonly api = inject(ApiService);

  /** Crea una partida contra el bot con el mazo indicado. */
  iniciarContraBot(mazoId: number): Observable<EstadoPartidaApi> {
    return this.api.post<EstadoPartidaApi>('Partidas/bot', { mazoId });
  }

  /** Estado completo de la partida (creación, reconexión y polling). */
  obtenerEstado(partidaId: number): Observable<EstadoPartidaApi> {
    return this.api.get<EstadoPartidaApi>(`Partidas/${partidaId}`);
  }

  /** Señal liviana para que el servidor registre actividad. */
  enviarLatido(partidaId: number): Observable<HeartbeatApi> {
    return this.api.post<HeartbeatApi>(`Partidas/${partidaId}/heartbeat`);
  }

  /** Baja una carta a una zona y devuelve el estado completo ya resuelto. */
  jugarCarta(
    partidaId: number,
    solicitud: JugarCartaRequestApi,
    claveIdempotencia: string,
  ): Observable<EstadoPartidaApi> {
    return this.api.post<EstadoPartidaApi>(`Partidas/${partidaId}/jugar`, solicitud, {
      headers: { [CABECERA_IDEMPOTENCIA]: claveIdempotencia },
    });
  }

  /** Retira una carta provisional de la mesa y la devuelve a la mano. */
  retirarCarta(
    partidaId: number,
    cartaPartidaId: number,
    claveIdempotencia: string,
  ): Observable<EstadoPartidaApi> {
    return this.api.post<EstadoPartidaApi>(
      `Partidas/${partidaId}/retirar`,
      { cartaPartidaId },
      { headers: { [CABECERA_IDEMPOTENCIA]: claveIdempotencia } },
    );
  }

  /**
   * Finaliza el turno.
   *
   * Responde `200` con el resultado de la ronda o `202` con el estado si
   * todavía falta que confirme el rival.
   */
  finalizar(
    partidaId: number,
    ronda: number,
    claveIdempotencia: string,
  ): Observable<FinalizarPartidaRespuestaApi> {
    return this.api.post<FinalizarPartidaRespuestaApi>(
      `Partidas/${partidaId}/finalizar`,
      { ronda },
      { headers: { [CABECERA_IDEMPOTENCIA]: claveIdempotencia } },
    );
  }

  /** Abandona la partida por rendición. */
  rendirse(partidaId: number, claveIdempotencia: string): Observable<ResultadoPartidaApi> {
    return this.api.post<ResultadoPartidaApi>(`Partidas/${partidaId}/rendirse`, undefined, {
      headers: { [CABECERA_IDEMPOTENCIA]: claveIdempotencia },
    });
  }

  /** Abandona la partida por desconexión. */
  abandonar(partidaId: number, claveIdempotencia: string): Observable<ResultadoPartidaApi> {
    return this.api.post<ResultadoPartidaApi>(`Partidas/${partidaId}/abandonar`, undefined, {
      headers: { [CABECERA_IDEMPOTENCIA]: claveIdempotencia },
    });
  }

  /** Resultado final de una partida terminada. */
  obtenerResultado(partidaId: number): Observable<ResultadoPartidaApi> {
    return this.api.get<ResultadoPartidaApi>(`Partidas/${partidaId}/resultado`);
  }
}
