import { resolverNombresPartidaCarga, sanitizarNombreJugador } from './nombre-jugador';

describe('nombre-jugador', () => {
  describe('sanitizarNombreJugador', () => {
    it('elimina caracteres de control y colapsa espacios sobrantes', () => {
      expect(sanitizarNombreJugador('  Ana\n\t  María\u0007  ', 'Jugador')).toBe('Ana María');
    });

    it('devuelve el respaldo cuando el valor es vacío o no es texto', () => {
      expect(sanitizarNombreJugador('   ', 'Jugador')).toBe('Jugador');
      expect(sanitizarNombreJugador(null, 'Rival')).toBe('Rival');
      expect(sanitizarNombreJugador(undefined, 'Bot')).toBe('Bot');
    });

    it('acota nombres excesivamente largos a 40 caracteres', () => {
      const largo = 'A'.repeat(60);
      expect(sanitizarNombreJugador(largo, 'Jugador')).toHaveLength(40);
    });
  });

  describe('resolverNombresPartidaCarga', () => {
    const jugadoresMock = {
      propio: { nombre: 'Gonzamirko' },
      rival: { nombre: 'Pedrope' },
    };

    it('nunca expone nombres mock cuando todavía no hay partida real cargada', () => {
      const nombres = resolverNombresPartidaCarga({
        partidaCargadaId: null,
        jugadoresPartida: jugadoresMock,
        nombreSesion: 'Lucia99',
        modo: 'pvp',
      });

      expect(nombres).toEqual({ propio: 'Lucia99', rival: 'Rival' });
    });

    it('usa respaldo seguro cuando la partida cargada no coincide con la esperada', () => {
      const nombres = resolverNombresPartidaCarga({
        partidaCargadaId: 10,
        partidaEsperadaId: 99,
        jugadoresPartida: {
          propio: { nombre: 'ViejoPropio' },
          rival: { nombre: 'ViejoRival' },
        },
        nombreSesion: 'Lucia99',
        modo: 'pvp',
      });

      expect(nombres).toEqual({ propio: 'Lucia99', rival: 'Rival' });
    });

    it('devuelve los nombres reales del backend cuando la partida coincide', () => {
      const nombres = resolverNombresPartidaCarga({
        partidaCargadaId: 99,
        partidaEsperadaId: 99,
        jugadoresPartida: {
          propio: { nombre: 'Lucia99' },
          rival: { nombre: 'MarcosTCG' },
        },
        nombreSesion: 'Lucia99',
        modo: 'pvp',
      });

      expect(nombres).toEqual({ propio: 'Lucia99', rival: 'MarcosTCG' });
    });

    it('usa Bot como respaldo del rival en modo ia antes de cargar', () => {
      const nombres = resolverNombresPartidaCarga({
        partidaCargadaId: null,
        jugadoresPartida: jugadoresMock,
        nombreSesion: '',
        modo: 'ia',
      });

      expect(nombres).toEqual({ propio: 'Jugador', rival: 'Bot' });
    });
  });
});
