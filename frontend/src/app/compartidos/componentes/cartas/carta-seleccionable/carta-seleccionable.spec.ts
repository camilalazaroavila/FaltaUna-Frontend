import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Carta } from '@modelos/carta.model';
import { CartaSeleccionableComponent } from './carta-seleccionable';

const cartaComun: Carta = {
  id: 'c-001',
  nombre: 'Danonino',
  imagenUrl: 'imagenes/grido.jpg',
  rareza: 'comun',
  categoria: 'gastronomia',
  atributoIzquierdo: 12,
  atributoDerecho: 8,
  obtenida: true,
};

describe('CartaSeleccionableComponent', () => {
  let fixture: ComponentFixture<CartaSeleccionableComponent>;
  let componente: CartaSeleccionableComponent;

  const boton = () =>
    (fixture.nativeElement as HTMLElement).querySelector('button') as HTMLButtonElement;

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
    await TestBed.configureTestingModule({
      imports: [CartaSeleccionableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartaSeleccionableComponent);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('carta', cartaComun);
    fixture.detectChanges();
  });

  it('envuelve la carta en un botón accesible sin seleccionar', () => {
    expect((fixture.nativeElement as HTMLElement).querySelector('app-carta')).not.toBeNull();
    expect(boton().getAttribute('aria-pressed')).toBe('false');
    expect(boton().getAttribute('aria-disabled')).toBeNull();
    expect(boton().getAttribute('aria-label')).toContain('Danonino');
    expect(boton().getAttribute('aria-label')).toContain('Sin seleccionar');
  });

  it('emite "alternar" con la carta al hacer click', () => {
    const emitido = jest.fn();
    componente.alternar.subscribe(emitido);

    boton().click();

    expect(emitido).toHaveBeenCalledWith(cartaComun);
  });

  it('refleja el estado seleccionado', () => {
    fixture.componentRef.setInput('seleccionada', true);
    fixture.detectChanges();

    expect(boton().getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelector('.carta-seleccionable__marca')).not.toBeNull();
    expect(boton().getAttribute('aria-label')).toContain('Seleccionada');
    expect(
      (fixture.nativeElement as HTMLElement).classList.contains(
        'carta-seleccionable--seleccionada',
      ),
    ).toBe(true);
  });

  it('no emite y se marca como deshabilitada cuando está bloqueada', () => {
    fixture.componentRef.setInput('bloqueada', true);
    fixture.detectChanges();

    const emitido = jest.fn();
    componente.alternar.subscribe(emitido);
    boton().click();

    expect(emitido).not.toHaveBeenCalled();
    expect(boton().getAttribute('aria-disabled')).toBe('true');
  });
});
