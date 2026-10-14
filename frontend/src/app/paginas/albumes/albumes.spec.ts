import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { of, throwError } from 'rxjs';

import { Albumes } from './albumes';
import { AlbumesJugadorService } from '../../servicios/albumes-jugador.service';
import { AuthService } from '../../servicios/auth.service';
import type {
  CategoriaAlbum,
  DetalleAlbum,
  ResumenAlbum,
} from '../../modelos/album-jugador.model';

jest.mock('ngx-sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const ICONO = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

const CATEGORIAS: readonly CategoriaAlbum[] = [
  { id: 4, nombre: 'Gastronomía', categoria: 'gastronomia' },
];

const RESUMEN: ResumenAlbum = {
  id: 4,
  marcaNombre: 'Grido',
  logoUrl: null,
  descripcion: 'Helados de barrio.',
  categoriaId: 4,
  categoriaNombre: 'Gastronomía',
  total: 2,
  obtenidas: 1,
  porcentaje: 50,
};

const RESUMEN2: ResumenAlbum = {
  id: 5,
  marcaNombre: 'Zara',
  logoUrl: null,
  descripcion: 'Indumentaria.',
  categoriaId: 4,
  categoriaNombre: 'Gastronomía',
  total: 2,
  obtenidas: 0,
  porcentaje: 0,
};

const DETALLE: DetalleAlbum = {
  ...RESUMEN,
  cartas: [
    {
      id: 'c1',
      nombre: 'Grido 1',
      imagenUrl: 'carta.png',
      rareza: 'comun',
      categoria: 'gastronomia',
      poder: 10,
      costoMana: 4,
      obtenida: true,
      cantidad: 1,
      favorita: false,
    },
    {
      id: 'c2',
      nombre: 'Grido 2',
      imagenUrl: 'carta.png',
      rareza: 'rara',
      categoria: 'gastronomia',
      poder: 20,
      costoMana: 7,
      obtenida: false,
      cantidad: 0,
      favorita: false,
    },
  ],
};

const DETALLE_ZARA: DetalleAlbum = {
  ...RESUMEN2,
  cartas: [
    {
      id: 'z1',
      nombre: 'Zara 1',
      imagenUrl: 'zara.png',
      rareza: 'comun',
      categoria: 'indumentaria',
      poder: 12,
      costoMana: 5,
      obtenida: false,
      cantidad: 0,
      favorita: false,
    },
  ],
};

describe('Albumes', () => {
  let fixture: ComponentFixture<Albumes>;
  let servicio: {
    listarCategorias: jest.Mock;
    listarAlbumes: jest.Mock;
    obtenerDetalleAlbum: jest.Mock;
    marcarFavorita: jest.Mock;
    desmarcarFavorita: jest.Mock;
  };

  beforeEach(async () => {
    servicio = {
      listarCategorias: jest.fn(() => of([...CATEGORIAS])),
      listarAlbumes: jest.fn(() => of([RESUMEN])),
      obtenerDetalleAlbum: jest.fn((id: number) => of(id === RESUMEN2.id ? DETALLE_ZARA : DETALLE)),
      marcarFavorita: jest.fn(() => of(undefined)),
      desmarcarFavorita: jest.fn(() => of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [Albumes],
      providers: [
        provideRouter([]),
        provideIcons({
          phosphorStackFill: ICONO,
          phosphorPlusFill: ICONO,
          phosphorHeartFill: ICONO,
          phosphorArrowLeftFill: ICONO,
          phosphorMagnifyingGlassFill: ICONO,
        }),
        { provide: AlbumesJugadorService, useValue: servicio },
        {
          provide: AuthService,
          useValue: { usuarioActual: signal(null), logout: jest.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Albumes);
    fixture.detectChanges();
  });

  const raiz = () => fixture.nativeElement as HTMLElement;

  const buscar = (valor: string): void => {
    const input = raiz().querySelector('#buscador-marcas') as HTMLInputElement;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  it('carga categorías y álbumes al iniciar y los lista', () => {
    expect(servicio.listarCategorias).toHaveBeenCalled();
    expect(servicio.listarAlbumes).toHaveBeenCalledWith(null);

    const texto = raiz().textContent ?? '';
    expect(texto).toContain('Grido');
    expect(texto).toContain('1 de 2 cartas');
  });

  it('selecciona el primer álbum visible al entrar', () => {
    expect(servicio.obtenerDetalleAlbum).toHaveBeenCalledWith(4);
    expect(raiz().querySelector('app-encabezado-album')).not.toBeNull();
    expect(raiz().querySelector('app-grilla-album')).not.toBeNull();
  });

  it('muestra un botón "Volver" que apunta al panel del jugador', () => {
    const volver = [...raiz().querySelectorAll('a')].find((enlace) =>
      enlace.textContent?.includes('Volver'),
    ) as HTMLAnchorElement;

    expect(volver).not.toBeNull();
    expect(volver.getAttribute('href')).toBe('/usuario');
  });

  it('pide el detalle al seleccionar un álbum y muestra su encabezado', () => {
    const boton = raiz().querySelector('.album-item') as HTMLButtonElement;
    boton.click();
    fixture.detectChanges();

    expect(servicio.obtenerDetalleAlbum).toHaveBeenCalledWith(4);
    expect(raiz().querySelector('app-encabezado-album')).not.toBeNull();
    expect(raiz().querySelector('app-grilla-album')).not.toBeNull();
  });

  it('vuelve a pedir los álbumes al cambiar de categoría', () => {
    fixture.componentInstance['cambiarCategoria'](4);
    fixture.detectChanges();

    expect(servicio.listarAlbumes).toHaveBeenCalledWith(4);
  });

  it('marca una carta como favorita desde el modo marcar', () => {
    (raiz().querySelector('.album-item') as HTMLButtonElement).click();
    fixture.detectChanges();

    fixture.componentInstance['alternarModoMarcar']();
    fixture.detectChanges();

    const celda = raiz().querySelector('button.celda') as HTMLButtonElement;
    celda.click();
    fixture.detectChanges();

    expect(servicio.marcarFavorita).toHaveBeenCalledWith('c1');
  });

  it('filtra el listado por nombre de marca sin distinguir mayúsculas', () => {
    servicio.listarAlbumes.mockReturnValue(of([RESUMEN, RESUMEN2]));
    fixture.componentInstance['cargarAlbumes'](null);
    fixture.detectChanges();

    buscar('ZARA');

    const texto = raiz().textContent ?? '';
    expect(texto).toContain('Zara');
    expect(texto).not.toContain('Grido');
  });

  it('filtra en el cliente sobre lo ya cargado, sin volver a pedir los álbumes', () => {
    servicio.listarAlbumes.mockReturnValue(of([RESUMEN, RESUMEN2]));
    fixture.componentInstance['cargarAlbumes'](null);
    fixture.detectChanges();
    const llamadasPrevias = servicio.listarAlbumes.mock.calls.length;

    buscar('r');

    expect(servicio.listarAlbumes).toHaveBeenCalledTimes(llamadasPrevias);
    const texto = raiz().textContent ?? '';
    expect(texto).toContain('Grido');
    expect(texto).toContain('Zara');
  });

  it('muestra el mensaje de "sin resultados" y limpia el panel cuando nada coincide', () => {
    buscar('zzz');

    expect(raiz().textContent).toContain('No encontramos marcas con ese nombre.');
    expect(raiz().querySelector('app-encabezado-album')).toBeNull();
  });

  it('reselecciona el primer álbum visible cuando el filtro cambia la visibilidad', () => {
    servicio.listarAlbumes.mockReturnValue(of([RESUMEN, RESUMEN2]));
    fixture.componentInstance['cargarAlbumes'](null);
    fixture.detectChanges();

    // Al entrar se selecciona Grido (primero); al filtrar por Zara, cambia.
    expect(servicio.obtenerDetalleAlbum).toHaveBeenLastCalledWith(4);
    servicio.obtenerDetalleAlbum.mockClear();

    buscar('zara');
    fixture.detectChanges();

    expect(servicio.obtenerDetalleAlbum).toHaveBeenCalledWith(5);
  });

  it('muestra el error de listado y permite reintentar', () => {
    servicio.listarAlbumes.mockReturnValueOnce(throwError(() => new Error('red')));

    fixture.componentInstance['cargarAlbumes'](null);
    fixture.detectChanges();

    expect(raiz().textContent).toContain('No pudimos cargar los álbumes.');

    servicio.listarAlbumes.mockReturnValue(of([RESUMEN]));

    const botonReintentar = [...raiz().querySelectorAll('button')].find((boton) =>
      boton.textContent?.includes('Reintentar'),
    ) as HTMLButtonElement;
    botonReintentar.click();
    fixture.detectChanges();

    expect(servicio.listarAlbumes).toHaveBeenCalledTimes(3);
  });
});
