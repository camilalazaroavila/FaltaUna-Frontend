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
    expect(raiz.querySelector('.cupon--atenuado')).toBeNull();
  });

  it('muestra las iniciales de la marca cuando no hay logo', () => {
    fixture.componentRef.setInput('cupon', CUPON_DISPONIBLE);
    fixture.detectChanges();

    const raiz: HTMLElement = fixture.nativeElement;
    expect(raiz.querySelector('.cupon__iniciales')?.textContent).toContain('GR');
    expect(raiz.querySelector('.cupon__logo')).toBeNull();
  });

  it('muestra la foto de la marca cuando el backend provee marcaLogoUrl', () => {
    const conLogo: CuponDescuento = {
      ...CUPON_DISPONIBLE,
      marcaLogoUrl: '/assets/marcas/grido.png',
    };
    fixture.componentRef.setInput('cupon', conLogo);
    fixture.detectChanges();

    const raiz: HTMLElement = fixture.nativeElement;
    const img = raiz.querySelector('.cupon__logo') as HTMLImageElement | null;
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toContain('/assets/marcas/grido.png');
    expect(raiz.querySelector('.cupon__iniciales')).toBeNull();
  });

  it('muestra las iniciales cuando la imagen del logo falla al cargar', () => {
    const conLogo: CuponDescuento = {
      ...CUPON_DISPONIBLE,
      marcaLogoUrl: '/assets/marcas/roto.png',
    };
    fixture.componentRef.setInput('cupon', conLogo);
    fixture.detectChanges();

    const raiz: HTMLElement = fixture.nativeElement;
    const img = raiz.querySelector('.cupon__logo') as HTMLImageElement;

    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(raiz.querySelector('.cupon__logo')).toBeNull();
    expect(raiz.querySelector('.cupon__iniciales')?.textContent).toContain('GR');
  });

  it('muestra la insignia de estado y opacidad reducida cuando no está disponible', () => {
    fixture.componentRef.setInput('cupon', CUPON_USADO);
    fixture.detectChanges();

    const raiz: HTMLElement = fixture.nativeElement;
    expect(raiz.textContent).toContain('Zara');
    expect(raiz.textContent).toContain('Ver cupón');
    expect(raiz.textContent).toContain('Usado');

    const boton = raiz.querySelector('button.cupon');
    expect(boton?.classList.contains('cupon--atenuado')).toBe(true);
  });

  it('emite el evento seleccionar al hacer clic en el botón', () => {
    fixture.componentRef.setInput('cupon', CUPON_DISPONIBLE);
    fixture.detectChanges();

    const spySeleccionar = jest.fn();
    componente.seleccionar.subscribe(spySeleccionar);

    const boton = fixture.nativeElement.querySelector('button.cupon') as HTMLButtonElement;
    boton.click();

    expect(spySeleccionar).toHaveBeenCalledTimes(1);
    expect(spySeleccionar.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
  });
});