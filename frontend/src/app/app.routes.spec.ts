import { routes } from './app.routes';

describe('app.routes', () => {
  it('define una sola ruta real para jugar contra el bot', () => {
    const partidasIa = routes.filter((ruta) => ruta.path === 'juego/ia');

    expect(partidasIa).toHaveLength(1);
    expect(partidasIa[0].loadComponent).toBeDefined();
  });

  it('mantiene la pantalla de carga solo para el tutorial', () => {
    const tutorial = routes.find((ruta) => ruta.path === 'juego/tutorial');

    expect(tutorial?.loadComponent).toBeDefined();
    expect(tutorial?.data).toEqual({ modo: 'tutorial' });
  });
});
