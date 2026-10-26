import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Caja } from './caja';

@Component({
  standalone: true,
  imports: [Caja],
  template: `
    <app-caja id="caja-default">Contenido</app-caja>
    <app-caja id="caja-elevada" variante="elevada" sombra="media">Contenido</app-caja>
    <app-caja id="caja-hundida" variante="hundida" padding="lg" radio="lg">Contenido</app-caja>
    <app-caja id="caja-destacada" variante="destacada" sombra="alta">Destacada</app-caja>
    <app-caja id="caja-exito" variante="exito">Éxito</app-caja>
    <app-caja id="caja-error" variante="error">Error</app-caja>
    <app-caja id="caja-con-pie" class="custom-caja">
      <span slot="encabezado">Encabezado</span>
      <span>Cuerpo</span>
      <span slot="pie">Pie</span>
    </app-caja>
    <app-caja id="caja-acento-derecha" acento="derecha">Con acento</app-caja>
    <app-caja id="caja-acento-ninguno">Sin acento</app-caja>
  `,
})
class TestHostComponent {}

describe('Caja Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  const caja = (id: string) =>
    fixture.debugElement.query(By.css(`#${id}`)).nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe renderizar la superficie base sin sombra por defecto', () => {
    const el = caja('caja-default');

    expect(el.classList.contains('border')).toBe(true);
    expect(el.classList.contains('bg-superficie')).toBe(true);
    expect(el.classList.contains('border-borde-default')).toBe(true);
    expect(el.classList.contains('p-5')).toBe(true);
    expect(el.classList.contains('rounded-md')).toBe(true);
    expect(el.classList.contains('shadow-media')).toBe(false);
    expect(el.classList.contains('shadow-alta')).toBe(false);
  });

  it('debe aplicar superficie elevada y sombra media', () => {
    const el = caja('caja-elevada');

    expect(el.classList.contains('bg-elevado')).toBe(true);
    expect(el.classList.contains('shadow-media')).toBe(true);
  });

  it('debe aplicar superficie hundida con padding y radio grandes', () => {
    const el = caja('caja-hundida');

    expect(el.classList.contains('bg-hundido')).toBe(true);
    expect(el.classList.contains('p-7')).toBe(true);
    expect(el.classList.contains('rounded-lg')).toBe(true);
  });

  it('debe aplicar la variante destacada con el tinte de la marca', () => {
    const el = caja('caja-destacada');

    expect(el.classList.contains('bg-marca-primaria-suave')).toBe(true);
    expect(el.classList.contains('border-marca-primaria')).toBe(true);
    expect(el.classList.contains('shadow-alta')).toBe(true);
  });

  it('debe fijar texto primario en las cuatro variantes de superficie', () => {
    for (const id of ['caja-default', 'caja-elevada', 'caja-hundida', 'caja-destacada']) {
      expect(caja(id).classList.contains('text-texto-primario')).toBe(true);
    }
  });

  it('debe aplicar los 5 tokens por estado en las variantes de feedback', () => {
    const exito = caja('caja-exito');
    expect(exito.classList.contains('bg-exito-fondo')).toBe(true);
    expect(exito.classList.contains('border-exito-borde')).toBe(true);
    expect(exito.classList.contains('text-exito-texto')).toBe(true);

    const error = caja('caja-error');
    expect(error.classList.contains('bg-error-fondo')).toBe(true);
    expect(error.classList.contains('border-error-borde')).toBe(true);
    expect(error.classList.contains('text-error-texto')).toBe(true);
  });

  it('debe proyectar encabezado, cuerpo y pie en orden y preservar clases del consumidor', () => {
    const el = caja('caja-con-pie');
    const hijos = Array.from(el.children).map((nodo) => nodo.textContent?.trim());

    expect(hijos).toEqual(['Encabezado', 'Cuerpo', 'Pie']);
    expect(el.classList.contains('custom-caja')).toBe(true);
  });

  it('debe recortar la caja y dibujar una franja a la derecha con acento="derecha"', () => {
    const el = caja('caja-acento-derecha');
    const franja = el.querySelector<HTMLElement>('.caja-acento');

    expect(el.classList.contains('relative')).toBe(true);
    expect(el.classList.contains('overflow-hidden')).toBe(true);
    expect(franja).not.toBeNull();
    expect(franja?.classList.contains('absolute')).toBe(true);
    expect(franja?.classList.contains('inset-y-0')).toBe(true);
    expect(franja?.classList.contains('right-0')).toBe(true);
    expect(franja?.classList.contains('w-1.5')).toBe(true);
    expect(el.textContent?.trim()).toBe('Con acento');
  });

  it('debe dejar sin franja ni recorte cuando el acento es ninguno', () => {
    const el = caja('caja-acento-ninguno');

    expect(el.querySelector('.caja-acento')).toBeNull();
    expect(el.classList.contains('relative')).toBe(false);
    expect(el.classList.contains('overflow-hidden')).toBe(false);
  });
});
