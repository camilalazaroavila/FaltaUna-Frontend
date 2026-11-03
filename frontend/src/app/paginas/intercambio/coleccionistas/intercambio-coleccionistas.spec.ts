import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { IntercambioColeccionistas } from './intercambio-coleccionistas';
import { IntercambioService } from '@servicios/intercambio.service';
import type { Coleccionista } from '@modelos/intercambio.model';

describe('IntercambioColeccionistas', () => {
  let component: IntercambioColeccionistas;
  let fixture: ComponentFixture<IntercambioColeccionistas>;
  let intercambioServiceMock: {
    obtenerColeccionistas: jest.Mock;
    obtenerCategorias: jest.Mock;
    obtenerColecciones: jest.Mock;
    seleccionarColeccionista: jest.Mock;
  };
  let router: Router;

  const coleccionistasMock: Coleccionista[] = [
    {
      id: 10,
      nombreUsuario: 'MaertinConFavoritas',
      email: 'm@test.com',
      coincidenciasFavoritas: 2,
      coincidenciasIntercambiables: 2,
      mensajeEstado: '★ Tiene 2 cartas deseadas',
    },
    {
      id: 11,
      nombreUsuario: 'PedroPedroPe',
      email: 'p@test.com',
      mensajeEstado: 'Necesito Spiderman',
    },
  ];

  beforeEach(async () => {
    intercambioServiceMock = {
      obtenerColeccionistas: jest.fn().mockReturnValue(of(coleccionistasMock)),
      obtenerCategorias: jest.fn().mockReturnValue(of([{ id: 1, nombre: 'Gastronomía' }])),
      obtenerColecciones: jest.fn().mockReturnValue(of([{ id: 5, nombre: 'Marvel', categoriaId: 1 }])),
      seleccionarColeccionista: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [IntercambioColeccionistas],
      providers: [
        provideRouter([]),
        { provide: IntercambioService, useValue: intercambioServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));

    fixture = TestBed.createComponent(IntercambioColeccionistas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar los usuarios obtenidos del servicio', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('MaertinConFavoritas');
    expect(compiled.textContent).toContain('PedroPedroPe');
  });

  it('debe mostrar el badge de cartas favoritas para usuarios con coincidencias', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('★ 2 deseadas');
  });

  it('debe contener las secciones de filtro Álbumes y Categorías con checkboxes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Álbumes');
    expect(compiled.textContent).toContain('Categorías');
  });

  it('al activar o desactivar checkbox de categoría debe recargar coleccionistas con el filtro', () => {
    component.toggleFiltroCategoria(1);
    expect(intercambioServiceMock.obtenerColeccionistas).toHaveBeenCalledWith({
      categoriaId: 1,
      coleccionId: null,
    });
    expect(component['categoriaSeleccionadaId']()).toBe(1);

    // Al volver a hacer clic en el mismo checkbox, debe desmarcarlo
    component.toggleFiltroCategoria(1);
    expect(intercambioServiceMock.obtenerColeccionistas).toHaveBeenCalledWith({
      categoriaId: null,
      coleccionId: null,
    });
    expect(component['categoriaSeleccionadaId']()).toBeNull();
  });

  it('al activar o desactivar checkbox de álbum debe recargar coleccionistas con el filtro', () => {
    component.toggleFiltroColeccion(5);
    expect(intercambioServiceMock.obtenerColeccionistas).toHaveBeenCalledWith({
      categoriaId: null,
      coleccionId: 5,
    });
    expect(component['coleccionSeleccionadaId']()).toBe(5);

    // Al volver a hacer clic en el mismo checkbox, debe desmarcarlo
    component.toggleFiltroColeccion(5);
    expect(intercambioServiceMock.obtenerColeccionistas).toHaveBeenCalledWith({
      categoriaId: null,
      coleccionId: null,
    });
    expect(component['coleccionSeleccionadaId']()).toBeNull();
  });

  it('al presionar Intercambiar debe seleccionar el coleccionista y navegar a ofrecer carta', () => {
    const botonIntercambiar = fixture.nativeElement.querySelector(
      'article button',
    ) as HTMLButtonElement;
    botonIntercambiar.click();

    expect(intercambioServiceMock.seleccionarColeccionista).toHaveBeenCalledWith(
      coleccionistasMock[0],
    );
    expect(router.navigate).toHaveBeenCalledWith([
      '/usuario/intercambio/ofrecer',
      10,
    ]);
  });
});
