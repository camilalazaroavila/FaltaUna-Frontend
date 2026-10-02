import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth.service';
import { Rol } from '../modelos/usuario.model';

/**
 * Restringe una ruta a los roles indicados en `data.rolesPermitidos`.
 * Si el rol de la sesión actual no está en la lista, redirige al dashboard
 * que le corresponde a ESE rol (no lo manda al login: ya está logueado).
 */
export const rolGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.estaAutenticado()) {
    router.navigate(['/login']);
    return false;
  }

  const rolesPermitidos = route.data['rolesPermitidos'] as Rol[] | undefined;
  const rolActual = authService.obtenerRol();

  if (!rolesPermitidos || !rolActual || rolesPermitidos.includes(rolActual)) {
    return true;
  }

  router.navigate([authService.rutaSegunRol(rolActual)]);
  return false;
};