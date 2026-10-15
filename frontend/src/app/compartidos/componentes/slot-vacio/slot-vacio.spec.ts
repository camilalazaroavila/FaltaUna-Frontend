import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotVacio } from './slot-vacio';
import { ESTRELLAS_POR_RAREZA, type RarezaCarta } from '@modelos/carta.model';

describe('SlotVacio', () => {
  let fixture: ComponentFixture<SlotVacio>;

  const montar = (nombre: string, rareza: RarezaCarta): HTMLElement => {
    fixture.componentRef.setInput('nombre', nombre);
    fixture.componentRef.setInput('rareza', rareza);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SlotVacio] });
    fixture = TestBed.createComponent(SlotVacio);
  });

  it('es una imagen informativa con el nombre y la rareza en el aria-label', () => {
    const el = montar('Carta 6', 'rara');

    const contenedor = el.querySelector('.slot-vacio[role="img"]')!;
    expect(contenedor).not.toBeNull();
    expect(contenedor.getAttribute('aria-label')).toBe('Carta faltante: Carta 6, Rara');
  });

  it('no es operable: no renderiza ningún botón', () => {
    const el = montar('Carta 6', 'comun');

    expect(el.querySelector('button')).toBeNull();
  });

  it('muestra el sobre completo y el nombre de la carta debajo', () => {
    const el = montar('Super Grido', 'epicarta');

    expect(el.querySelector('.slot-vacio__paquete')).not.toBeNull();
    expect(el.querySelector('.slot-vacio__info .slot-vacio__nombre')!.textContent).toContain(
      'Super Grido',
    );
  });

  it('dibuja una estrella por cada nivel de rareza', () => {
    const el = montar('Carta 6', 'legendaria');

    expect(el.querySelectorAll('app-estrella-rareza')).toHaveLength(
      ESTRELLAS_POR_RAREZA['legendaria'],
    );
  });

  it('una carta común muestra una sola estrella', () => {
    const el = montar('Carta 6', 'comun');

    expect(el.querySelectorAll('app-estrella-rareza')).toHaveLength(1);
  });
});
