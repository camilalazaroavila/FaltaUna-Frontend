import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EmpresaPlanes } from './empresa-planes';
import { AuthService } from '@servicios/auth.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import { PLANES } from '@modelos/plan.model';

describe('EmpresaPlanes (Given-When-Then)', () => {
  let mockAuthService: { estaAutenticado: jest.Mock };
  let router: Router;
  let suscripcionEstado: SuscripcionEstado;

  beforeEach(async () => {
    mockAuthService = {
      estaAutenticado: jest.fn().mockReturnValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [EmpresaPlanes],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);
    suscripcionEstado = TestBed.inject(SuscripcionEstado);
  });

  it('Dado el componente EmpresaPlanes, Cuando se inicializa, Entonces lista los 3 planes con el diseño acordado y sin botón volver', () => {
    // Given
    const fixture = TestBed.createComponent(EmpresaPlanes);

    // When
    fixture.detectChanges();

    // Then
    expect(fixture.componentInstance).toBeTruthy();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Elegí tu plan');
    expect(el.textContent).toContain('BÁSICO');
    expect(el.textContent).toContain('STANDARD');
    expect(el.textContent).toContain('PREMIUM');
    // No debe tener enlace de volver
    expect(el.querySelector('a[href*="volver"]')).toBeNull();
    // La lista de beneficios debe estar centrada respecto a la tarjeta
    expect(el.querySelector('ul')?.className).toContain('mx-auto');
  });

  it('Dado un usuario autenticado, Cuando elige el Plan Básico, Entonces guarda el plan en estado y navega a Tu Marca (Paso 2)', () => {
    // Given
    const fixture = TestBed.createComponent(EmpresaPlanes);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const planBasico = PLANES[0];

    // When
    (component as unknown as { elegirPlan: (p: unknown) => void }).elegirPlan(planBasico);

    // Then
    expect(suscripcionEstado.planElegido()?.id).toBe('basico');
    expect(router.navigate).toHaveBeenCalledWith(['/empresa/album/crear/marca']);
  });
});
