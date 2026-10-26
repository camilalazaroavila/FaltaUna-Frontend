import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BarraPuntos } from '@compartidos/componentes/partida/barra-puntos/barra-puntos';
import { ControlTurno } from '@compartidos/componentes/partida/control-turno/control-turno';
import { CuponRecurso } from '@compartidos/componentes/partida/cupon-recurso/cupon-recurso';
import { IndicadorTurno } from '@compartidos/componentes/partida/indicador-turno/indicador-turno';
import { JugadorChip } from '@compartidos/componentes/partida/jugador-chip/jugador-chip';
import { Mano } from '@compartidos/componentes/partida/mano/mano';
import { PuntajeZona } from '@compartidos/componentes/partida/puntaje-zona/puntaje-zona';
import { SlotCarta } from '@compartidos/componentes/partida/slot-carta/slot-carta';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';
import { CARTAS_MOCK } from '@modelos/cartas.mock';


/** Avatares de ejemplo: SVG embebido, así la galería no pide assets externos. */
const AVATAR_VERDE =
  'imagenes/iconos-jugador/batman.png';

const AVATAR_AMARILLO =
  'imagenes/iconos-jugador/ps5.jpg';

  
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
    ControlTurno,
    Mano,
  ],
  templateUrl: './seccion-partida.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionPartida {
  protected readonly avatarVerde = AVATAR_VERDE;
  protected readonly avatarAmarillo = AVATAR_AMARILLO;
  protected readonly rendicion = signal(false);
  protected readonly cartasMano = CARTAS_MOCK.slice(0, 5);
}
