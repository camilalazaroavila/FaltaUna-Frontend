import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { PagosService } from '@servicios/pagos.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';

/**
 * Deja entrar a la creación del álbum solo si hay un pago Aprobado.
 * Usa el pago en memoria; si se recargó la página, lo consulta al backend
 * con la referencia guardada.
*/

export const pagoAprobadoGuard: CanActivateFn = ():
  | boolean
  | UrlTree
  | Observable<boolean | UrlTree> => {
  const estado = inject(SuscripcionEstado);
  const pagos = inject(PagosService);
  const router = inject(Router);
  const aPlanes = router.createUrlTree(['/empresa']);
  const aPagoPendiente = router.createUrlTree(['/empresa/album/pago/pendiente']);

  if (estado.ultimoPago()?.estado === 'Aprobado') return true;

  const referencia = estado.ultimoPago()?.referenciaExterna ?? estado.referenciaGuardada();
  if (!referencia) return aPlanes;

  return pagos.obtenerPago(referencia).pipe(
    map((pago) => {
      estado.ultimoPago.set(pago);
      return pago.estado === 'Aprobado' ? true : aPagoPendiente;
    }),
    catchError(() => of(aPagoPendiente)),
  );
};