import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';

import { ApiService } from '@servicios/api.service';
import type {
  ConfirmarFinDeRondaRespuestaApi,
  JugarCartaRespuestaApi,
  PartidaEstadoApi,
  PartidaIniciadaApi,
} from '@modelos/partida.model';

/**
 * Cliente HTTP de la partida contra el bot.
 *
 * Es el único archivo de este flujo que conoce las rutas del backend. No
 * guarda estado ni decide nada: solo habla con la API y devuelve el contrato
 * crudo (`modelos/partida.model.ts`), que el servicio de dominio convierte en
 * datos de tablero.
 *
 * Rutas (todas bajo `/api`):
 *
 * - `POST Partidas/bot` → crea la partida contra el bot.
 * - `GET partidas/{id}/bot/estado` → estado completo (mano, zonas, tiempos).
 * - `POST partidas/{id}/bot/jugar-carta` → baja una carta a una zona.
 * - `POST partidas/{id}/bot/confirmar-fin-ronda` → confirma el turno; contra
 *   el bot el servidor responde con el turno del bot y la ronda cerrada.
 * - `POST partidas/{id}/bot/cerrar-ronda-vencida` → cierra la ronda que venció.
 */
@Injectable({ providedIn: 'root' })
export class PartidaApiService {
  private readonly api = inject(ApiService);

  /** Crea una partida contra el bot con el mazo indicado. */
  iniciarContraBot(mazoId: number): Observable<PartidaIniciadaApi> {
    return this.api.post<PartidaIniciadaApi>('Partidas/bot', { mazoUsuario1Id: mazoId });
  }

  /** Estado completo de la partida (se usa al crear y al reconectar). */
  obtenerEstado(partidaId: number): Observable<PartidaEstadoApi> {
    return this.api.get<PartidaEstadoApi>(`partidas/${partidaId}/bot/estado`);
  }

  /**
   * Baja una carta a una zona de la partida.
   *
   * `numeroRonda` viaja para que el servidor descarte una jugada de una ronda
   * vieja: responde 409 si la ronda ya cambió.
   */
  jugarCarta(
    partidaId: number,
    cartaId: number,
    zonaPartidaId: number,
    numeroRonda: number,
  ): Observable<JugarCartaRespuestaApi> {
    return this.api.post<JugarCartaRespuestaApi>(`partidas/${partidaId}/bot/jugar-carta`, {
      cartaId,
      zonaPartidaId,
      numeroRonda,
    });
  }

  /** Confirma el fin de turno del jugador. */
  confirmarFinDeRonda(
    partidaId: number,
    numeroRonda: number,
  ): Observable<ConfirmarFinDeRondaRespuestaApi> {
    return this.api.post<ConfirmarFinDeRondaRespuestaApi>(
      `partidas/${partidaId}/bot/confirmar-fin-ronda`,
      { numeroRonda },
    );
  }

  /** Cierra la ronda que ya venció (el servidor no hace nada si todavía hay tiempo). */
  cerrarRondaVencida(partidaId: number): Observable<ConfirmarFinDeRondaRespuestaApi> {
    return this.api.post<ConfirmarFinDeRondaRespuestaApi>(
      `partidas/${partidaId}/bot/cerrar-ronda-vencida`,
      {},
    );
  }
}
