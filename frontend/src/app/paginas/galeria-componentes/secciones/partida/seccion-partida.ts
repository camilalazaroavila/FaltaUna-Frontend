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
import { SelectorMazos } from '@compartidos/componentes/cartas/selector-mazos/selector-mazos';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';
import { CARTAS_MOCK } from '@modelos/cartas.mock';
import type { MazoApi } from '@modelos/mazo.model';
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

import { Zona } from '@compartidos/componentes/partida/zona/zona';
import type { PasoBurbuja } from '@compartidos/componentes/partida/conteo-ronda/secuencia-conteo-ronda';
import type { ZonaTablero } from '@modelos/partida.model';

const ZONA_MOCK: ZonaTablero = {
  id: 1,
  zonaPartidaId: 1,
  nombre: 'Obelisco de Buenos Aires',
  imagenUrl: '/imagenes/obelisco.jpg',
  efecto: { categoria: 'gastronomia', bonus: 2, texto: 'Los campeones suman +2' },
  poderPropio: 18,
  poderRival: 12,
  bonusPorCategoria: {},
  ganador: 'propio',
  efectosCategoria: [],
};

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
    SelectorMazos,
    Zona,
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

  protected readonly zonaMock = ZONA_MOCK;
  protected readonly cartasZonaPropia = [CARTAS_MOCK[0], CARTAS_MOCK[1], null, null, null, null] as const;
  protected readonly cartasZonaRival = [CARTAS_MOCK[2], null, null, null, null, null] as const;
  protected readonly burbujaDemo = signal<PasoBurbuja | null>(null);

  // Mocks para app-selector-mazos
  protected readonly mazoSeleccionadoId = signal<number | null>(1);
  protected readonly mazosDemo = signal<readonly MazoApi[]>([
    {
      id: 1,
      nombre: 'Mazo Base Dragón (12 cartas)',
      completo: true,
      cartas: Array.from({ length: 12 }, (_, i) => ({
        cartaId: 100 + i,
        nombre: `Carta ${i + 1}`,
        poder: 3 + (i % 7),
        costoCupon: 1 + (i % 3),
        rarezaId: i < 5 ? 1 : i < 9 ? 2 : i < 11 ? 3 : 4,
        rareza: i < 5 ? 'comun' : i < 9 ? 'rara' : i < 11 ? 'epicarta' : 'legendaria',
        rarezaOrden: i < 5 ? 1 : i < 9 ? 2 : i < 11 ? 3 : 4,
        imagenUrl: null,
      })),
    },
    {
      id: 2,
      nombre: 'Mazo Experimental (Incompleto)',
      completo: false,
      cartas: [
        {
          cartaId: 201,
          nombre: 'Carta Fuego',
          poder: 8,
          costoCupon: 2,
          rarezaId: 3,
          rareza: 'epicarta',
          rarezaOrden: 3,
          imagenUrl: null,
        },
      ],
    },
    {
      id: 3,
      nombre: 'Mazo Competitivo Trueno',
      completo: true,
      cartas: Array.from({ length: 12 }, (_, i) => ({
        cartaId: 300 + i,
        nombre: `Trueno ${i + 1}`,
        poder: 4 + (i % 6),
        costoCupon: 1 + (i % 4),
        rarezaId: i < 5 ? 1 : i < 9 ? 2 : i < 11 ? 3 : 4,
        rareza: i < 5 ? 'comun' : i < 9 ? 'rara' : i < 11 ? 'epicarta' : 'legendaria',
        rarezaOrden: i < 5 ? 1 : i < 9 ? 2 : i < 11 ? 3 : 4,
        imagenUrl: null,
      })),
    },
  ]);

  protected probarBurbujaPropia(): void {
    this.burbujaDemo.set({
      tipo: 'burbuja',
      lugar: 'izquierda',
      lado: 'propio',
      indice: 0,
      carta: CARTAS_MOCK[0],
      poder: CARTAS_MOCK[0].atributoDerecho,
      id: Date.now(),
    });
  }

  protected probarBurbujaRival(): void {
    this.burbujaDemo.set({
      tipo: 'burbuja',
      lugar: 'izquierda',
      lado: 'rival',
      indice: 0,
      carta: CARTAS_MOCK[2],
      poder: CARTAS_MOCK[2].atributoDerecho,
      id: Date.now(),
    });
  }

  protected limpiarBurbujaDemo(): void {
    this.burbujaDemo.set(null);
  }
}
