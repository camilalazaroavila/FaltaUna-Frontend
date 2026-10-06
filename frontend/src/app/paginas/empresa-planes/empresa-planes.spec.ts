import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { EmpresaPlanes } from './empresa-planes';
import { PagosService } from '../../servicios/pagos.service';
import { AuthService } from '../../servicios/auth.service';
import { PLANES } from '../../modelos/plan.model';

describe('EmpresaPlanes', () => {
  let mockPagosService: {
    iniciarPago: jest.Mock;
    redirigirACheckout: jest.Mock;
  };
  let mockAuthService: {
    estaAutenticado: jest.Mock;
    obtenerToken: jest.Mock;
  };

  beforeEach(async () => {
    mockPagosService = {
      iniciarPago: jest.fn().mockReturnValue(
        of({
          urlPago: 'https://mercadopago.com/init',
          pago: {
            referenciaExterna: 'PAG-1',
            estado: 'Pendiente',
            puedePersonalizar: false,
            monto: 15000,
            moneda: 'ARS',
            plan: {
              id: 1,
              codigo: 'BASICO',
              nombre: 'Básico',
              precio: 15000,
              maxCartas: 12,
              incluyeEstadisticas: false,
              masPublicidad: true,
              disenoPersonalizado: false,
            },
            fechaCreacion: '2026-10-05T12:00:00Z',
          },
        }),
      ),
      redirigirACheckout: jest.fn(),
    };

    mockAuthService = {
      estaAutenticado: jest.fn().mockReturnValue(true),
      obtenerToken: jest.fn().mockReturnValue('fake-token'),
    };

    await TestBed.configureTestingModule({
      imports: [EmpresaPlanes],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PagosService, useValue: mockPagosService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();
  });

  it('debe crearse correctamente y listar los planes', () => {
    const fixture = TestBed.createComponent(EmpresaPlanes);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Elegí tu plan');
    expect(el.textContent).toContain('Básico');
    expect(el.textContent).toContain('Standard');
    expect(el.textContent).toContain('Premium');
  });

  it('al elegir plan debe llamar a iniciarPago y redirigir a Mercado Pago', () => {
    const fixture = TestBed.createComponent(EmpresaPlanes);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const planBasico = PLANES[0];
    (component as unknown as { elegirPlan: (p: unknown) => void }).elegirPlan(planBasico);

    expect(mockPagosService.iniciarPago).toHaveBeenCalledWith(planBasico.backendId);
    expect(mockPagosService.redirigirACheckout).toHaveBeenCalledWith(
      'https://mercadopago.com/init',
    );
  });
});
