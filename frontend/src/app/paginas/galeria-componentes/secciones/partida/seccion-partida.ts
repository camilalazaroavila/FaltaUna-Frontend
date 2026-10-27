import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BarraPuntos } from '@compartidos/componentes/partida/barra-puntos/barra-puntos';
import { ControlTurno } from '@compartidos/componentes/partida/control-turno/control-turno';
import { CuponRecurso } from '@compartidos/componentes/partida/cupon-recurso/cupon-recurso';
import { IndicadorTurno } from '@compartidos/componentes/partida/indicador-turno/indicador-turno';
import { JugadorChip } from '@compartidos/componentes/partida/jugador-chip/jugador-chip';
import { Mano } from '@compartidos/componentes/partida/mano/mano';
import { PantallaResultado } from '@compartidos/componentes/partida/pantalla-resultado/pantalla-resultado';
import { PuntajeZona } from '@compartidos/componentes/partida/puntaje-zona/puntaje-zona';
import { SlotCarta } from '@compartidos/componentes/partida/slot-carta/slot-carta';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';
import { CARTAS_MOCK } from '@modelos/cartas.mock';
import type { ResultadoPartidaApi, ResultadoRonda } from '@modelos/partida.model';

/** Avatares de ejemplo: SVG embebido, así la galería no pide assets externos. */
const AVATAR_VERDE =
  'imagenes/iconos-jugador/batman.png';

const AVATAR_AMARILLO =
  'imagenes/iconos-jugador/ps5.jpg';

const RESULTADO_VICTORIA_MOCK: ResultadoPartidaApi = {
  partidaId: 101,
  ganador: 'propio',
  motivo: 'cien-puntos',
  puntosPropio: 102,
  puntosRival: 84,
  fechaFin: '2026-10-26T22:00:00Z',
};

const RESULTADO_DERROTA_MOCK: ResultadoPartidaApi = {
  partidaId: 102,
  ganador: 'rival',
  motivo: 'seis-rondas',
  puntosPropio: 70,
  puntosRival: 88,
  fechaFin: '2026-10-26T22:00:00Z',
};

const RESULTADO_EMPATE_MOCK: ResultadoPartidaApi = {
  partidaId: 103,
  ganador: 'empate',
  motivo: 'seis-rondas',
  puntosPropio: 80,
  puntosRival: 80,
  fechaFin: '2026-10-26T22:00:00Z',
};

const HISTORIAL_RONDAS_MOCK: readonly ResultadoRonda[] = [
  {
    numero: 1,
    puntosPropio: 15,
    puntosRival: 10,
    ganador: 'propio',
    motivo: null,
    gane: true,
    terminada: false,
    zonas: [
      {
        zonaPartidaId: 1,
        nombreZona: 'Obelisco',
        propio: 14,
        rival: 8,
        puntosGanadosPropio: 15,
        puntosGanadosRival: 0,
        ganador: 'propio',
      },
      {
        zonaPartidaId: 2,
        nombreZona: 'Caminito',
        propio: 10,
        rival: 10,
        puntosGanadosPropio: 0,
        puntosGanadosRival: 10,
        ganador: 'rival',
      },
    ],
    cartasReveladasRival: [
      { nombre: 'Dibu Martínez', poder: 8, nombreZona: 'Obelisco' },
    ],
  },
  {
    numero: 2,
    puntosPropio: 35,
    puntosRival: 28,
    ganador: 'propio',
    motivo: null,
    gane: true,
    terminada: false,
    zonas: [
      {
        zonaPartidaId: 3,
        nombreZona: 'Monumento a la Bandera',
        propio: 22,
        rival: 18,
        puntosGanadosPropio: 20,
        puntosGanadosRival: 0,
        ganador: 'propio',
      },
    ],
    cartasReveladasRival: [],
  },
];

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
    PantallaResultado,
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

  protected readonly resultadoVictoria = RESULTADO_VICTORIA_MOCK;
  protected readonly resultadoDerrota = RESULTADO_DERROTA_MOCK;
  protected readonly resultadoEmpate = RESULTADO_EMPATE_MOCK;
  protected readonly historialRondas = HISTORIAL_RONDAS_MOCK;
}
