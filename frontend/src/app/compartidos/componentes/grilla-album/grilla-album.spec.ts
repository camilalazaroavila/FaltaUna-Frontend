import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';

import { GrillaAlbum } from './grilla-album';
import type { CartaAlbum } from '@modelos/album-jugador.model';

const ICONO = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

const CARTAS: readonly CartaAlbum[] = [
  {
    id: 'c1',
    nombre: 'Carta obtenida',
    imagenUrl: 'carta.png',
    rareza: 'comun',
    categoria: 'gastronomia',
    poder: 10,
    costoCupon: 4,
    obtenida: true,
    cantidad: 1,
    favorita: false,
  },
  {
    id: 'c2',
    nombre: 'Carta faltante',
    imagenUrl: 'carta.png',
    rareza: 'rara',
    categoria: 'gastronomia',
    poder: 20,
    costoCupon: 7,
    obtenida: false,
    cantidad: 0,
    favorita: false,
  },
];

describe('GrillaAlbum', () => {
  let fixture: ComponentFixture<GrillaAlbum>;

  const montar = (opciones: { favoritas?: readonly string[] } = {}): HTMLElement => {
    fixture.componentRef.setInput('cartas', CARTAS);
    fixture.componentRef.setInput('favoritas', new Set(opciones.favoritas ?? []));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GrillaAlbum],
      providers: [
        provideIcons({
          phosphorHeart: ICONO,
          phosphorHeartFill: ICONO,
        }),
      ],
    });

    fixture = TestBed.createComponent(GrillaAlbum);
  });

  it('renderiza las obtenidas con app-carta y las faltantes con el slot vacío', () => {
    const el = montar();

    expect(el.querySelectorAll('app-carta')).toHaveLength(1);
    expect(el.querySelectorAll('app-slot-vacio')).toHaveLength(1);
    expect(el.querySelector('button.celda')).toBeNull();
  });

  it('el slot vacío recibe el nombre y la rareza de la carta faltante', () => {
    const el = montar();

    const slot = el.querySelector('app-slot-vacio')!;
    const contenedor = slot.querySelector('.slot-vacio[role="img"]')!;
    expect(contenedor.getAttribute('aria-label')).toBe('Carta faltante: Carta faltante, Rara');
  });

  it('muestra el corazón siempre visible en todas las celdas', () => {
    const el = montar();

    const corazones = el.querySelectorAll('app-boton-favorita.celda__corazon');
    expect(corazones).toHaveLength(2);
    expect(corazones[0].querySelector('button.like-btn')!.getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('refleja una favorita marcada como corazón presionado', () => {
    const el = montar({ favoritas: ['c1'] });

    const corazon = el.querySelector('button.like-btn') as HTMLButtonElement;
    expect(corazon.getAttribute('aria-pressed')).toBe('true');
  });

  it('alterna con doble click sobre la carta obtenida', () => {
    const emitidos: string[] = [];
    fixture.componentInstance.alternar.subscribe((id) => emitidos.push(id));

    const el = montar();
    (el.querySelector('.celda') as HTMLElement).dispatchEvent(
      new MouseEvent('dblclick', { bubbles: true }),
    );

    expect(emitidos).toEqual(['c1']);
  });

  it('el doble click alterna también la carta faltante', () => {
    const emitidos: string[] = [];
    fixture.componentInstance.alternar.subscribe((id) => emitidos.push(id));

    const el = montar();
    const faltante = el.querySelector('app-slot-vacio')!.closest('.celda-envoltorio')!;
    faltante.dispatchEvent(new MouseEvent('dblclick'));

    expect(emitidos).toEqual(['c2']);
  });

  it('alterna al tocar el corazón de una carta', () => {
    const emitidos: string[] = [];
    fixture.componentInstance.alternar.subscribe((id) => emitidos.push(id));

    const el = montar();
    const corazones = el.querySelectorAll('button.like-btn');
    corazones[1].click();

    expect(emitidos).toEqual(['c2']);
  });

  it('el doble click sobre el corazón alterna una sola vez', () => {
    const emitidos: string[] = [];
    fixture.componentInstance.alternar.subscribe((id) => emitidos.push(id));

    const el = montar();
    const corazon = el.querySelector('button.like-btn') as HTMLButtonElement;
    corazon.click();
    corazon.click();
    corazon.closest('.celda-envoltorio')!.dispatchEvent(new MouseEvent('dblclick'));

    expect(emitidos).toEqual(['c1']);
  });
});
