import { routes } from '@app/app.routes';
import { rolGuard } from './rol.guard';

describe('Ruta /empresa · configuración de acceso al flujo de empresa', () => {
  it('no tiene rolGuard, de modo que cualquier usuario autenticado accede al flujo de empresa (no es desviado a su dashboard de rol)', () => {
    const rutaEmpresa = routes.find((r) => r.path === 'empresa');
    expect(rutaEmpresa).toBeTruthy();
    const canActivate = rutaEmpresa?.canActivate ?? [];
    expect(canActivate).not.toContain(rolGuard);
  });
});
