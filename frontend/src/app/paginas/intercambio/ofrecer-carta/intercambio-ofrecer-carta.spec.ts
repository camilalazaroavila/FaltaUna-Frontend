import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { IntercambioOfrecerCarta } from './intercambio-ofrecer-carta';
import { IntercambioService } from '@servicios/intercambio.service';
import type { Carta } from '@modelos/carta.model';

describe('IntercambioOfrecerCarta', () => {
  let component: IntercambioOfrecerCarta;
  let fixture: ComponentFixture<IntercambioOfrecerCarta>;
  let intercambioServiceMock: {
    obtenerCartasRepetidas: jest.Mock;
    obtenerCartasFavoritasDeColeccionista: jest.Mock;
    obtenerColeccionistaPorId: jest.Mock;
    coleccionistaSeleccionado: jest.Mock;
    seleccionarCarta: jest.Mock;
    limpiarSeleccion: jest.Mock;
  };

  const cartasRepetidasMock: Carta[] = [
    {
      id: '1',
      nombre: 'Guacamola',
      imagenUrl: '',
      rareza: 'epicarta',
      categoria: 'gastronomia',
      atributoDerecho: 4,
      atributoIzquierdo: 5,
      obtenida: true,
    },
    {
      id: '2',
      nombre: 'Danonino',
      imagenUrl: '',
      rareza: 'comun',
      categoria: 'gastronomia',
      atributoDerecho: 2,
      atributoIzquierdo: 1,
      obtenida: true,
    },
  ];

  beforeEach(async () => {
    intercambioServiceMock = {
      obtenerCartasRepetidas: jest.fn().mockReturnValue(of(cartasRepetidasMock)),
      obtenerCartasFavoritasDeColeccionista: jest.fn().mockReturnValue(of([])),
      obtenerColeccionistaPorId: jest.fn().mockReturnValue(of({ id: 10, nombreUsuario: 'Maertin400' })),
      coleccionistaSeleccionado: jest.fn().mockReturnValue({ id: 10, nombreUsuario: 'Maertin400' }),
      seleccionarCarta: jest.fn(),
      limpiarSeleccion: jest.fn(),
      crearIntercambio: jest.fn().mockReturnValue(
        of({ id: 1, estado: 'PENDIENTE', fechaCreacion: '', fechaVencimiento: '' }),
      ),
      responderIntercambio: jest.fn().mockReturnValue(
        of({ id: 1, estado: 'EN_REVISION', fechaCreacion: '', fechaVencimiento: '' }),
      ),
    };

    const activatedRouteMock = {
      snapshot: {
        paramMap: convertToParamMap({ coleccionistaId: '10' }),
        queryParamMap: convertToParamMap({}),
      },
      paramMap: of(convertToParamMap({ coleccionistaId: '10' })),
      queryParamMap: of(convertToParamMap({})),
    };

    await TestBed.configureTestingModule({
      imports: [IntercambioOfrecerCarta],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: IntercambioService, useValue: intercambioServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IntercambioOfrecerCarta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('inicialmente debe mostrar el mensaje para elegir carta', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Elegí la carta que querés intercambiar');
  });

  it('al seleccionar una carta, debe mostrar la confirmación con botones Sí y No', () => {
    component.seleccionarCarta(cartasRepetidasMock[0]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('¿Estás seguro de que querés intercambiar esta carta?');
    expect(compiled.textContent).toContain('Sí');
    expect(compiled.textContent).toContain('No');
  });

  it('al presionar No, debe cancelar la selección y volver al estado inicial', () => {
    component.seleccionarCarta(cartasRepetidasMock[0]);
    fixture.detectChanges();

    component.cancelarSeleccion();
    fixture.detectChanges();

    expect(component['cartaSeleccionada']()).toBeNull();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Elegí la carta que querés intercambiar');
  });

  it('al presionar Sí, debe confirmar y guardar la carta en el servicio', () => {
    component.seleccionarCarta(cartasRepetidasMock[0]);
    fixture.detectChanges();

    component.confirmarSeleccion();
    fixture.detectChanges();

    expect(intercambioServiceMock.seleccionarCarta).toHaveBeenCalledWith(cartasRepetidasMock[0]);
    expect(intercambioServiceMock.crearIntercambio).toHaveBeenCalledWith({
      usuarioReceptorId: 10,
      cartaId: 1,
    });
  });

  it('debe abrir y cerrar el modal de cartas favoritas', () => {
    expect(component['modalFavoritasAbierto']()).toBe(false);

    component.abrirModalFavoritas();
    expect(component['modalFavoritasAbierto']()).toBe(true);

    component.cerrarModalFavoritas();
    expect(component['modalFavoritasAbierto']()).toBe(false);
  });

  it('debe abrir y cerrar el popup de detalle de una carta', () => {
    expect(component['cartaDetallePopup']()).toBeNull();

    component.abrirDetalleCarta(cartasRepetidasMock[0]);
    expect(component['cartaDetallePopup']()).toBe(cartasRepetidasMock[0]);

    component.cerrarDetalleCarta();
    expect(component['cartaDetallePopup']()).toBeNull();
  });

  it('debe detectar correctamente si tiene repetida una carta', () => {
    expect(component.tengoRepetida('1')).toBe(true);
    expect(component.tengoRepetida('999')).toBe(false);
  });

  it('debe ordenar las cartas repetidas ubicando primeras las deseadas por el otro coleccionista', () => {
    // Si la favorita es la carta id '2' (Danonino), debe quedar antes que la '1' (Guacamola)
    component['cartasFavoritas'].set([
      {
        id: '2',
        nombre: 'Danonino',
        imagenUrl: '',
        rareza: 'comun',
        categoria: 'gastronomia',
        atributoDerecho: 2,
        atributoIzquierdo: 1,
        obtenida: true,
      },
    ]);
    fixture.detectChanges();

    const ordenadas = component['cartasRepetidasOrdenadas']();
    expect(ordenadas[0].id).toBe('2');
    expect(ordenadas[1].id).toBe('1');
    expect(component.esFavoritaDelOtro('2')).toBe(true);
    expect(component.esFavoritaDelOtro('1')).toBe(false);
  });
});
