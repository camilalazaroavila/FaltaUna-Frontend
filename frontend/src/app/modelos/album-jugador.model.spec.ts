import {
  CANTIDADES_ALBUM_VALIDAS,
  esCantidadAlbumValida,
} from './album-jugador.model';

describe('album-jugador.model', () => {
  describe('esCantidadAlbumValida', () => {
    it('acepta solo 12, 20 y 30', () => {
      expect(CANTIDADES_ALBUM_VALIDAS).toEqual([12, 20, 30]);

      for (const total of [12, 20, 30]) {
        expect(esCantidadAlbumValida(total)).toBe(true);
      }
    });

    it('rechaza totales fuera del catálogo (11, 13, 21, 31)', () => {
      for (const total of [11, 13, 21, 31]) {
        expect(esCantidadAlbumValida(total)).toBe(false);
      }
    });
  });
});
