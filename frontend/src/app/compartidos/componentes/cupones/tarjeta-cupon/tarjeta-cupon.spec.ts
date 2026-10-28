import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TarjetaCupon } from './tarjeta-cupon';
import type { CuponDescuento } from '@modelos/cupon.model';

const CUPON_DISPONIBLE: CuponDescuento = {
  id: 1,
  marca: 'Grido',
  categoria: 'gastronomia',
  titulo: 'Helado 2x1',
  descripcion: '2x1 en cucuruchos',
  detalles: '20% off en cucuruchos',
  codigo: 'GRIDO-1',
  vigenteHastaUtc: '2026-12-31T00:00:00Z',
  estado: 'Disponible',
  enlace: null,
};

const CUPON_USADO: CuponDescuento = {
  id: 2,
  marca: 'Zara',
  categoria: 'indumentaria',
  titulo: 'Descuento',
  descripcion: 'Prendas seleccionadas',
  detalles: 'Sin porcentaje explícito',
  codigo: 'ZARA-1',
  vigenteHastaUtc: '2026-12-31T00:00:00Z',
  estado: 'Usado',
  enlace: null,
};

describe('TarjetaCupon', () => {
  let fixture: ComponentFixture<TarjetaCupon>;
  let componente: TarjetaCupon;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaCupon],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaCupon);
    componente = fixture.componentInstance;
  });

  it('renderiza la marca y el porcentaje de descuento', () => {
    fixture.componentRef.setInput('cupon', CUPON_DISPONIBLE);
    fixture.detectChanges();

    const raiz: HTMLElement = fixture.nativeElement;
    expect(raiz.textContent).toContain('Grido');
    expect(raiz.textContent).toContain('20% OFF');
    expect(raiz.querySelector('.opacity-55')).toBeNull();
  });

  it('muestra la insignia de estado y opacidad reducida cuando no está disponible', () => {
    fixture.componentRef.setInput('cupon', CUPON_USADO);
    fixture.detectChanges();

    const raiz: HTMLElement = fixture.nativeElement;
    expect(raiz.textContent).toContain('Zara');
    expect(raiz.textContent).toContain('Ver cupón');
    expect(raiz.textContent).toContain('Usado');

    const boton = raiz.querySelector('button.sello');
    expect(boton?.classList.contains('opacity-55')).toBe(true);
  });

  it('emite el evento seleccionar al hacer clic en el botón', () => {
    fixture.componentRef.setInput('cupon', CUPON_DISPONIBLE);
    fixture.detectChanges();

    const spySeleccionar = jest.fn();
    componente.seleccionar.subscribe(spySeleccionar);

    const boton = fixture.nativeElement.querySelector('button.sello') as HTMLButtonElement;
    boton.click();

    expect(spySeleccionar).toHaveBeenCalledTimes(1);
    expect(spySeleccionar.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });
});
