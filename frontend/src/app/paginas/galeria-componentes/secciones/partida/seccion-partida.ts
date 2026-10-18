import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BarraPuntos } from '@compartidos/componentes/partida/barra-puntos/barra-puntos';
import { CuponRecurso } from '@compartidos/componentes/partida/cupon-recurso/cupon-recurso';
import { IndicadorTurno } from '@compartidos/componentes/partida/indicador-turno/indicador-turno';
import { JugadorChip } from '@compartidos/componentes/partida/jugador-chip/jugador-chip';
import { PuntajeZona } from '@compartidos/componentes/partida/puntaje-zona/puntaje-zona';
import { SlotCarta } from '@compartidos/componentes/partida/slot-carta/slot-carta';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';

/** Avatares de ejemplo: SVG embebido, así la galería no pide assets externos. */
const AVATAR_VERDE =
  'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%233BD972\'/%3E%3Ccircle cx=\'24\' cy=\'18\' r=\'8\' fill=\'%230A2E36\'/%3E%3Ccircle cx=\'24\' cy=\'44\' r=\'14\' fill=\'%230A2E36\'/%3E%3C/svg%3E';

const AVATAR_AMARILLO =
  'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 48 48\'%3E%3Crect width=\'48\' height=\'48\' fill=\'%23F9F9B2\'/%3E%3Ccircle cx=\'24\' cy=\'18\' r=\'8\' fill=\'%230A2E36\'/%3E%3Ccircle cx=\'24\' cy=\'44\' r=\'14\' fill=\'%230A2E36\'/%3E%3C/svg%3E';

/**
 * Sección de galería de los átomos de partida en `compartidos/componentes/partida/`.
 * Sigue el interruptor global de modo (no fija `data-modo` propio, como texto y
 * cajas) porque los tokens de tablero, slot y puntaje solo existen en el dominio
 * de jugador.
 */
@Component({
  selector: 'app-seccion-partida',
  imports: [
    CuponRecurso,
    BarraPuntos,
    JugadorChip,
    IndicadorTurno,
    SlotCarta,
    PuntajeZona,
    TarjetaMuestra,
    Texto,
  ],
  templateUrl: './seccion-partida.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionPartida {
  protected readonly avatarVerde = AVATAR_VERDE;
  protected readonly avatarAmarillo = AVATAR_AMARILLO;
  protected readonly rendicion = signal(false);
}
