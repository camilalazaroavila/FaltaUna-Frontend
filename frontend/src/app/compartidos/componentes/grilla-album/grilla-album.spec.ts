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
    costoMana: 4,
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
    costoMana: 7,
    obtenida: false,
    cantidad: 0,
    favorita: false,
  },
];

describe('GrillaAlbum', () => {
  let fixture: ComponentFixture<GrillaAlbum>;

  const montar = (
    opciones: { modoMarcar?: boolean; favoritas?: readonly string[] } = {},
  ): HTMLElement => {
    fixture.componentRef.setInput('cartas', CARTAS);
    fixture.componentRef.setInput('modoMarcar', opciones.modoMarcar ?? false);
    fixture.componentRef.setInput('favoritas', new Set(opciones.favoritas ?? []));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GrillaAlbum],
      providers: [
        provideIcons({ phosphorHeartFill: ICONO, phosphorPlusFill: ICONO }),
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

  it('en modo marcar, la carta obtenida se vuelve un botón con aria-pressed', () => {
    const el = montar({ modoMarcar: true });

    const celda = el.querySelector('button.celda')!;
    expect(celda).not.toBeNull();
    expect(celda.getAttribute('aria-pressed')).toBe('false');
    expect(el.querySelectorAll('app-slot-vacio')).toHaveLength(1);
  });

  it('refleja una favorita marcada como botón presionado con su corazón', () => {
    const el = montar({ modoMarcar: true, favoritas: ['c1'] });

    const celda = el.querySelector('button.celda')!;
    expect(celda.getAttribute('aria-pressed')).toBe('true');
    expect(celda.querySelector('.celda__corazon')).not.toBeNull();
  });

  it('emite el id de la carta obtenida al tocarla en modo marcar', () => {
    const emitidos: string[] = [];
    fixture.componentInstance.alternar.subscribe((id) => emitidos.push(id));

    const el = montar({ modoMarcar: true });
    (el.querySelector('button.celda') as HTMLButtonElement).click();

    expect(emitidos).toEqual(['c1']);
  });

  it('emite el id de la carta faltante al tocar el slot marcable', () => {
    const emitidos: string[] = [];
    fixture.componentInstance.alternar.subscribe((id) => emitidos.push(id));

    const el = montar({ modoMarcar: true });
    (el.querySelector('app-slot-vacio button') as HTMLButtonElement).click();

    expect(emitidos).toEqual(['c2']);
  });
});
