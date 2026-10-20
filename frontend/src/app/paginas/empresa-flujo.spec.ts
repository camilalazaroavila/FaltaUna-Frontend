import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  Router,
  provideRouter,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideIcons } from '@ng-icons/core';
import {
  phosphorArrowLeftFill,
  phosphorArrowRightFill,
  phosphorCheckFill,
  phosphorSealCheckFill,
  phosphorSpinnerGapFill,
  phosphorWarningCircleFill,
  phosphorXFill,
} from '@ng-icons/phosphor-icons/fill';
import { of, throwError } from 'rxjs';

import { routes } from '@app/app.routes';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumesService } from '@servicios/albumes.service';
import { AuthService } from '@servicios/auth.service';
import { PagosService } from '@servicios/pagos.service';
import { EstadoPago, PagoRespuesta } from '@modelos/pago.model';

/** Pago con el estado pedido: el resto de los datos no influye en el flujo. */
const pagoDe = (estado: EstadoPago): PagoRespuesta => ({
  referenciaExterna: 'REF-1',
  estado,
  puedePersonalizar: estado === 'Aprobado',
  monto: 35000,
  moneda: 'ARS',
  plan: {
    id: 2,
    codigo: 'STANDARD',
    nombre: 'Standard',
    precio: 35000,
    maxCartas: 20,
    incluyeEstadisticas: true,
    masPublicidad: true,
    disenoPersonalizado: false,
  },
  fechaCreacion: '2026-10-05T12:00:00Z',
  fechaAprobacion: estado === 'Aprobado' ? '2026-10-05T12:05:00Z' : null,
});

