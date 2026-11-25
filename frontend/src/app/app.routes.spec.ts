import { routes } from './app.routes';

describe('app.routes', () => {
  it('define una sola ruta real para jugar contra el bot con modo ia', () => {
    const partidasIa = routes.filter((ruta) => ruta.path === 'juego/ia');

    expect(partidasIa).toHaveLength(1);
    expect(partidasIa[0].loadComponent).toBeDefined();
    expect(partidasIa[0].data).toEqual(expect.objectContaining({ modo: 'ia' }));
  });

  it('configura el modo pvp en la ruta de partida contra jugador', () => {
    const partidaPvp = routes.find((ruta) => ruta.path === 'juego/jugador');

    expect(partidaPvp?.loadComponent).toBeDefined();
    expect(partidaPvp?.data).toEqual(expect.objectContaining({ modo: 'pvp' }));
  });

  it('mantiene la pantalla de carga solo para el tutorial', () => {
    const tutorial = routes.find((ruta) => ruta.path === 'juego/tutorial');

    expect(tutorial?.loadComponent).toBeDefined();
    expect(tutorial?.data).toEqual({ modo: 'tutorial' });
  });
});
