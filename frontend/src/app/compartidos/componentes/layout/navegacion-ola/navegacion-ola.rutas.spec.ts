import {
  limpiarUrlNavegacion,
  tieneNavUsuario,
  RUTAS_USUARIO_SIN_NAV,
} from './navegacion-ola.rutas';

describe('navegacion-ola.rutas (Única fuente de verdad para nav de usuario)', () => {
  describe('limpiarUrlNavegacion', () => {
    it('elimina parámetros de consulta y hashes', () => {
      expect(limpiarUrlNavegacion('/usuario/mis-cartas?cat=1#seccion')).toBe('/usuario/mis-cartas');
      expect(limpiarUrlNavegacion('/usuario/albumes?marca=nike')).toBe('/usuario/albumes');
    });

    it('remueve barra final preservando rutas raíz', () => {
      expect(limpiarUrlNavegacion('/usuario/')).toBe('/usuario');
      expect(limpiarUrlNavegacion('/')).toBe('/');
      expect(limpiarUrlNavegacion('')).toBe('');
    });
  });

  describe('tieneNavUsuario', () => {
    it('retorna true para vistas de usuario con navegación lateral e inferior', () => {
      expect(tieneNavUsuario('/usuario')).toBe(true);
      expect(tieneNavUsuario('/usuario/mis-cartas')).toBe(true);
      expect(tieneNavUsuario('/usuario/albumes')).toBe(true);
      expect(tieneNavUsuario('/usuario/cupones')).toBe(true);
      expect(tieneNavUsuario('/usuario/misiones')).toBe(true);
      expect(tieneNavUsuario('/usuario/mi-baraja')).toBe(true);
    });

    it('retorna false para rutas explícitamente sin nav: Jugar e Intercambio (y sus subrutas)', () => {
      expect(tieneNavUsuario('/usuario/jugar')).toBe(false);
      expect(tieneNavUsuario('/usuario/intercambio')).toBe(false);
      expect(tieneNavUsuario('/usuario/intercambio/coleccionistas')).toBe(false);
      expect(tieneNavUsuario('/usuario/intercambio/activos')).toBe(false);
      expect(tieneNavUsuario('/usuario/intercambio/ofrecer/123')).toBe(false);
      expect(tieneNavUsuario('/usuario/intercambio/responder/456')).toBe(false);
      expect(tieneNavUsuario('/usuario/intercambio/pendiente/789')).toBe(false);
      expect(tieneNavUsuario('/usuario/tutorial')).toBe(false);
    });

    it('retorna false para rutas fuera del área de usuario (landing, auth, juego, empresa)', () => {
      expect(tieneNavUsuario('')).toBe(false);
      expect(tieneNavUsuario('/')).toBe(false);
      expect(tieneNavUsuario('/login')).toBe(false);
      expect(tieneNavUsuario('/registro')).toBe(false);
      expect(tieneNavUsuario('/empresa/landing')).toBe(false);
      expect(tieneNavUsuario('/empresa/dashboard')).toBe(false);
      expect(tieneNavUsuario('/juego/ia')).toBe(false);
      expect(tieneNavUsuario('/juego/jugador')).toBe(false);
      expect(tieneNavUsuario('/componentes')).toBe(false);
    });
  });

  it('lista correctamente las rutas excluidas en RUTAS_USUARIO_SIN_NAV', () => {
    expect(RUTAS_USUARIO_SIN_NAV).toContain('/usuario/jugar');
    expect(RUTAS_USUARIO_SIN_NAV).toContain('/usuario/intercambio');
  });
});

