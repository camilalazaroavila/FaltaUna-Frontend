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

/** Paso donde una carta emite una burbuja flotante con su poder actual. */
export interface PasoBurbuja {
  readonly tipo: 'burbuja';
  readonly lugar: NombreLugar;
  readonly lado: 'propio' | 'rival';
  readonly indice: number;
  readonly carta: Carta;
  readonly poder: number;
  readonly id: number;
}

/** Paso donde se revela el total de una zona y la diferencia con el ganador. */
export interface PasoZona {
  readonly tipo: 'zona';
  readonly lugar: NombreLugar;
  readonly resultado: ResultadoZonaRonda;
}

/** Paso donde se actualiza la barra general de puntos de la partida. */
export interface PasoBarra {
  readonly tipo: 'barra';
  readonly puntosPropio: number;
  readonly puntosRival: number;
}

/** Paso genérico de la cola única de animación de resolución de ronda. */
export type PasoSecuenciaConteo = PasoBurbuja | PasoZona | PasoBarra;

export interface ContextoCartasLugar {
  readonly propio: readonly (Carta | null)[];
  readonly rival: readonly (Carta | null)[];
}

let siguienteIdBurbuja = 1;

/**
 * Construye la cola única y secuencial de pasos para la resolución de ronda:
 * 1. Por zona (de izquierda a derecha).
 * 2. Dentro de cada zona: primero cartas propias (0..5), luego cartas del rival (0..5).
 * 3. Al concluir las cartas de una zona: paso de total y diferencia de esa zona.
 * 4. Al concluir todas las zonas: paso de avance de la barra de puntos general.
 *
 * Cartas ocultas o sin poder definido no generan burbuja (se omiten limpiamente).
 */
export function construirColaPasos(
  lugares: readonly NombreLugar[],
  cartasPorLugar: Record<NombreLugar, ContextoCartasLugar>,
  resultado: ResultadoRonda,
): readonly PasoSecuenciaConteo[] {
  const pasos: PasoSecuenciaConteo[] = [];

  for (const lugar of lugares) {
    const contexto = cartasPorLugar[lugar];
    const zonaResultado = resultado.zonas.find(
      (z) => z.nombreZona?.toLowerCase().includes(lugar) || true,
    );

    if (contexto) {
      // 1. Cartas propias de la zona
      contexto.propio.forEach((carta, indice) => {
        if (carta && !carta.oculta && typeof carta.atributoDerecho === 'number') {
          pasos.push({
            tipo: 'burbuja',
            lugar,
            lado: 'propio',
            indice,
            carta,
            poder: carta.atributoDerecho,
            id: siguienteIdBurbuja++,
          });
        }
      });

      // 2. Cartas del rival de la zona
      contexto.rival.forEach((carta, indice) => {
        if (carta && !carta.oculta && typeof carta.atributoDerecho === 'number') {
          pasos.push({
            tipo: 'burbuja',
            lugar,
            lado: 'rival',
            indice,
            carta,
            poder: carta.atributoDerecho,
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

  // 4. Barra general de puntos
  pasos.push({
    tipo: 'barra',
    puntosPropio: resultado.puntosPropio,
    puntosRival: resultado.puntosRival,
  });

  return pasos;
}
