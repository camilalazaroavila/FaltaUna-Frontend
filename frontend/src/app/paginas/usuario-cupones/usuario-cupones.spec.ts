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
          useValue: { queryParamMap: params.asObservable() },
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
});
