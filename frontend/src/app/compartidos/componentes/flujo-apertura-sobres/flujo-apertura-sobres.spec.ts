import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  it('debe incluir el sobre diario y los sobres del catalogo en listaSobresUI', () => {
    const lista = component['listaSobresUI']();
    expect(lista.length).toBe(3); // Diario + 2 del catálogo
    expect(lista[0].esDiario).toBe(true);
    expect(lista[0].etiqueta).toBe('GRATIS');
    expect(lista[2].etiqueta).toBe('GRIDO');
  });

  it('debe transicionar a preview al seleccionar un sobre', () => {
    const primerSobre = component['listaSobresUI']()[1];
    component.seleccionarSobre(primerSobre);

    expect(component['fase']()).toBe('preview');
    expect(component['sobreSeleccionado']()).toEqual(primerSobre);
  });

  it('debe transicionar a carrusel y permitir cambiar sobres', () => {
    component.irACarrusel();
    expect(component['fase']()).toBe('carrusel');
    expect(component['indiceCarrusel']()).toBe(2);

    component.cambiarSobreCarrusel(1);
    expect(component['indiceCarrusel']()).toBe(3);

    component.cambiarSobreCarrusel(-1);
    expect(component['indiceCarrusel']()).toBe(2);
  });

  it('debe ejecutar el corte y llamar a la API correspondiente', (done) => {
    const sobreDiario = component['listaSobresUI']()[0];
    component.seleccionarSobre(sobreDiario);
    component.elegirSobreDelCarrusel(2);

    expect(component['fase']()).toBe('corte');

    component.ejecutarCorte();

    setTimeout(() => {
      expect(sobresServiceSpy.reclamarSobreDiario).toHaveBeenCalledWith(7);
      done();
    }, 550);
  });

  it('debe cerrar el flujo al emitir cerrarFlujo', () => {
    const spyCerrar = jest.spyOn(component.cerrar, 'emit');
    component.cerrarFlujo();
    expect(component['fase']()).toBe('cerrado');
    expect(spyCerrar).toHaveBeenCalled();
  });
});
