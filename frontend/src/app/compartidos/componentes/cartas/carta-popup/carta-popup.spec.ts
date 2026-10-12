import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Carta } from '@modelos/carta.model';
import { CartaPopupComponent } from './carta-popup';

const cartaObtenida: Carta = {
  id: 'c-001',
  nombre: 'Danonino',
  imagenUrl: 'imagenes/grido.jpg',
  rareza: 'comun',
  categoria: 'gastronomia',
  atributoIzquierdo: 12,
  atributoDerecho: 8,
  obtenida: true,
};

const cartaNoObtenida: Carta = {
  ...cartaObtenida,
  id: 'c-002',
  nombre: 'Sprite Fresh',
  rareza: 'rara',
  obtenida: false,
};

describe('CartaPopupComponent', () => {
  let fixture: ComponentFixture<CartaPopupComponent>;
  let componente: CartaPopupComponent;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeAll(() => {
    const original = console.warn.bind(console);
    jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('sanitizing unsafe URL value')) {
        return;
      }
      original(...(args as []));
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartaPopupComponent] }).compileComponents();

    fixture = TestBed.createComponent(CartaPopupComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('carta', cartaObtenida);
    fixture.detectChanges();
  });

  it('muestra la carta, el nombre, la rareza/categoría y la oración genérica', () => {
    expect(host().querySelector('app-carta')).not.toBeNull();
    expect(host().textContent).toContain('Danonino');
    expect(host().textContent).toContain('Común · Gastronomía');
    expect(host().textContent).toContain('Cuesta 8 y suma 12.');
  });

  it('oculta el nombre y la oración en las cartas no obtenidas', () => {
    fixture.componentRef.setInput('carta', cartaNoObtenida);
    fixture.detectChanges();

    expect(host().textContent).toContain('???');
    expect(host().textContent).not.toContain('Sprite Fresh');
    expect(host().textContent).not.toContain('Cuesta');
    expect(host().textContent).toContain('Rara · Gastronomía');
  });

  it('expone un diálogo accesible y le da el foco', () => {
    const dialogo = host().querySelector('[role="dialog"]') as HTMLElement;

    expect(dialogo.getAttribute('aria-modal')).toBe('true');
    expect(dialogo.getAttribute('aria-labelledby')).toBe('carta-popup-titulo');
    expect(document.activeElement).toBe(dialogo);
  });

  it('emite cerrar al tocar el botón de cierre', () => {
    const emitido = jest.fn();
    componente.cerrar.subscribe(emitido);

    (host().querySelector('.carta-popup__cerrar') as HTMLButtonElement).click();

    expect(emitido).toHaveBeenCalledTimes(1);
  });

  it('emite cerrar al hacer clic en el fondo pero no dentro del diálogo', () => {
    const emitido = jest.fn();
    componente.cerrar.subscribe(emitido);

    (host().querySelector('.carta-popup__dialogo') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(emitido).not.toHaveBeenCalled();

    (host().querySelector('.carta-popup__fondo') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(emitido).toHaveBeenCalledTimes(1);
  });

  it('emite cerrar al presionar Escape', () => {
    const emitido = jest.fn();
    componente.cerrar.subscribe(emitido);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(emitido).toHaveBeenCalledTimes(1);
  });
});
