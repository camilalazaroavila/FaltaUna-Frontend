import { Injectable, inject } from '@angular/core';
import { Observable, delay } from 'rxjs';
import { ModoJuego } from '@app/modelos/modo-juego.model';
import { EmparejamientoService } from '@servicios/emparejamiento.service';

/**
 * Tiempo adicional tras completarse `EmparejamientoService` para que el jugador
 * alcance a ver el estado final ("Partida lista" / "Jugador encontrado") antes
 * de entrar al tablero.
 */
export const PAUSA_CONFIRMACION_CARGA_MS = 1500;

@Injectable({ providedIn: 'root' })
export class TransicionCargaService {
  private readonly emparejamiento = inject(EmparejamientoService);

  esperarPantallaCarga(modo: ModoJuego): Observable<boolean> {
    return this.emparejamiento
      .buscarPartida(modo)
      .pipe(delay(PAUSA_CONFIRMACION_CARGA_MS));
  }

  /**
   * Sincroniza la espera visual de `PantallaCargaJuego` con una acción real
   * (por ejemplo, crear la partida contra el bot). Si la acción falla (`false`),
   * finaliza de inmediato sin retener al jugador en la pantalla de carga.
   */
  esperarConAccion(
    modo: ModoJuego,
    accion$: Observable<boolean>,
  ): Observable<boolean> {
    return new Observable<boolean>((subscriber) => {
      let accionTerminada = false;
      let cargaTerminada = false;
      let resultadoAccion = false;

      const intentarCompletar = (): void => {
        if (accionTerminada && cargaTerminada) {
          subscriber.next(resultadoAccion);
          subscriber.complete();
        }
      };

      const subCarga = this.esperarPantallaCarga(modo).subscribe({
        next: () => {
          cargaTerminada = true;
          intentarCompletar();
        },
        error: (err: unknown) => {
          subAccion.unsubscribe();
          subscriber.error(err);
        },
      });

      const subAccion = accion$.subscribe({
        next: (exito) => {
          accionTerminada = true;
          resultadoAccion = exito;
          if (!exito) {
            subCarga.unsubscribe();
            subscriber.next(false);
            subscriber.complete();
            return;
          }
          intentarCompletar();
        },
        error: (err: unknown) => {
          subCarga.unsubscribe();
          subscriber.error(err);
        },
        complete: () => {
          if (!accionTerminada) {
            subCarga.unsubscribe();
            subscriber.next(false);
            subscriber.complete();
          }
        },
      });

      return () => {
        subCarga.unsubscribe();
        subAccion.unsubscribe();
      };
    });
  }
}
