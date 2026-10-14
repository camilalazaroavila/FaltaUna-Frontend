import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { Carta } from '@modelos/carta.model';
import { CARTAS_MOCK } from '@modelos/cartas.mock';

/**
 * Servicio (mock) de la baraja del jugador.
 *
 * Mantiene el estado en memoria y expone `Observable`s, con la misma forma que
 * tendrá la versión real contra HTTP: cuando exista el endpoint alcanza con
 * reemplazar los cuerpos por `ApiService.get()`/`post()` sin tocar la vista.
 */
@Injectable({ providedIn: 'root' })
export class BarajaService {
  private readonly baraja = signal<readonly Carta[]>([]);

  /** Cartas que el jugador ya obtuvo y por lo tanto puede usar en su baraja. */
  obtenerCartasDisponibles(): Observable<Carta[]> {
    return of(CARTAS_MOCK.filter((carta) => carta.obtenida));
  }

  /** Baraja guardada actualmente (vacía si el jugador todavía no armó una). */
  obtenerBaraja(): Observable<Carta[]> {
    return of([...this.baraja()]);
  }

  /** Persiste la baraja elegida y devuelve la versión guardada. */
  guardarBaraja(cartas: readonly Carta[]): Observable<Carta[]> {
    this.baraja.set([...cartas]);
    return of([...this.baraja()]);
  }
}
