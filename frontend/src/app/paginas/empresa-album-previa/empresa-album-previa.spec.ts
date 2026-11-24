import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { EmpresaAlbumPrevia } from './empresa-album-previa';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumFlujo } from '@servicios/album-flujo.service';
import { PagosService } from '@servicios/pagos.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import { PLANES } from '@modelos/plan.model';

describe('EmpresaAlbumPrevia (Given-When-Then)', () => {
  let router: Router;
  let borrador: AlbumBorrador;
  let suscripcionEstado: SuscripcionEstado;
  let mockFlujo: {
    guardarBorrador: jest.Mock;
    iniciarPago: jest.Mock;
  };
  let mockPagos: {
    redirigirACheckout: jest.Mock;
  };

  beforeEach(async () => {
    mockFlujo = {
      guardarBorrador: jest.fn().mockReturnValue(of(10)),
      iniciarPago: jest.fn().mockReturnValue(
        of({
          urlPago: 'https://mercadopago.com/checkout/mock',
        }),
      ),
    };
    mockPagos = {
      redirigirACheckout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EmpresaAlbumPrevia],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AlbumFlujo, useValue: mockFlujo },
        { provide: PagosService, useValue: mockPagos },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    borrador = TestBed.inject(AlbumBorrador);
    suscripcionEstado = TestBed.inject(SuscripcionEstado);
    suscripcionEstado.planElegido.set(PLANES[0]);

    // Llenar datos previos requeridos
    borrador.nombreMarca.set('Havanna');
    borrador.descripcion.set('Alfajores y café');
    borrador.usuarioRedSocial.set('@havanna');
    borrador.emailContacto.set('contacto@havanna.com');
    borrador.categoria.set('1');
    borrador.categoriaNombre.set('Comida');
    borrador.logo.set(new File(['dummy'], 'logo.png', { type: 'image/png' }));
    borrador.fotoLocal.set(new File(['dummy'], 'local.png', { type: 'image/png' }));

    const cartas = Array(12).fill(null);
    cartas[0] = new File(['c1'], 'c1.png', { type: 'image/png' });
    cartas[1] = new File(['c2'], 'c2.png', { type: 'image/png' });
    borrador.imagenes.set(cartas);
  });

  it('Dado el componente Paso 4, Cuando se renderiza, Entonces muestra la información y NO contiene ningún elemento de cupón', () => {
    // Given & When
    const fixture = TestBed.createComponent(EmpresaAlbumPrevia);
    fixture.detectChanges();

    // Then
    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Visualización previa');
    expect(texto).toContain('Havanna');
    expect(texto).toContain('Comida');
    expect(texto).toContain('Alfajores y café');
    expect(texto).toContain('FINALIZAR');
    // Sin cupón
    expect(texto).not.toContain('cupón');
    expect(texto).not.toContain('Cupón');
  });

  it('Dado el componente Paso 4 con cartas y nombres cargados, Cuando se renderiza, Entonces muestra app-carta y los nombres de las cartas', () => {
    // Given
    borrador.establecerNombreCarta(0, 'Alfajor Mar');
    const fixture = TestBed.createComponent(EmpresaAlbumPrevia);

    // When
    fixture.detectChanges();

    // Then
    const el = fixture.nativeElement as HTMLElement;
    const cartas = el.querySelectorAll('app-carta');
    expect(cartas.length).toBe(12);
    expect(el.textContent).toContain('Alfajor Mar');
  });

  it('Dado el componente Paso 4, Cuando el usuario presiona el lápiz de edición de marca, Entonces navega al Paso 2', () => {
    // Given
    const fixture = TestBed.createComponent(EmpresaAlbumPrevia);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // When
    (component as unknown as { editarPaso: (p: number) => void }).editarPaso(2);

    // Then
    expect(router.navigate).toHaveBeenCalledWith(['/empresa/album/crear/marca']);
  });

  it('Dado el componente Paso 4, Cuando el usuario presiona Finalizar, Entonces guarda el borrador y redirige a Mercado Pago', () => {
    // Given
    const fixture = TestBed.createComponent(EmpresaAlbumPrevia);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    // When
    (component as unknown as { finalizar: () => void }).finalizar();

    // Then
    expect(mockFlujo.guardarBorrador).toHaveBeenCalled();
    expect(mockFlujo.iniciarPago).toHaveBeenCalled();
    expect(mockPagos.redirigirACheckout).toHaveBeenCalledWith(
      'https://mercadopago.com/checkout/mock',
    );
  });
});
