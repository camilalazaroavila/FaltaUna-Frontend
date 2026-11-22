import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { routes } from '@app/app.routes';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumesService } from '@servicios/albumes.service';
import { AuthService } from '@servicios/auth.service';
import { PagosService } from '@servicios/pagos.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import { PLANES } from '@modelos/plan.model';

describe('Flujo de alta de empresa (5 pasos - Given-When-Then)', () => {
  let pagosMock: {
    iniciarPago: jest.Mock;
    redirigirACheckout: jest.Mock;
  };
  let albumesMock: {
    obtenerCategorias: jest.Mock;
    guardarMarca: jest.Mock;
    crearBorrador: jest.Mock;
    obtenerRarezas: jest.Mock;
    pagar: jest.Mock;
  };
  let authMock: {
    estaAutenticado: jest.Mock;
    usuarioActual: jest.Mock;
    rolActual: jest.Mock;
  };

  beforeEach(async () => {
    pagosMock = {
      iniciarPago: jest.fn().mockReturnValue(
        of({
          urlPago: 'https://mercadopago.com/checkout/mock',
        }),
      ),
      redirigirACheckout: jest.fn(),
    };

    albumesMock = {
      obtenerCategorias: jest.fn().mockReturnValue(
        of([
          { id: 1, nombre: 'Comida' },
          { id: 2, nombre: 'Ropa' },
        ]),
      ),
      guardarMarca: jest.fn().mockReturnValue(of({ ok: true })),
      crearBorrador: jest.fn().mockReturnValue(
        of({
          id: 100,
          imagenes: [
            { id: 1, rarezaId: 1 },
            { id: 2, rarezaId: 2 },
          ],
        }),
      ),
      obtenerRarezas: jest.fn().mockReturnValue(
        of([
          { id: 1, nombre: 'Común', orden: 1 },
          { id: 2, nombre: 'Rara', orden: 2 },
          { id: 3, nombre: 'Épica', orden: 3 },
          { id: 4, nombre: 'Legendaria', orden: 4 },
        ]),
      ),
      pagar: jest.fn().mockReturnValue(
        of({
          urlPago: 'https://mercadopago.com/checkout/mock',
          pago: { referenciaExterna: 'REF-123' },
        }),
      ),
    };

    authMock = {
      estaAutenticado: jest.fn().mockReturnValue(true),
      usuarioActual: jest.fn().mockReturnValue({ id: 1, email: 'empresa@test.com' }),
      rolActual: jest.fn().mockReturnValue('Empresa'),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PagosService, useValue: pagosMock },
        { provide: AlbumesService, useValue: albumesMock },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();

    TestBed.inject(AlbumBorrador).limpiar();
    TestBed.inject(SuscripcionEstado).planElegido.set(PLANES[0]);
  });

  const elemento = (harness: RouterTestingHarness): HTMLElement =>
    harness.fixture.nativeElement as HTMLElement;

  const logoEsEnlace = (harness: RouterTestingHarness): boolean =>
    !!elemento(harness).querySelector('a[aria-label="Ir al panel de empresa"]');

  it('Dado el recorrido de alta, Cuando la empresa está en los pasos 1 a 4, Entonces el logo del header es inerte, y se habilita recién en el paso final', async () => {
    // Given & When: paso 1
    const harness = await RouterTestingHarness.create('/empresa');
    harness.detectChanges();
    // Then
    expect(logoEsEnlace(harness)).toBe(false);

    // When: paso 2
    await harness.navigateByUrl('/empresa/album/crear/marca');
    harness.detectChanges();
    // Then
    expect(logoEsEnlace(harness)).toBe(false);

    // When: paso final de éxito
    await harness.navigateByUrl('/empresa/album/crear/listo');
    harness.detectChanges();
    // Then
    expect(logoEsEnlace(harness)).toBe(true);
  });

  it('Dado un usuario en el Paso 2 de Tu Marca, Cuando presiona Siguiente Paso con datos válidos, Entonces puede optar por Omitir y Pagar directo a Mercado Pago', async () => {
    // Given
    const borrador = TestBed.inject(AlbumBorrador);
    borrador.nombreMarca.set('Havanna');
    borrador.descripcion.set('Alfajores premium');
    borrador.usuarioRedSocial.set('@havanna');
    borrador.emailContacto.set('contacto@havanna.com');
    borrador.categoria.set('1');
    borrador.categoriaNombre.set('Comida');
    borrador.logo.set(new File(['logo'], 'logo.png', { type: 'image/png' }));
    borrador.fotoLocal.set(new File(['local'], 'local.png', { type: 'image/png' }));

    const harness = await RouterTestingHarness.create('/empresa/album/crear/marca');
    harness.detectChanges();

    // When: hace clic en Siguiente paso y luego en Omitir y Pagar
    const btnSiguiente = elemento(harness).querySelector('button[type="submit"]') as HTMLButtonElement;
    btnSiguiente.click();
    harness.detectChanges();

    const btnOmitir = [...elemento(harness).querySelectorAll('button')].find((b) =>
      b.textContent?.includes('OMITIR Y PAGAR'),
    );
    expect(btnOmitir).toBeTruthy();
    btnOmitir!.click();
    harness.detectChanges();

    // Then: persiste la marca e inicia el pago en Mercado Pago
    expect(albumesMock.guardarMarca).toHaveBeenCalled();
    expect(pagosMock.iniciarPago).toHaveBeenCalledWith(PLANES[0].backendId);
    expect(pagosMock.redirigirACheckout).toHaveBeenCalledWith(
      'https://mercadopago.com/checkout/mock',
    );
  });

  it('Dado el Paso 4 (Visualización Previa), Cuando el usuario pulsa en el lápiz de edición de cartas, Entonces navega al Paso 3 de cartas', async () => {
    // Given
    const borrador = TestBed.inject(AlbumBorrador);
    borrador.nombreMarca.set('Havanna');
    borrador.descripcion.set('Alfajores premium');
    borrador.usuarioRedSocial.set('@havanna');
    borrador.emailContacto.set('contacto@havanna.com');
    borrador.categoria.set('1');
    borrador.categoriaNombre.set('Comida');
    borrador.logo.set(new File(['logo'], 'logo.png', { type: 'image/png' }));
    borrador.fotoLocal.set(new File(['local'], 'local.png', { type: 'image/png' }));
    const cartas = Array(12).fill(null);
    cartas[0] = new File(['c1'], 'c1.png', { type: 'image/png' });
    cartas[1] = new File(['c2'], 'c2.png', { type: 'image/png' });
    borrador.imagenes.set(cartas);

    const harness = await RouterTestingHarness.create('/empresa/album/crear/vista-previa');
    harness.detectChanges();

    // When: presiona el lápiz de cartas
    const btnEditarCartas = elemento(harness).querySelector('button[title="Editar cartas"]') as HTMLButtonElement;
    expect(btnEditarCartas).toBeTruthy();
    btnEditarCartas.click();
    harness.detectChanges();

    // Then
    expect(TestBed.inject(Router).url).toBe('/empresa/album/crear/album');
  });
});
