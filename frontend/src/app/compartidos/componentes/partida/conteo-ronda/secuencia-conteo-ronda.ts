import type { Carta } from '@modelos/carta.model';
import type { NombreLugar, ResultadoRonda, ResultadoZonaRonda } from '@modelos/partida.model';

/** Duración objetivo total de la ronda en milisegundos. Decisión tomada, a revisar: 9000ms. */
export const DURACION_CONTEO_OBJETIVO_MS = 9000;

/** Duración de ascenso y desvanecimiento de cada burbuja de puntaje. Decisión tomada, a revisar: 1100ms. */
export const DURACION_BURBUJA_MS = 1100;

/** Intervalo entre burbujas consecutivas dentro de una misma zona. Decisión tomada, a revisar: 650ms. */
export const ESCALONADO_BURBUJAS_MS = 650;

/** Pausa entre zonas durante la resolución secuencial. Decisión tomada, a revisar: 450ms. */
export const PAUSA_ENTRE_ZONAS_MS = 450;

/** Duración de la fase inicial de efectos de cartas (aumentos y reducciones) antes de las burbujas. */
export const DURACION_EFECTOS_CARTAS_MS = 1400;

export interface ModificacionPoderPaso {
  readonly lugar: NombreLugar;
  readonly lado: 'propio' | 'rival';
  readonly indice: number;
  readonly tipo: 'aumento' | 'reduccion';
  readonly delta: number;
}

/** Paso inicial donde ocurren los efectos de las cartas antes del conteo por burbuja. */
export interface PasoEfectosCartas {
  readonly tipo: 'efectos-cartas';
  readonly modificaciones: readonly ModificacionPoderPaso[];
}

/** Paso donde una carta emite una burbuja flotante con su poder actual. */
export interface PasoBurbuja {
  readonly tipo: 'burbuja';
  readonly lugar: NombreLugar;
  readonly lado: 'propio' | 'rival';
  readonly indice: number;
  readonly carta: Carta;
  readonly poder: number;
  readonly id: number;
  readonly modificador?: 'aumento' | 'reduccion' | 'normal';
  readonly deltaPoder?: number;
}

/** Paso donde se revela el total de una zona y la diferencia con el ganador. */
export interface PasoZona {
  readonly tipo: 'zona';
  readonly lugar: NombreLugar;
  readonly resultado: ResultadoZonaRonda;
}

/** Paso donde las zonas cambian de lugar (después de sumar las cartas, antes de los puntos totales). */
export interface PasoCambioZonas {
  readonly tipo: 'cambio-zonas';
}

/** Paso donde se actualiza la barra general de puntos de la partida. */
export interface PasoBarra {
  readonly tipo: 'barra';
  readonly puntosPropio: number;
  readonly puntosRival: number;
}

/** Paso genérico de la cola única de animación de resolución de ronda. */
export type PasoSecuenciaConteo =
  | PasoEfectosCartas
  | PasoBurbuja
  | PasoZona
  | PasoCambioZonas
  | PasoBarra;

export interface ContextoCartasLugar {
  readonly propio: readonly (Carta | null)[];
  readonly rival: readonly (Carta | null)[];
}

let siguienteIdBurbuja = 1;

/**
 * Construye la cola única y secuencial de pasos para la resolución de ronda:
 * 0. Primero: efectos de las cartas (aumentos y reducciones de poder en mesa).
 * 1. Por zona (de izquierda a derecha): burbuja por carta (propias y rivales).
 * 2. Total y diferencia de la zona.
 * 3. Cambio de zonas (si aplica).
 * 4. Barra general de puntos.
 */
export function construirColaPasos(
  lugares: readonly NombreLugar[],
  cartasPorLugar: Record<NombreLugar, ContextoCartasLugar>,
  resultado: ResultadoRonda,
): readonly PasoSecuenciaConteo[] {
  const pasos: PasoSecuenciaConteo[] = [];

  // 0. Recolectar efectos de modificación de cartas de toda la mesa
  const modificaciones: ModificacionPoderPaso[] = [];
  for (const lugar of lugares) {
    const contexto = cartasPorLugar[lugar];
    if (contexto) {
      contexto.propio.forEach((carta, indice) => {
        if (carta && !carta.oculta && typeof carta.atributoDerecho === 'number') {
          const base =
            typeof carta.poderBase === 'number' ? carta.poderBase : carta.atributoDerecho;
          const delta = carta.atributoDerecho - base;
          if (delta !== 0) {
            modificaciones.push({
              lugar,
              lado: 'propio',
              indice,
              tipo: delta > 0 ? 'aumento' : 'reduccion',
              delta,
            });
          }
        }
      });

      contexto.rival.forEach((carta, indice) => {
        if (carta && !carta.oculta && typeof carta.atributoDerecho === 'number') {
          const base =
            typeof carta.poderBase === 'number' ? carta.poderBase : carta.atributoDerecho;
          const delta = carta.atributoDerecho - base;
          if (delta !== 0) {
            modificaciones.push({
              lugar,
              lado: 'rival',
              indice,
              tipo: delta > 0 ? 'aumento' : 'reduccion',
              delta,
            });
          }
        }
      });
    }
  }

  if (modificaciones.length > 0) {
    pasos.push({
      tipo: 'efectos-cartas',
      modificaciones,
    });
  }

  for (const lugar of lugares) {
    const contexto = cartasPorLugar[lugar];
    const zonaResultado = resultado.zonas.find(
      (z) => z.nombreZona?.toLowerCase().includes(lugar) || true,
    );

    if (contexto) {
      // 1. Cartas propias de la zona
      contexto.propio.forEach((carta, indice) => {
        if (carta && !carta.oculta && typeof carta.atributoDerecho === 'number') {
          const base =
            typeof carta.poderBase === 'number' ? carta.poderBase : carta.atributoDerecho;
          const modificador =
            carta.atributoDerecho > base
              ? 'aumento'
              : carta.atributoDerecho < base
                ? 'reduccion'
                : 'normal';
          const deltaPoder = carta.atributoDerecho - base;

          pasos.push({
            tipo: 'burbuja',
            lugar,
            lado: 'propio',
            indice,
            carta,
            poder: carta.atributoDerecho,
            modificador,
            deltaPoder,
            id: siguienteIdBurbuja++,
          });
        }
      });

      // 2. Cartas del rival de la zona
      contexto.rival.forEach((carta, indice) => {
        if (carta && !carta.oculta && typeof carta.atributoDerecho === 'number') {
          const base =
            typeof carta.poderBase === 'number' ? carta.poderBase : carta.atributoDerecho;
          const modificador =
            carta.atributoDerecho > base
              ? 'aumento'
              : carta.atributoDerecho < base
                ? 'reduccion'
                : 'normal';
          const deltaPoder = carta.atributoDerecho - base;

          pasos.push({
            tipo: 'burbuja',
            lugar,
            lado: 'rival',
            indice,
            carta,
            poder: carta.atributoDerecho,
            modificador,
            deltaPoder,
            id: siguienteIdBurbuja++,
          });
        }
      });
    }

    // 3. Resolución de la zona
    if (zonaResultado) {
      pasos.push({
        tipo: 'zona',
        lugar,
        resultado: zonaResultado,
      });
    }
  }

  // 4. Paso de cambio de zonas (después del sumado de todas las cartas, antes de los puntos totales del jugador)
  pasos.push({
    tipo: 'cambio-zonas',
  });

  // 5. Barra general de puntos de cada jugador
  pasos.push({
    tipo: 'barra',
    puntosPropio: resultado.puntosPropio,
    puntosRival: resultado.puntosRival,
  });

  return pasos;
}
