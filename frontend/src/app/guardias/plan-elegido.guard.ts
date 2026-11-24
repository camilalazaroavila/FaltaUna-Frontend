import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';

/**
 * Deja entrar a los pasos de creación del álbum (marca, identidad, cupón y vista previa)
 * solo si ya se eligió un plan en el paso 1. El pago NO se exige acá: se hace al final,
 * desde la vista previa, y recién ahí se redirige a Mercado Pago.
 */
export const planElegidoGuard: CanActivateFn = (): boolean | UrlTree => {
  const estado = inject(SuscripcionEstado);
  const router = inject(Router);

  return estado.planElegido() ? true : router.createUrlTree(['/empresa']);
};