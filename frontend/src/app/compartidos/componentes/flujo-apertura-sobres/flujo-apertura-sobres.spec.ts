import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { FlujoAperturaSobres } from './flujo-apertura-sobres';
import { SobresService } from '../../../servicios/sobres.service';
import { AuthService } from '../../../servicios/auth.service';
import { AperturaSobreRespuesta, SobreRespuesta } from '../../../modelos/sobre.model';

describe('FlujoAperturaSobres Component', () => {
  let component: FlujoAperturaSobres;
  let fixture: ComponentFixture<FlujoAperturaSobres>;
  let sobresServiceSpy: jest.Mocked<SobresService>;
  let authServiceMock: Partial<AuthService>;

  const mockSobres: SobreRespuesta[] = [
    {
      id: 1,
      nombre: 'Sobre Clásico',
      tipo: 'GENERAL',
      precio: 100,
      cantidadCartas: 4,
    },
    {
      id: 2,
      nombre: 'Sobre Grido',
      tipo: 'MARCA',
      marca: 'Grido',
      precio: 200,
      cantidadCartas: 4,
    },
  ];

  const mockApertura: AperturaSobreRespuesta = {
    id: 1,
    sobreId: 1,
    fecha: '2026-10-08T00:00:00Z',
    cartas: [
      {
        cartaId: 101,
        nombre: 'Super Grido',
        cantidad: 1,
        imagenUrl: null,
      },
    ],
  };

  beforeEach(async () => {
    sobresServiceSpy = {
      obtenerSobres: jest.fn().mockReturnValue(of(mockSobres)),
      abrirSobre: jest.fn().mockReturnValue(of(mockApertura)),
      reclamarSobreDiario: jest.fn().mockReturnValue(of(mockApertura)),
    } as unknown as jest.Mocked<SobresService>;

    authServiceMock = {
      usuarioActual: jest.fn().mockReturnValue({
        id: 7,
        nombreUsuario: 'testuser',
        email: 'test@faltauna.com',
        rol: 'Usuario',
        fechaRegistro: '2026-01-01',
        oro: 100,
        monedasIntercambio: 50,
      }),
    };

    await TestBed.configureTestingModule({
      imports: [FlujoAperturaSobres],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SobresService, useValue: sobresServiceSpy },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FlujoAperturaSobres);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('abierto', true);
    fixture.componentRef.setInput('sobresCatalogo', mockSobres);
    fixture.componentRef.setInput('sobresDiariosDisponibles', 2);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe incluir los 2 sobres diarios y los sobres del catalogo en listaSobresUI', () => {
    const lista = component['listaSobresUI']();
    expect(lista.length).toBe(4); // 2 Diarios + 2 del catálogo
    expect(lista[0].esDiario).toBe(true);
    expect(lista[0].etiqueta).toBe('GRATIS');
    expect(lista[1].esDiario).toBe(true);
    expect(lista[1].etiqueta).toBe('GRATIS');
    expect(lista[3].etiqueta).toBe('GRIDO');
  });

  it('debe transicionar a preview al seleccionar un sobre', () => {
    const primerSobre = component['listaSobresUI']()[1];
    component.seleccionarSobre(primerSobre);

    expect(component['fase']()).toBe('preview');
    expect(component['sobreSeleccionado']()).toEqual(primerSobre);
  });

  it('debe transicionar a carrusel y permitir navegar infinitamente', () => {
    component.irACarrusel();
    expect(component['fase']()).toBe('carrusel');
    expect(component['indiceCarrusel']()).toBe(0);

    component.cambiarSobreCarrusel(1);
    expect(component['indiceCarrusel']()).toBe(1);

    component.cambiarSobreCarrusel(-2);
    expect(component['indiceCarrusel']()).toBe(-1);
  });

  it('debe ejecutar el corte y llamar a la API correspondiente', fakeAsync(() => {
    const sobreDiario = component['listaSobresUI']()[0];
    component.seleccionarSobre(sobreDiario);
    component.elegirSobreDelCarrusel(0);

    expect(component['fase']()).toBe('corte');

    component.ejecutarCorte();
    tick(1000);

    expect(sobresServiceSpy.reclamarSobreDiario).toHaveBeenCalledWith(7);
    expect(component['fase']()).toBe('revelacion');
  }));

  it('debe mostrar cartas de respaldo en caso de que el backend falle', fakeAsync(() => {
    const errorObservable = {
      subscribe: (observer: any) => {
        observer.error(new Error('Conexión fallida con el backend'));
      },
    };
    sobresServiceSpy.reclamarSobreDiario.mockReturnValue(errorObservable as any);

    const sobreDiario = component['listaSobresUI']()[0];
    component.seleccionarSobre(sobreDiario);
    component.elegirSobreDelCarrusel(0);

    component.ejecutarCorte();
    tick(1000);

    expect(component['cartasObtenidas']().length).toBeGreaterThan(0);
    expect(component['fase']()).toBe('revelacion');
  }));

  it('debe navegar el carrusel mediante arrastre/swipe con pointer', () => {
    component.irACarrusel();
    expect(component['indiceCarrusel']()).toBe(0);

    // Arrastre hacia la izquierda (deltaX < -30) debe avanzar al sobre siguiente (+1)
    component.onPointerDownCarrusel({ clientX: 200, pointerId: 1, pointerType: 'mouse', button: 0 } as PointerEvent);
    component.onPointerMoveCarrusel({ clientX: 140, pointerType: 'mouse', buttons: 1 } as PointerEvent);
    expect(component['dragOffset']()).toBe(-60);
    component.onPointerUpCarrusel({ clientX: 140, pointerId: 1, pointerType: 'mouse' } as PointerEvent);
    expect(component['indiceCarrusel']()).toBe(1);

    // Arrastre hacia la derecha (deltaX > 30) debe retroceder al sobre anterior (-1)
    component.onPointerDownCarrusel({ clientX: 100, pointerId: 1, pointerType: 'mouse', button: 0 } as PointerEvent);
    component.onPointerMoveCarrusel({ clientX: 180, pointerType: 'mouse', buttons: 1 } as PointerEvent);
    expect(component['dragOffset']()).toBe(80);
    component.onPointerUpCarrusel({ clientX: 180, pointerId: 1, pointerType: 'mouse' } as PointerEvent);
    expect(component['indiceCarrusel']()).toBe(0);
  });

  it('no debe activar arrastre cuando se mueve el mouse sin presionar boton (hover)', () => {
    component.irACarrusel();
    expect(component['indiceCarrusel']()).toBe(0);

    // Movimiento de mouse sin haber hecho pointerdown
    component.onPointerMoveCarrusel({ clientX: 300, pointerType: 'mouse', buttons: 0 } as PointerEvent);
    expect(component['dragOffset']()).toBe(0);
    expect(component['indiceCarrusel']()).toBe(0);
  });

  it('debe permitir deslizar sobre la linea de corte para abrir el sobre', fakeAsync(() => {
    const sobreDiario = component['listaSobresUI']()[0];
    component.seleccionarSobre(sobreDiario);
    component.elegirSobreDelCarrusel(0);
    expect(component['fase']()).toBe('corte');

    // Deslizamiento horizontal sobre la línea de corte
    component.onPointerDownCorte({ clientX: 50, pointerId: 1 } as PointerEvent);
    component.onPointerMoveCorte({ clientX: 90 } as PointerEvent); // deltaX = 40 (> 20)
    component.onPointerUpCorte();

    tick(1000);
    expect(sobresServiceSpy.reclamarSobreDiario).toHaveBeenCalledWith(7);
    expect(component['fase']()).toBe('revelacion');
  }));

  it('debe centrar sobre lateral si se clickea un sobre no centrado en el carrusel', () => {
    component.irACarrusel();
    expect(component['indiceCarrusel']()).toBe(0);

    // Clic en sobre con offset relativo +1
    component.elegirSobreDelCarrusel(1);
    expect(component['indiceCarrusel']()).toBe(1);
    expect(component['fase']()).toBe('carrusel');
  });

  it('debe seleccionar sobre y pasar a fase corte al hacer clic en sobre central con alHacerClicSobre', () => {
    component.irACarrusel();
    expect(component['fase']()).toBe('carrusel');

    // Clic en sobre central (rel = 0)
    component.alHacerClicSobre(0);
    expect(component['fase']()).toBe('corte');
  });

  it('debe cerrar el flujo al emitir cerrarFlujo', () => {
    const spyCerrar = jest.spyOn(component.cerrar, 'emit');
    component.cerrarFlujo();
    expect(component['fase']()).toBe('cerrado');
    expect(spyCerrar).toHaveBeenCalled();
  });
});
