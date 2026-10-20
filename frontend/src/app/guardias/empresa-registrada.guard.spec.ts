import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { empresaRegistradaGuard } from './empresa-registrada.guard';
import { AlbumesService } from '@servicios/albumes.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';

describe('empresaRegistradaGuard', () => {
  let estadoMock: {
    altaCompletada: () => boolean;
    marcarAltaCompletada: jest.Mock;
    limpiarAltaCompletada: jest.Mock;
  };

  const configurar = (
    obtenerMisAlbumes: () => Observable<unknown>,
    opciones: {
      ultimoPago?: unknown;
      referenciaGuardada?: string | null;
      altaCompletada?: boolean;
    } = {},
  ): Router => {
    const estado = {
      ultimoPago: () => opciones.ultimoPago ?? null,
      referenciaGuardada: () => opciones.referenciaGuardada ?? null,
      altaCompletada: () => opciones.altaCompletada ?? false,
      marcarAltaCompletada: jest.fn(),
      limpiarAltaCompletada: jest.fn(),
    };
    estadoMock = estado;

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AlbumesService, useValue: { obtenerMisAlbumes } },
        { provide: SuscripcionEstado, useValue: estado },
      ],
    });

    return TestBed.inject(Router);
  };

  const ejecutar = (): Promise<boolean | UrlTree> =>
    firstValueFrom(
      TestBed.runInInjectionContext(
        () => empresaRegistradaGuard({} as never, {} as never) as Observable<boolean | UrlTree>,
      ),
    );

  it('deja pasar a una empresa que ya tiene un álbum', async () => {
    configurar(() => of([{ id: 1 }]));

    await expect(ejecutar()).resolves.toBe(true);
  });

  it('manda a elegir plan si no hay álbum ni pago iniciado', async () => {
    const router = configurar(() => of([]));

    const resultado = await ejecutar();

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/empresa');
  });

  it('manda a crear el álbum si hay un pago iniciado', async () => {
    const router = configurar(() => of([]), { referenciaGuardada: 'REF-123' });

    const resultado = await ejecutar();

    expect(router.serializeUrl(resultado as UrlTree)).toBe('/empresa/album/crear/marca');
  });

  it('también considera pago iniciado al pago en memoria', async () => {
    const router = configurar(() => of([]), { ultimoPago: { estado: 'Aprobado' } });

    const resultado = await ejecutar();

    expect(router.serializeUrl(resultado as UrlTree)).toBe('/empresa/album/crear/marca');
  });

  it('no deja pasar solo con el indicador local si el backend no reporta álbum', async () => {
    const obtener = jest.fn(() => of([]));
    const router = configurar(obtener, { altaCompletada: true });

    const resultado = await ejecutar();

    expect(obtener).toHaveBeenCalled();
    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/empresa');
  });

  it('descarta el indicador local cuando el backend no reporta álbumes', async () => {
    configurar(() => of([]), { altaCompletada: true });

    await ejecutar();

    expect(estadoMock.limpiarAltaCompletada).toHaveBeenCalled();
  });

  it('no bloquea el panel si el alta ya está registrada localmente', async () => {
    configurar(() => throwError(() => new Error('backend caído')), { altaCompletada: true });

    await expect(ejecutar()).resolves.toBe(true);
  });

  it('bloquea el panel (al flujo) si la consulta de álbumes falla', async () => {
    const router = configurar(() => throwError(() => new Error('backend caído')));

    const resultado = await ejecutar();

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/empresa');
  });

  it('ante error, manda a crear el álbum si hay un pago iniciado', async () => {
    const router = configurar(() => throwError(() => new Error('backend caído')), {
      referenciaGuardada: 'REF-123',
    });

    const resultado = await ejecutar();

    expect(router.serializeUrl(resultado as UrlTree)).toBe('/empresa/album/crear/marca');
  });
});
