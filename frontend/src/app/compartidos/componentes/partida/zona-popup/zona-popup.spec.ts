import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZonaPopupComponent } from './zona-popup';

describe('ZonaPopupComponent', () => {
  let fixture: ComponentFixture<ZonaPopupComponent>;
  let componente: ZonaPopupComponent;
  let disparador: HTMLButtonElement;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ZonaPopupComponent] }).compileComponents();

    // Elemento que tenía el foco antes de abrir el popup.
    disparador = document.createElement('button');
    document.body.appendChild(disparador);
    disparador.focus();

    fixture = TestBed.createComponent(ZonaPopupComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('nombre', 'Grido');
    fixture.componentRef.setInput('imagenUrl', 'imagenes/grido.jpg');
    fixture.componentRef.setInput('efecto', { categoria: 'gastronomia', bonus: 1 });
    fixture.detectChanges();
  });

  afterEach(() => disparador.remove());

  it('muestra el nombre y el efecto armado desde los datos', () => {
    expect(host().textContent).toContain('Grido');
    expect(host().textContent).toContain('+1 de poder por cada carta de');
    expect(host().querySelector('strong')?.textContent).toContain('Gastronomía');
  });

  it('expone un diálogo accesible y le da el foco', () => {
    const dialogo = host().querySelector('[role="dialog"]') as HTMLElement;

    expect(dialogo.getAttribute('aria-modal')).toBe('true');
    expect(dialogo.getAttribute('aria-labelledby')).toBe('zona-popup-titulo');
    expect(document.activeElement).toBe(dialogo);
  });

  it('devuelve el foco al elemento previo al destruirse', () => {
    fixture.destroy();

    expect(document.activeElement).toBe(disparador);
  });

  it('emite cerrar al tocar el botón de cierre', () => {
    const emitido = jest.fn();
    componente.cerrar.subscribe(emitido);

    (host().querySelector('.zona-popup__cerrar') as HTMLButtonElement).click();

    expect(emitido).toHaveBeenCalledTimes(1);
  });

  it('emite cerrar al hacer clic en el fondo pero no dentro del diálogo', () => {
    const emitido = jest.fn();
    componente.cerrar.subscribe(emitido);

    (host().querySelector('.zona-popup__dialogo') as HTMLElement).dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(emitido).not.toHaveBeenCalled();

    (host().querySelector('.zona-popup__fondo') as HTMLElement).dispatchEvent(
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

  it('cae a la imagen de respaldo si la foto falla', () => {
    (host().querySelector('img') as HTMLImageElement).dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect((host().querySelector('img') as HTMLImageElement).getAttribute('src')).toContain(
      'Sprite.png',
    );
  });
});