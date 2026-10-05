import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
  phosphorCheckFill,
  phosphorSealCheckFill,
  phosphorSpinnerGapFill,
  phosphorWarningCircleFill,
  phosphorXFill,
} from '@ng-icons/phosphor-icons/fill';
import { of } from 'rxjs';
import { EmpresaPagoResultado } from './empresa-pago-resultado';
import { PagosService } from '../../servicios/pagos.service';
import { PagoRespuesta } from '../../modelos/pago.model';

describe('EmpresaPagoResultado', () => {
  const mockPagoAprobado: PagoRespuesta = {
    referenciaExterna: 'PAG-EXT-123',
    estado: 'Aprobado',
    puedePersonalizar: true,
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
    fechaAprobacion: '2026-10-05T12:05:00Z',
  };

  const configurarModulo = async (
    resultadoParam = 'exito',
    queryParams: Record<string, string> = {},
  ) => {
    const mockPagosService = {
      confirmarPago: jest.fn().mockReturnValue(of(mockPagoAprobado)),
      obtenerPago: jest.fn().mockReturnValue(of(mockPagoAprobado)),
      redirigirACheckout: jest.fn(),
    };

    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => (key === 'resultado' ? resultadoParam : null),
        },
        queryParamMap: {
          get: (key: string) => queryParams[key] ?? null,
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [EmpresaPagoResultado],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PagosService, useValue: mockPagosService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        ...provideIcons({
          phosphorSealCheckFill,
          phosphorCheckFill,
          phosphorXFill,
          phosphorWarningCircleFill,
          phosphorSpinnerGapFill,
        }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmpresaPagoResultado);
    return { fixture, component: fixture.componentInstance, mockPagosService };
  };

  it('debe crearse correctamente', async () => {
    const { component } = await configurarModulo('exito');
    expect(component).toBeTruthy();
  });

  it('debe mostrar estado de éxito cuando el pago está aprobado', async () => {
    const { fixture } = await configurarModulo('exito', {
      payment_id: '999888',
      external_reference: 'PAG-EXT-123',
    });
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('¡Pago acreditado con éxito!');
    expect(el.textContent).toContain('Standard');
  });

  it('debe mostrar estado de pendiente cuando resultado es pendiente', async () => {
    const { fixture } = await configurarModulo('pendiente');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Pago pendiente de confirmación');
  });

  it('debe mostrar estado de error cuando resultado es error', async () => {
    const { fixture } = await configurarModulo('error');
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No se pudo procesar el pago');
  });
});
