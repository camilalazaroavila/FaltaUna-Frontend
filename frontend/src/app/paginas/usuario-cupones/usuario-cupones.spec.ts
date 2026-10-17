import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { UsuarioCupones } from './usuario-cupones';
import { CuponesService } from '../../servicios/cupones.service';
import type { CuponDescuento } from '../../modelos/cupon.model';

const CUPONES: CuponDescuento[] = [
  {
    id: 1,
    marca: 'Grido',
    categoria: 'gastronomia',
    titulo: 'Helado 2x1',
    descripcion: '2x1 en cucuruchos',
    detalles: 'Válido de lunes a viernes.',
    codigo: 'GRIDO-1',
    vigenteHastaUtc: '2026-12-31T00:00:00Z',
    estado: 'Disponible',
  },
  {
    id: 2,
    marca: 'Zara',
    categoria: 'indumentaria',
    titulo: '20% off',
    descripcion: '20% off en prendas seleccionadas',
    detalles: 'No acumulable.',
    codigo: 'ZARA-1',
    vigenteHastaUtc: '2026-12-31T00:00:00Z',
    estado: 'Disponible',
  },
];

describe('UsuarioCupones', () => {
  let fixture: ComponentFixture<UsuarioCupones>;
  let params: BehaviorSubject<ParamMap>;

  const montar = async (categoriaInicial: string | null): Promise<void> => {
    params = new BehaviorSubject(convertToParamMap(categoriaInicial ? { categoria: categoriaInicial } : {}));

    await TestBed.configureTestingModule({
      imports: [UsuarioCupones],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: params.asObservable(),
            snapshot: { queryParamMap: params.value },
          },
        },
        {
          provide: CuponesService,
          useValue: {
            obtenerMisCupones: jest.fn(() => of(CUPONES)),
            obtenerQr: jest.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioCupones);
    fixture.detectChanges();
  };

  const activa = (): string => fixture.componentInstance['categoriaActiva']();

  it('preselecciona la categoría válida indicada en la URL', async () => {
    await montar('indumentaria');
    expect(activa()).toBe('indumentaria');
  });

  it('ignora una categoría inválida y conserva la de por defecto', async () => {
    await montar('inexistente');
    expect(activa()).toBe('gastronomia');
  });

  it('reacciona a cambios posteriores del parámetro de categoría', async () => {
    await montar(null);
    expect(activa()).toBe('gastronomia');

    params.next(convertToParamMap({ categoria: 'indumentaria' }));
    fixture.detectChanges();

    expect(activa()).toBe('indumentaria');
  });

  it('filtra los cupones según la categoría activa', async () => {
    await montar('indumentaria');
    const filtrados = fixture.componentInstance['cuponesFiltrados']();

    expect(filtrados).toHaveLength(1);
    expect(filtrados[0].marca).toBe('Zara');
  });

  it('pide al backend los cupones del estado elegido y lo desactiva al repetirlo', async () => {
    await montar(null);
    const servicio = TestBed.inject(CuponesService);
    const componente = fixture.componentInstance as any;

    componente.elegirEstado('Usado');
    expect(servicio.obtenerMisCupones).toHaveBeenLastCalledWith({ buscar: '', estado: 'Usado' });

    componente.elegirEstado('Usado');
    expect(servicio.obtenerMisCupones).toHaveBeenLastCalledWith({ buscar: '', estado: null });
  });

  it('limpiarFiltros borra el texto y el estado', async () => {
    await montar(null);
    const componente = fixture.componentInstance as any;

    componente.escribirBusqueda('grido');
    componente.elegirEstado('Disponible');
    expect(componente.hayFiltros()).toBe(true);

    componente.limpiarFiltros();
    expect(componente.hayFiltros()).toBe(false);
  });

  it('filtra los cupones reactivamente según el texto de búsqueda', async () => {
    await montar('gastronomia');
    const componente = fixture.componentInstance as any;

    expect(componente.cuponesFiltrados()).toHaveLength(1);

    componente.escribirBusqueda('grido');
    expect(componente.cuponesFiltrados()).toHaveLength(1);

    componente.escribirBusqueda('no-existe');
    expect(componente.cuponesFiltrados()).toHaveLength(0);
  });

  it('filtra los cupones reactivamente según el estado seleccionado', async () => {
    await montar('gastronomia');
    const componente = fixture.componentInstance as any;

    // Grido está 'Disponible'
    componente.elegirEstado('Disponible');
    expect(componente.cuponesFiltrados()).toHaveLength(1);

    componente.elegirEstado('Usado');
    expect(componente.cuponesFiltrados()).toHaveLength(0);
  });

  it('el menú hamburguesa se abre, lista los 3 estados y se cierra al elegir uno', async () => {
    await montar(null);
    const componente = fixture.componentInstance as any;
    const raiz: HTMLElement = fixture.nativeElement;

    expect(raiz.querySelector('#menu-filtros-cupones')).toBeNull();

    (raiz.querySelector('button[aria-label="Filtrar por estado"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const menu = raiz.querySelector('#menu-filtros-cupones') as HTMLElement;
    expect(menu).not.toBeNull();
    expect(menu.querySelectorAll('ul button')).toHaveLength(3);
    expect(menu.textContent).toContain('Limpiar filtros');

    componente.elegirEstado('Usado');
    fixture.detectChanges();
    expect(raiz.querySelector('#menu-filtros-cupones')).toBeNull();
  });

  it('el botón Limpiar filtros del menú está deshabilitado sin filtros y los borra al usarlo', async () => {
    await montar(null);
    const componente = fixture.componentInstance as any;
    const raiz: HTMLElement = fixture.nativeElement;

    componente.alternarMenu();
    fixture.detectChanges();
    const limpiar = () =>
      Array.from(raiz.querySelectorAll('#menu-filtros-cupones button')).find((b) =>
        b.textContent?.includes('Limpiar filtros'),
      ) as HTMLButtonElement;
    expect(limpiar().disabled).toBe(true);

    componente.escribirBusqueda('grido');
    fixture.detectChanges();
    expect(limpiar().disabled).toBe(false);

    limpiar().click();
    fixture.detectChanges();
    expect(componente.hayFiltros()).toBe(false);
  });
});