import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { IntercambioActivos } from './intercambio-activos';
import { IntercambioService } from '@servicios/intercambio.service';
import { AuthService } from '@servicios/auth.service';
import type { IntercambioActivoApi } from '@modelos/intercambio.model';

describe('IntercambioActivos', () => {
  let fixture: ComponentFixture<IntercambioActivos>;
  let component: IntercambioActivos;
  let router: Router;

  const mockIntercambios: IntercambioActivoApi[] = [
    {
      id: 1,
      estado: 'PENDIENTE',
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 3 * 86400000).toISOString(),
      usuarioOfertanteId: 10,
      usuarioOfertanteNombre: 'UsuarioA',
      usuarioReceptorId: 20,
      usuarioReceptorNombre: 'PillowPilar',
      cartas: [
        {
          usuarioId: 10,
          cartaId: 1,
          cartaNombre: 'Danonino',
          cartaRarezaId: 1,
          cartaRareza: 'comun',
          cartaImagenUrl: '/danonino.png',
        },
      ],
    },
    {
      id: 2,
      estado: 'PENDIENTE',
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 2 * 86400000).toISOString(),
      usuarioOfertanteId: 30,
      usuarioOfertanteNombre: 'Totori',
      usuarioReceptorId: 10,
      usuarioReceptorNombre: 'UsuarioA',
      cartas: [
        {
          usuarioId: 30,
          cartaId: 2,
          cartaNombre: 'Super-Grido',
          cartaRarezaId: 4,
          cartaRareza: 'legendaria',
          cartaImagenUrl: '/supergrido.png',
        },
      ],
    },
  ];

  const intercambioServiceMock = {
    obtenerIntercambiosActivos: jest.fn().mockReturnValue(of(mockIntercambios)),
    calcularDiasRestantes: jest.fn().mockReturnValue(3),
    marcarMenuIntercambioVisto: jest.fn(),
    marcarIntercambioVisto: jest.fn(),
    tieneActualizacionPendiente: jest.fn().mockReturnValue(true),
    esIntercambioNovedad: jest.fn().mockReturnValue(true),
  };

  const authServiceMock = {
    usuarioActual: jest.fn().mockReturnValue({ id: 10, nombreUsuario: 'UsuarioA' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntercambioActivos],
      providers: [
        provideRouter([]),
        { provide: IntercambioService, useValue: intercambioServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(IntercambioActivos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe iniciar en la pestaña enviadas y mostrar a PillowPilar', () => {
    expect(component['pestanaActiva']()).toBe('enviadas');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('PillowPilar');
    expect(compiled.textContent).toContain('INTERCAMBIO CON');
    expect(compiled.textContent).toContain('Ofreciste:');
  });

  it('debe cambiar a recibidas y mostrar a Totori con Te ha ofrecido', () => {
    component.cambiarPestana('recibidas');
    fixture.detectChanges();

    expect(component['pestanaActiva']()).toBe('recibidas');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Totori');
    expect(compiled.textContent).toContain('Te ha ofrecido:');
  });

  it('al pulsar VER en enviadas debe navegar a la vista de pendiente', () => {
    const item = mockIntercambios[0];
    component.verDetalleIntercambio(item);
    expect(router.navigate).toHaveBeenCalledWith(['/usuario/intercambio/pendiente', 1]);
  });

  it('al pulsar VER en recibidas debe navegar a responder', () => {
    component.cambiarPestana('recibidas');
    const item = mockIntercambios[1];
    component.verDetalleIntercambio(item);
    expect(intercambioServiceMock.marcarIntercambioVisto).toHaveBeenCalledWith(2, 'PENDIENTE');
    expect(router.navigate).toHaveBeenCalledWith(['/usuario/intercambio/responder', 2]);
  });
});
