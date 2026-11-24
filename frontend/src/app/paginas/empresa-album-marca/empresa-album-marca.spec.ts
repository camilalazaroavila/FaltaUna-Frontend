import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { EmpresaAlbumMarca } from './empresa-album-marca';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumesService } from '@servicios/albumes.service';
import { AuthService } from '@servicios/auth.service';
import { PagosService } from '@servicios/pagos.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import { PLANES } from '@modelos/plan.model';

describe('EmpresaAlbumMarca (Given-When-Then)', () => {
  let router: Router;
  let borrador: AlbumBorrador;
  let suscripcionEstado: SuscripcionEstado;
  let mockAlbumesService: {
    obtenerCategorias: jest.Mock;
    guardarMarca: jest.Mock;
  };
  let mockPagosService: {
    iniciarPago: jest.Mock;
    redirigirACheckout: jest.Mock;
  };

  beforeEach(async () => {
    mockAlbumesService = {
      obtenerCategorias: jest.fn().mockReturnValue(
        of([
          { id: 1, nombre: 'Comida' },
          { id: 2, nombre: 'Ropa' },
        ]),
      ),
      guardarMarca: jest.fn().mockReturnValue(of({ ok: true })),
    };

    mockPagosService = {
      iniciarPago: jest.fn().mockReturnValue(
        of({
          urlPago: 'https://mercadopago.com/checkout/mock',
        }),
      ),
      redirigirACheckout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EmpresaAlbumMarca],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AlbumesService, useValue: mockAlbumesService },
        { provide: PagosService, useValue: mockPagosService },
        {
          provide: AuthService,
          useValue: {
            usuarioActual: jest.fn().mockReturnValue({ email: 'test@empresa.com' }),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    borrador = TestBed.inject(AlbumBorrador);
    suscripcionEstado = TestBed.inject(SuscripcionEstado);
    suscripcionEstado.planElegido.set(PLANES[0]); // Plan Básico
  });

  it('Dado el componente Paso 2 sin archivos cargados, Cuando se renderiza, Entonces los iconos + de logo y local son de color blanco', () => {
    // Given & When
    borrador.limpiar();
    const fixture = TestBed.createComponent(EmpresaAlbumMarca);
    fixture.detectChanges();

    // Then
    const el = fixture.nativeElement as HTMLElement;
    const plusIcons = el.querySelectorAll('.font-titulo.text-5xl');
    expect(plusIcons.length).toBeGreaterThanOrEqual(2);
    plusIcons.forEach((icon) => {
      expect(icon.className).toContain('text-white');
    });
  });

  it('Dado un formulario con campos vacíos, Cuando se presiona Siguiente Paso, Entonces no abre el modal de confirmación', () => {
    // Given
    borrador.limpiar();
    const fixture = TestBed.createComponent(EmpresaAlbumMarca);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // When
    (component as unknown as { siguiente: () => void }).siguiente();
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).not.toContain('¿CONTINUAR?');
  });

  it('Dado un formulario con datos de marca y archivos válidos, Cuando se presiona Siguiente Paso, Entonces abre el popup modal de confirmación', () => {
    // Given
    borrador.nombreMarca.set('Havanna');
    borrador.descripcion.set('Alfajores y café');
    borrador.usuarioRedSocial.set('@havanna');
    borrador.emailContacto.set('contacto@havanna.com');
    borrador.categoria.set('1');
    borrador.categoriaNombre.set('Comida');
    borrador.logo.set(new File(['dummy'], 'logo.png', { type: 'image/png' }));
    borrador.fotoLocal.set(new File(['dummy'], 'local.png', { type: 'image/png' }));

    const fixture = TestBed.createComponent(EmpresaAlbumMarca);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // When
    (component as unknown as { siguiente: () => void }).siguiente();
    fixture.detectChanges();

    // Then
    expect(fixture.nativeElement.textContent).toContain('¿CONTINUAR?');
    expect(fixture.nativeElement.textContent).toContain('OMITIR Y PAGAR');
    expect(fixture.nativeElement.textContent).toContain('IR A CREAR ÁLBUM');
  });

  it('Dado el modal de confirmación abierto, Cuando el usuario selecciona "Ir a crear álbum", Entonces navega al Paso 3 de cartas', () => {
    // Given
    const fixture = TestBed.createComponent(EmpresaAlbumMarca);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // When
    (component as unknown as { irACrearAlbum: () => void }).irACrearAlbum();

    // Then
    expect(router.navigate).toHaveBeenCalledWith(['/empresa/album/crear/album']);
  });

  it('Dado el modal de confirmación abierto, Cuando el usuario selecciona "Omitir y pagar", Entonces persiste la marca en el backend y redirige a Mercado Pago', () => {
    // Given
    borrador.nombreMarca.set('Havanna');
    borrador.descripcion.set('Alfajores y café');
    borrador.usuarioRedSocial.set('@havanna');
    borrador.emailContacto.set('contacto@havanna.com');
    borrador.categoria.set('1');
    borrador.categoriaNombre.set('Comida');
    const dummyLogo = new File(['dummy'], 'logo.png', { type: 'image/png' });
    const dummyLocal = new File(['dummy'], 'local.png', { type: 'image/png' });
    borrador.logo.set(dummyLogo);
    borrador.fotoLocal.set(dummyLocal);

    const fixture = TestBed.createComponent(EmpresaAlbumMarca);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // When
    (component as unknown as { omitirYPagar: () => void }).omitirYPagar();

    // Then
    expect(mockAlbumesService.guardarMarca).toHaveBeenCalled();
    expect(mockPagosService.iniciarPago).toHaveBeenCalledWith(PLANES[0].backendId);
    expect(mockPagosService.redirigirACheckout).toHaveBeenCalledWith(
      'https://mercadopago.com/checkout/mock',
    );
  });
});
