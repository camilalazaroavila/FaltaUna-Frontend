import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';
import { ModoJuego } from '@app/modelos/modo-juego.model';

// Duración inventada para poder ver el diseño; el backend real no tiene tiempo fijo.
const DURACION_SIMULADA_MS: Record<ModoJuego, number> = {
  pvp: 4000,
  ia: 2000,
  tutorial: 2000,
};

@Injectable({ providedIn: 'root' })
export class EmparejamientoService {
  /**
   * Emite `true` cuando la partida está lista.
   * TODO: reemplazar el temporizador por la llamada al backend cuando esté el endpoint.
   * Los componentes no cambian: solo consumen este Observable.
   */
  buscarPartida(modo: ModoJuego): Observable<boolean> {
    return timer(DURACION_SIMULADA_MS[modo]).pipe(map(() => true));
  }
}