import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';

import { SlotVacio } from './slot-vacio';

const ICONO = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

describe('SlotVacio', () => {
  let fixture: ComponentFixture<SlotVacio>;

  const montar = (inputs: {
    etiqueta: string;
    marcable?: boolean;
    marcada?: boolean;
  }): HTMLElement => {
    fixture.componentRef.setInput('etiqueta', inputs.etiqueta);
    if (inputs.marcable !== undefined) {
      fixture.componentRef.setInput('marcable', inputs.marcable);
    }
    if (inputs.marcada !== undefined) {
      fixture.componentRef.setInput('marcada', inputs.marcada);
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SlotVacio],
      providers: [
        provideIcons({ phosphorPlusFill: ICONO, phosphorHeartFill: ICONO }),
      ],
    });

    fixture = TestBed.createComponent(SlotVacio);
  });

  it('no es operable cuando no es marcable: es una imagen informativa', () => {
    const el = montar({ etiqueta: 'Carta 3' });

    expect(el.querySelector('button')).toBeNull();
    const contenedor = el.querySelector('div')!;
    expect(contenedor.getAttribute('role')).toBe('img');
    expect(contenedor.getAttribute('aria-label')).toBe('Carta faltante: Carta 3');
  });

  it('es un botón con aria-pressed cuando es marcable', () => {
    const el = montar({ etiqueta: 'Carta 3', marcable: true });

    const boton = el.querySelector('button')!;
    expect(boton.getAttribute('aria-pressed')).toBe('false');
    expect(boton.getAttribute('aria-label')).toBe('Carta faltante: Carta 3');
  });

  it('refleja el estado marcado también en el aria-label', () => {
    const el = montar({ etiqueta: 'Carta 3', marcable: true, marcada: true });

    const boton = el.querySelector('button')!;
    expect(boton.getAttribute('aria-pressed')).toBe('true');
    expect(boton.getAttribute('aria-label')).toContain('marcada como que la quiero');
  });

  it('emite alternar al hacer clic', () => {
    const emitidos: void[] = [];
    fixture.componentInstance.alternar.subscribe(() => emitidos.push(undefined));

    const el = montar({ etiqueta: 'Carta 3', marcable: true });
    (el.querySelector('button') as HTMLButtonElement).click();

    expect(emitidos).toHaveLength(1);
  });

  it('no emite nada cuando no es marcable', () => {
    const emitidos: void[] = [];
    fixture.componentInstance.alternar.subscribe(() => emitidos.push(undefined));

    const el = montar({ etiqueta: 'Carta 3' });
    el.querySelector('div')!.click();

    expect(emitidos).toHaveLength(0);
  });
});
