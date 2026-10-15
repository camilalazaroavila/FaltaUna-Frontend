import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';

import { Tooltip } from './tooltip';

const ICONO = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

@Component({
  standalone: true,
  imports: [Tooltip],
  template: `
    <app-tooltip texto="Ayuda de favoritas" posicion="arriba-izquierda">
      <span id="objetivo">Contenido proyectado</span>
    </app-tooltip>
  `,
})
class AnfitrionProyeccion {}

describe('Tooltip', () => {
  let fixture: ComponentFixture<Tooltip>;

  const montar = (inputs: {
    texto: string;
    posicion?: string;
    icono?: boolean;
    etiqueta?: string;
  }): HTMLElement => {
    fixture.componentRef.setInput('texto', inputs.texto);
    if (inputs.posicion !== undefined) {
      fixture.componentRef.setInput('posicion', inputs.posicion);
    }
    if (inputs.icono !== undefined) {
      fixture.componentRef.setInput('icono', inputs.icono);
    }
    if (inputs.etiqueta !== undefined) {
      fixture.componentRef.setInput('etiqueta', inputs.etiqueta);
    }
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Tooltip],
      providers: [provideIcons({ phosphorInfoFill: ICONO })],
    });

    fixture = TestBed.createComponent(Tooltip);
  });

  it('renderiza el globo con role tooltip y el texto', () => {
    const el = montar({ texto: 'Sólo comisión' });

    const globo = el.querySelector('[role="tooltip"]')!;
    expect(globo).not.toBeNull();
    expect(globo.textContent).toContain('Sólo comisión');
    expect(el.querySelector('.tip__flecha')).not.toBeNull();
  });

  it('en modo ícono renderiza un botón con aria-label y aria-describedby al globo', () => {
    const el = montar({ texto: 'Explica favoritas', icono: true, etiqueta: 'Qué son las deseadas' });

    const boton = el.querySelector('button.tip__disparador') as HTMLButtonElement;
    expect(boton).not.toBeNull();
    expect(boton.getAttribute('aria-label')).toBe('Qué son las deseadas');

    const idGlobo = el.querySelector('[role="tooltip"]')!.getAttribute('id');
    expect(idGlobo).toBeTruthy();
    expect(boton.getAttribute('aria-describedby')).toBe(idGlobo);
    expect(el.querySelector('ng-icon')).not.toBeNull();
  });

  it('en modo proyección envuelve el contenido y lo enlaza con el globo', () => {
    const el = montar({ texto: 'Ayuda' });

    const objetivo = el.querySelector('.tip__objetivo')!;
    expect(objetivo).not.toBeNull();
    expect(objetivo.getAttribute('tabindex')).toBe('0');
    expect(objetivo.getAttribute('aria-describedby')).toBe(
      el.querySelector('[role="tooltip"]')!.getAttribute('id'),
    );
    expect(el.querySelector('button.tip__disparador')).toBeNull();
  });

  it('aplica las clases de posición pedidas', () => {
    const el = montar({ texto: 'Ayuda', posicion: 'arriba-izquierda' });

    const tip = el.querySelector('.tip')!;
    expect(tip.classList.contains('tip--arriba')).toBe(true);
    expect(tip.classList.contains('tip--izquierda')).toBe(true);
    expect(tip.classList.contains('tip--abajo')).toBe(false);
  });

  it('default de posición: abajo y hacia la derecha', () => {
    const el = montar({ texto: 'Ayuda' });

    const tip = el.querySelector('.tip')!;
    expect(tip.classList.contains('tip--abajo')).toBe(true);
    expect(tip.classList.contains('tip--derecha')).toBe(true);
  });
});

describe('Tooltip (proyección de contenido)', () => {
  it('muestra el contenido proyectado por el anfitrión', () => {
    TestBed.configureTestingModule({
      imports: [AnfitrionProyeccion],
      providers: [provideIcons({ phosphorInfoFill: ICONO })],
    });

    const fixture = TestBed.createComponent(AnfitrionProyeccion);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('#objetivo')!.textContent).toContain('Contenido proyectado');
    expect(el.querySelector('.tip--arriba.tip--izquierda')).not.toBeNull();
  });
});
