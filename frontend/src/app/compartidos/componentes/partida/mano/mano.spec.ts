import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Carta } from '@modelos/carta.model';
import { Mano } from './mano';

// jsdom no define PointerEvent: se usa MouseEvent como base con las propiedades
// de puntero que necesita el componente.
const ClasePointerEvent: typeof MouseEvent =
  typeof PointerEvent !== 'undefined' ? (PointerEvent as unknown as typeof MouseEvent) : MouseEvent;

const crearCarta = (id: string): Carta => ({
  id,
  nombre: `Carta ${id}`,
  imagenUrl: 'imagenes/grido.jpg',
  rareza: 'comun',
  categoria: 'gastronomia',
  atributoIzquierdo: 1,
  atributoDerecho: 1,
  obtenida: true,
});

describe('Mano', () => {
  let component: Mano;
  let fixture: ComponentFixture<Mano>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mano],
    }).compileComponents();

    fixture = TestBed.createComponent(Mano);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('cartas', [
      crearCarta('m1'),
      crearCarta('m2'),
      crearCarta('m3'),
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe inclinar las cartas hacia los extremos y dejar el centro recto', () => {
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLElement[];

    expect(botones[0].style.getPropertyValue('--angulo')).toBe('-14deg');
    expect(botones[1].style.getPropertyValue('--angulo')).toBe('0deg');
    expect(botones[2].style.getPropertyValue('--angulo')).toBe('14deg');
    expect(botones[0].style.getPropertyValue('--caida')).toBe('1rem');
    expect(botones[1].style.getPropertyValue('--caida')).toBe('0rem');
  });

  it('debe informar las separaciones para que el CSS calcule el solape', () => {
    const contenedor = fixture.nativeElement.querySelector('.mano') as HTMLElement;
    const botones = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLElement[];

    expect(contenedor.style.getPropertyValue('--separaciones')).toBe('2');
    expect(botones[0].style.marginLeft).toBe('');
    expect(botones[1].style.marginLeft).toBe('');
  });

  it('debe emitir ver al tocar una carta sin arrastrar', () => {
    const emitir = jest.spyOn(component.ver, 'emit');
    const botones = fixture.nativeElement.querySelectorAll('button');

    dispararPuntero(botones[1] as HTMLElement, 10, 10);

    expect(emitir).toHaveBeenCalledWith(expect.objectContaining({ id: 'm2' }));
  });

  it('no debe emitir ver ni arrastre si el movimiento queda bajo el umbral', () => {
    const ver = jest.spyOn(component.ver, 'emit');
    const inicio = jest.spyOn(component.arrastreInicio, 'emit');
    const fin = jest.spyOn(component.arrastreFin, 'emit');
    const botones = fixture.nativeElement.querySelectorAll('button');

    dispararPuntero(botones[1] as HTMLElement, 10, 10, [
      { x: 12, y: 11 },
      { x: 14, y: 13 },
    ]);

    expect(inicio).not.toHaveBeenCalled();
    expect(fin).not.toHaveBeenCalled();
    expect(ver).toHaveBeenCalledWith(expect.objectContaining({ id: 'm2' }));
  });

  it('debe emitir inicio, movimiento y fin al arrastrar más allá del umbral', () => {
    const inicio = jest.spyOn(component.arrastreInicio, 'emit');
    const mueve = jest.spyOn(component.arrastreMueve, 'emit');
    const fin = jest.spyOn(component.arrastreFin, 'emit');
    const ver = jest.spyOn(component.ver, 'emit');
    const botones = fixture.nativeElement.querySelectorAll('button');

    dispararPuntero(botones[1] as HTMLElement, 10, 10, [
      { x: 40, y: 40 },
      { x: 80, y: 90 },
    ]);

    expect(inicio).toHaveBeenCalledWith(expect.objectContaining({ id: 'm2' }));
    expect(mueve).toHaveBeenCalledWith({ x: 80, y: 90 });
    expect(fin).toHaveBeenCalledWith({ x: 80, y: 90 });
    expect(ver).not.toHaveBeenCalled();
  });

  it('debe exponer el fantasma mientras se arrastra', () => {
    const botones = fixture.nativeElement.querySelectorAll('button');

    dispararPuntero(botones[0] as HTMLElement, 10, 10, [{ x: 60, y: 70 }]);
    fixture.detectChanges();

    const fantasma = fixture.nativeElement.querySelector('.mano-fantasma');

    expect(fantasma).toBeTruthy();
  });

  it('debe alternar la selección con la tecla Espacio', () => {
    const seleccion = jest.spyOn(component.seleccion, 'emit');
    const boton = fixture.nativeElement.querySelectorAll('button')[1] as HTMLElement;

    boton.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    expect(seleccion).toHaveBeenCalledWith(expect.objectContaining({ id: 'm2' }));
  });

  it('debe emitir ver con la tecla Enter', () => {
    const ver = jest.spyOn(component.ver, 'emit');
    const boton = fixture.nativeElement.querySelectorAll('button')[1] as HTMLElement;

    boton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(ver).toHaveBeenCalledWith(expect.objectContaining({ id: 'm2' }));
  });
});

/** Simula pointerdown, los movimientos y pointerup con un id de puntero estable. */
const dispararPuntero = (
  elemento: HTMLElement,
  x: number,
  y: number,
  movimientos: readonly { x: number; y: number }[] = [],
): void => {
  const pointerId = 1;
  const crear = (tipo: string, px: number, py: number): PointerEvent => {
    const evento = new ClasePointerEvent(tipo, {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX: px,
      clientY: py,
    });

    Object.defineProperty(evento, 'pointerId', { value: pointerId });
    Object.defineProperty(evento, 'pointerType', { value: 'mouse' });

    return evento as PointerEvent;
  };

  elemento.setPointerCapture = jest.fn();
  elemento.releasePointerCapture = jest.fn();
  elemento.dispatchEvent(crear('pointerdown', x, y));

  for (const movimiento of movimientos) {
    elemento.dispatchEvent(crear('pointermove', movimiento.x, movimiento.y));
  }

  const ultimo = movimientos.at(-1) ?? { x, y };
  elemento.dispatchEvent(crear('pointerup', ultimo.x, ultimo.y));
};
