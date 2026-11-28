import type { ModoJuego } from '@app/modelos/modo-juego.model';

const LONGITUD_MAXIMA_NOMBRE = 40;
const REGEX_CARACTERES_CONTROL = /[\u0000-\u001F\u007F]/g;

export interface JugadoresPartidaMinimo {
  readonly propio: { readonly nombre: string };
  readonly rival: { readonly nombre: string };
}

export interface OpcionesNombresCarga {
  readonly partidaCargadaId: number | null;
  readonly partidaEsperadaId?: number | null;
  readonly jugadoresPartida: JugadoresPartidaMinimo;
  readonly nombreSesion: string | null | undefined;
  readonly modo: ModoJuego;
}

export interface NombresCarga {
  readonly propio: string;
  readonly rival: string;
}

/**
 * Normaliza un nombre de jugador antes de mostrarlo en la UI:
 * elimina caracteres de control, colapsa espacios, acota longitud
 * y aplica un respaldo seguro si el valor llega vacío o inválido.
 */
export function sanitizarNombreJugador(valor: unknown, respaldo: string): string {
  if (typeof valor !== 'string') {
    return respaldo;
  }

  const limpio = valor
    .replace(/\s+/g, ' ')
    .replace(REGEX_CARACTERES_CONTROL, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, LONGITUD_MAXIMA_NOMBRE)
    .trim();

  return limpio.length > 0 ? limpio : respaldo;
}

/**
 * Resuelve de forma segura los nombres para `PantallaCargaJuego`:
 * solo lee `jugadoresPartida` cuando hay una partida real cargada (y coincide
 * con `partidaEsperadaId` si se especificó), evitando exponer nombres mock o
 * datos de una partida anterior.
 */
export function resolverNombresPartidaCarga(opciones: OpcionesNombresCarga): NombresCarga {
  const respaldoPropio = sanitizarNombreJugador(opciones.nombreSesion, 'Jugador');
  const respaldoRival = opciones.modo === 'pvp' ? 'Rival' : 'Bot';

  const tienePartidaReal =
    opciones.partidaCargadaId !== null &&
    (opciones.partidaEsperadaId === undefined ||
      opciones.partidaCargadaId === opciones.partidaEsperadaId);

  if (!tienePartidaReal) {
    return {
      propio: respaldoPropio,
      rival: respaldoRival,
    };
  }

  return {
    propio: sanitizarNombreJugador(opciones.jugadoresPartida.propio.nombre, respaldoPropio),
    rival: sanitizarNombreJugador(opciones.jugadoresPartida.rival.nombre, respaldoRival),
  };
}
