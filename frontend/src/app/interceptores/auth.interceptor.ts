import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../servicios/auth.service';
import { environment } from '../../environments/environment';

/**
 * Agrega el JWT como Bearer token a cada request que vaya hacia la API.
 * No toca requests a otros orígenes (por ejemplo, servicios externos).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.obtenerToken();

  if (!token || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const clon = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });

  return next(clon);
};