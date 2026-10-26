import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';
import { AlbumesService } from '@servicios/albumes.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';

export const empresaRegistradaGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const albumes = inject(AlbumesService);
  const estado = inject(SuscripcionEstado);
  const router = inject(Router);

  const destinoFlujo = (): UrlTree => {
    const pagoIniciado =
      estado.ultimoPago() !== null || estado.referenciaGuardada() !== null;

    return pagoIniciado
      ? router.createUrlTree(['/empresa/album/crear/marca'])
      : router.createUrlTree(['/empresa']);
  };

  return albumes.obtenerMisAlbumes().pipe(
    map((lista) => {
      if (lista.length > 0) {
        estado.marcarAltaCompletada();
        return true;
      }

      estado.limpiarAltaCompletada();
      return destinoFlujo();
    }),

    catchError(() => of(estado.altaCompletada() ? true : destinoFlujo())),
  );
};