describe('Flujo de alta de empresa (rutas reales, pasos 1 a 5)', () => {
  let pagosMock: {
    iniciarPago: jest.Mock;
    confirmarPago: jest.Mock;
    obtenerPago: jest.Mock;
    redirigirACheckout: jest.Mock;
  };
  let albumesMock: {
    obtenerMisAlbumes: jest.Mock;
    obtenerCategorias: jest.Mock;
    crear: jest.Mock;
  };

  beforeEach(async () => {
    pagosMock = {
      iniciarPago: jest.fn(() => of({ urlPago: 'https://mp.test/checkout', pago: pagoDe('Pendiente') })),
      confirmarPago: jest.fn(() => of(pagoDe('Aprobado'))),
      obtenerPago: jest.fn(() => of(pagoDe('Aprobado'))),
      redirigirACheckout: jest.fn(),
    };
    albumesMock = {
      obtenerMisAlbumes: jest.fn(() => of([])),
      obtenerCategorias: jest.fn(() => of([])),
      crear: jest.fn(() => of({ id: 1 })),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            estaAutenticado: () => true,
            obtenerRol: () => 'Empresa',
            usuarioActual: () => ({ id: 7, nombreUsuario: 'ACME SA' }),
            rutaSegunRol: () => '/empresa',
            logout: jest.fn(),
          },
        },
        { provide: AlbumesService, useValue: albumesMock },
        { provide: PagosService, useValue: pagosMock },
        ...[],
        provideIcons({
          phosphorArrowLeftFill,
          phosphorArrowRightFill,
          phosphorCheckFill,
          phosphorSealCheckFill,
          phosphorSpinnerGapFill,
          phosphorWarningCircleFill,
          phosphorXFill,
        }),
      ],
    }).compileComponents();
  });

  const elemento = (harness: RouterTestingHarness): HTMLElement =>
    harness.fixture.nativeElement as HTMLElement;

  /** El logo del header solo es un enlace cuando el alta ya terminó. */
  const logoEsEnlace = (harness: RouterTestingHarness): boolean =>
    !!elemento(harness).querySelector('a[aria-label="Ir al panel de empresa"]');

  /** Hace clic en un botón por su texto y espera a que el router termine de navegar. */
  const clickYEsperar = async (harness: RouterTestingHarness, texto: string): Promise<void> => {
    const router = TestBed.inject(Router);
    const boton = [...elemento(harness).querySelectorAll('button')].find((b) =>
      b.textContent?.includes(texto),
    );
    expect(boton).toBeTruthy();

    const fin = new Promise<void>((resolve) => {
      const sub = router.events.subscribe((evento) => {
        if (
          evento instanceof NavigationEnd ||
          evento instanceof NavigationError ||
          evento instanceof NavigationCancel
        ) {
          sub.unsubscribe();
          resolve();
        }
      });
      // Red de seguridad: si el clic no navega, no colgar el test.
      setTimeout(() => {
        sub.unsubscribe();
        resolve();
      }, 2000);
    });

    boton!.click();
    harness.detectChanges();
    await fin;
    harness.detectChanges();
  };

  const cargarMarcaCompleta = (): void => {
    const borrador = TestBed.inject(AlbumBorrador);
    borrador.nombreMarca.set('ACME');
    borrador.logo.set(new File(['logo'], 'logo.png', { type: 'image/png' }));
  };

  const cargarIdentidadCompleta = (): void => {
    const borrador = TestBed.inject(AlbumBorrador);
    borrador.descripcion.set('Somos una marca de prueba.');
    borrador.usuarioRedSocial.set('@acme');
    borrador.emailContacto.set('contacto@acme.com');
    borrador.categoria.set('1');
    borrador.fechaInicio.set('2026-11-01');
    borrador.fechaFin.set('2026-12-01');
  };

  it('mantiene el logo inerte durante todo el alta y lo habilita en el paso final', async () => {
    const harness = await RouterTestingHarness.create('/empresa');
    harness.detectChanges();
    expect(logoEsEnlace(harness)).toBe(false);

    await harness.navigateByUrl('/empresa/album/pago/exito?payment_id=999&external_reference=REF-1');
    harness.detectChanges();
    expect(logoEsEnlace(harness)).toBe(false);

    await harness.navigateByUrl('/empresa/album/crear/marca');
    harness.detectChanges();
    expect(logoEsEnlace(harness)).toBe(false);

    cargarMarcaCompleta();
    await harness.navigateByUrl('/empresa/album/crear/identidad');
    harness.detectChanges();
    expect(logoEsEnlace(harness)).toBe(false);

    await harness.navigateByUrl('/empresa/album/crear/listo');
    harness.detectChanges();
    expect(logoEsEnlace(harness)).toBe(true);
  });

  it('lleva del pago verificado al paso 3 (no vuelve a elegir plan)', async () => {
    const harness = await RouterTestingHarness.create(
      '/empresa/album/pago/exito?payment_id=999&external_reference=REF-1',
    );
    harness.detectChanges();

    await clickYEsperar(harness, 'Crear mi álbum');

    expect(TestBed.inject(Router).url).toBe('/empresa/album/crear/marca');
  });

  it('confirma el pago aunque falle la confirmación directa, consultando el estado guardado', async () => {
    pagosMock.confirmarPago.mockReturnValue(throwError(() => new Error('MP no responde')));

    const harness = await RouterTestingHarness.create(
      '/empresa/album/pago/exito?payment_id=999&external_reference=REF-1',
    );
    harness.detectChanges();

    await clickYEsperar(harness, 'Crear mi álbum');

    expect(TestBed.inject(Router).url).toBe('/empresa/album/crear/marca');
  });

  it('no muestra el botón de crear álbum si el pago no se pudo verificar', async () => {
    pagosMock.confirmarPago.mockReturnValue(throwError(() => new Error('caído')));
    pagosMock.obtenerPago.mockReturnValue(throwError(() => new Error('caído')));

    const harness = await RouterTestingHarness.create(
      '/empresa/album/pago/exito?payment_id=999&external_reference=REF-1',
    );
    harness.detectChanges();

    const texto = elemento(harness).textContent ?? '';
    expect(texto).not.toContain('Crear mi álbum');
  });

  it('llega al paso 5 al crear el álbum aunque falle la revalidación del pago', async () => {
    const harness = await RouterTestingHarness.create(
      '/empresa/album/pago/exito?payment_id=999&external_reference=REF-1',
    );
    harness.detectChanges();

    cargarMarcaCompleta();
    cargarIdentidadCompleta();
    await harness.navigateByUrl('/empresa/album/crear/identidad');
    harness.detectChanges();

    // El backend deja de responder la revalidación justo al crear el álbum.
    pagosMock.obtenerPago.mockReturnValue(throwError(() => new Error('caído')));

    const formulario = elemento(harness).querySelector('form');
    expect(formulario).toBeTruthy();
    formulario!.dispatchEvent(new Event('submit'));
    harness.detectChanges();
    await Promise.resolve();
    harness.detectChanges();

    expect(TestBed.inject(Router).url).toBe('/empresa/album/crear/listo');
  });
});
