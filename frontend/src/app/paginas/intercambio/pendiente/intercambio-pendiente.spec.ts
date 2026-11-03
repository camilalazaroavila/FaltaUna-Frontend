import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { IntercambioPendiente } from './intercambio-pendiente';
import { IntercambioService } from '@servicios/intercambio.service';
import { AuthService } from '@servicios/auth.service';

describe('IntercambioPendiente', () => {
  let fixture: ComponentFixture<IntercambioPendiente>;
  let component: IntercambioPendiente;
  let router: Router;

  const mockIntercambioPendiente = {
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
        cartaNombre: 'Super-Grido',
        cartaRarezaId: 4,
        cartaRareza: 'legendaria',
        cartaImagenUrl: '/supergrido.png',
      },
    ],
  };

  const mockIntercambioEnRevision = {
    id: 2,
    estado: 'EN_REVISION',
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
        cartaNombre: 'Super-Grido',
        cartaRarezaId: 4,
        cartaRareza: 'legendaria',
        cartaImagenUrl: '/supergrido.png',
      },
      {
        usuarioId: 20,
        cartaId: 5,
        cartaNombre: 'Danonino',
        cartaRarezaId: 1,
        cartaRareza: 'comun',
        cartaImagenUrl: '/danonino.png',
      },
    ],
  };

  const mockIntercambioAceptado = {
    ...mockIntercambioEnRevision,
    id: 3,
    estado: 'ACEPTADO',
  };

  const usuarioActualSignal = signal<any>({ id: 10, nombreUsuario: 'UsuarioA' });

  const intercambioServiceMock = {
    obtenerIntercambioPorId: jest.fn().mockReturnValue(of(mockIntercambioPendiente)),
    calcularDiasRestantes: jest.fn().mockReturnValue(3),
    coleccionistaSeleccionado: jest.fn().mockReturnValue(null),
    cartaOfrecida: jest.fn().mockReturnValue(null),
    confirmarIntercambio: jest.fn().mockReturnValue(of({ mensaje: 'Intercambio confirmado con éxito.' })),
    rechazarIntercambio: jest.fn().mockReturnValue(of({ mensaje: 'Intercambio rechazado.' })),
    archivarIntercambioCompletado: jest.fn(),
  };

  const authServiceMock = {
    usuarioActual: usuarioActualSignal,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    usuarioActualSignal.set({ id: 10, nombreUsuario: 'UsuarioA' });
    intercambioServiceMock.obtenerIntercambioPorId.mockReturnValue(of(mockIntercambioPendiente));

    const activatedRouteMock = {
      snapshot: {
        paramMap: convertToParamMap({ id: '1' }),
        queryParamMap: convertToParamMap({}),
      },
      paramMap: of(convertToParamMap({ id: '1' })),
      queryParamMap: of(convertToParamMap({})),
    };

    await TestBed.configureTestingModule({
      imports: [IntercambioPendiente],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: IntercambioService, useValue: intercambioServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(IntercambioPendiente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar etiquetas VOS en carta izquierda y nombre del otro en carta derecha cuando el usuario es ofertante', () => {
    expect(component['etiquetaCartaIzquierda']()).toBe('VOS');
    expect(component['etiquetaCartaDerecha']()).toBe('PillowPilar');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('VOS');
    expect(compiled.textContent).toContain('PillowPilar');
  });

  it('debe mostrar el nombre del otro usuario y los días restantes cuando está PENDIENTE', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('PillowPilar aún no ha elegido una carta');
    expect(compiled.textContent).toContain('3 días');
  });

  describe('Cuando el intercambio está EN_REVISION', () => {
    beforeEach(() => {
      intercambioServiceMock.obtenerIntercambioPorId.mockReturnValue(of(mockIntercambioEnRevision));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('debe mostrar opciones de Aceptar y Rechazar si el usuario actual es el Ofertante', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('ha seleccionado una carta a cambio de la tuya');
      expect(compiled.textContent).toContain('Aceptar');
      expect(compiled.textContent).toContain('Rechazar');
    });

    it('debe abrir modal de confirmación al presionar Rechazar y rechazar la oferta al confirmar', () => {
      component.abrirModalRechazo();
      fixture.detectChanges();

      expect(component['modalRechazoAbierto']()).toBe(true);

      component.confirmarRechazo();
      expect(intercambioServiceMock.rechazarIntercambio).toHaveBeenCalledWith(2);
      expect(router.navigate).toHaveBeenCalledWith(['/usuario/intercambio/activos']);
    });

    it('al presionar Aceptar debe confirmar el intercambio e iniciar la animación', fakeAsync(() => {
      component.confirmar();
      expect(intercambioServiceMock.confirmarIntercambio).toHaveBeenCalledWith(2);
      expect(component['faseAnimacion']()).toBe('animando');
      expect(component['animacionPaso']()).toBe('temblando');

      // Paso intermedio: cruce
      tick(800);
      expect(component['animacionPaso']()).toBe('cruzando');

      // Paso aterrizado
      tick(1200);
      expect(component['animacionPaso']()).toBe('aterrizado');

      // Paso conseguiste
      tick(1000);
      expect(component['faseAnimacion']()).toBe('conseguiste');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('CONSEGUISTE');
      expect(compiled.textContent).toContain('Tocá en cualquier parte para continuar');

      // Al tocar la pantalla, archiva y redirige a activos
      component.finalizarYSalir();
      expect(intercambioServiceMock.archivarIntercambioCompletado).toHaveBeenCalledWith(2);
      expect(router.navigate).toHaveBeenCalledWith(['/usuario/intercambio/activos']);
    }));
  });

  describe('Cuando el usuario actual es el Receptor (User B)', () => {
    beforeEach(() => {
      usuarioActualSignal.set({ id: 20, nombreUsuario: 'PillowPilar' });
      intercambioServiceMock.obtenerIntercambioPorId.mockReturnValue(of(mockIntercambioEnRevision));
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('debe mostrar a UsuarioA a la izquierda y VOS a la derecha', () => {
      expect(component['etiquetaCartaIzquierda']()).toBe('UsuarioA');
      expect(component['etiquetaCartaDerecha']()).toBe('VOS');
    });

    it('en EN_REVISION debe mostrar mensaje de espera sin botones de aceptar ni rechazar', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Ya enviaste tu propuesta. Esperando a que UsuarioA confirme el intercambio');
      expect(compiled.textContent).not.toContain('Aceptar');
      expect(compiled.textContent).not.toContain('Rechazar');
    });
  });

  describe('Cuando el intercambio está ACEPTADO (User B llega a ver la animación)', () => {
    beforeEach(() => {
      usuarioActualSignal.set({ id: 20, nombreUsuario: 'PillowPilar' });
      intercambioServiceMock.obtenerIntercambioPorId.mockReturnValue(of(mockIntercambioAceptado));
    });

    it('debe disparar la animación automáticamente y mostrar la carta recibida', fakeAsync(() => {
      component.ngOnInit();
      fixture.detectChanges();

      tick(700); // Trigger inicial tras cargar
      expect(component['faseAnimacion']()).toBe('animando');

      tick(3000); // Transición a CONSEGUISTE
      fixture.detectChanges();

      expect(component['faseAnimacion']()).toBe('conseguiste');
      expect(component['cartaConseguida']()?.nombre).toBe('Super-Grido');

      component.finalizarYSalir();
      expect(intercambioServiceMock.archivarIntercambioCompletado).toHaveBeenCalledWith(3);
      expect(router.navigate).toHaveBeenCalledWith(['/usuario/intercambio/activos']);
    }));
  });
});
