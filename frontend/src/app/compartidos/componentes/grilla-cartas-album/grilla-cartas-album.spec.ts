import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartaDeAlbum } from '../../../modelos/album-progreso';
import { GrillaCartasAlbum } from './grilla-cartas-album';

const crearCarta = (id: string, esFavorita = false): CartaDeAlbum => ({
  id,
  nombre: `Carta ${id}`,
  imagenUrl: 'imagenes/prueba.png',
  rareza: 'comun',
  categoria: 'gastronomia',
  atributoIzquierdo: 1,
  atributoDerecho: 1,
  obtenida: true,
  esFavorita,
});

describe('GrillaCartasAlbum', () => {
  let fixture: ComponentFixture<GrillaCartasAlbum>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GrillaCartasAlbum] }).compileComponents();
    fixture = TestBed.createComponent(GrillaCartasAlbum);
    fixture.componentRef.setInput('cartas', [crearCarta('c-1'), crearCarta('c-2', true)]);
  });

  it('muestra una carta por cada elemento', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-carta').length).toBe(2);
  });

  it('fuera del modo favoritas no hay botones', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(0);
  });

  it('en modo favoritas refleja el estado en aria-pressed', () => {
    fixture.componentRef.setInput('modoFavoritas', true);
    fixture.detectChanges();

    const botones = fixture.nativeElement.querySelectorAll('button');
    expect(botones[0].getAttribute('aria-pressed')).toBe('false');
    expect(botones[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('en modo favoritas emite la carta que se toca', () => {
    fixture.componentRef.setInput('modoFavoritas', true);
    fixture.detectChanges();
    const emitidas: CartaDeAlbum[] = [];
    fixture.componentInstance.alternarFavorita.subscribe((carta) => emitidas.push(carta));

    fixture.nativeElement.querySelectorAll('button')[0].click();

    expect(emitidas.map((carta) => carta.id)).toEqual(['c-1']);
  });
});