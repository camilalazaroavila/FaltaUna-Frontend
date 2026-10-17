import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Titulo } from './titulo';

@Component({
  standalone: true,
  imports: [Titulo],
  template: `
    <h2 app-titulo id="titulo-default">Titular por defecto</h2>
    <h1 app-titulo id="titulo-h1" tamano="display">Hero</h1>
    <h4 app-titulo id="titulo-h4" tamano="sm" color="marca">Menor</h4>
    <h2 app-titulo id="titulo-secundario" color="secundario">Con color</h2>
  `,
})
class TestHostComponent {}

describe('Titulo Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  const host = (id: string) =>
    fixture.debugElement.query(By.css(`#${id}`)).nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe respetar la etiqueta semántica y heredar el color por defecto', () => {
    const encabezado = host('titulo-default');

    expect(encabezado.tagName.toLowerCase()).toBe('h2');
    expect(encabezado.classList.contains('font-titulo')).toBe(true);
    expect(encabezado.classList.contains('font-peso-titular')).toBe(true);
    expect(encabezado.classList.contains('text-subtitulo')).toBe(true);
    expect(encabezado.classList.contains('text-texto-primario')).toBe(false);
    expect(encabezado.textContent?.trim()).toBe('Titular por defecto');
  });

  it('debe combinar nivel semántico h1 con nivel visual display', () => {
    const encabezado = host('titulo-h1');

    expect(encabezado.tagName.toLowerCase()).toBe('h1');
    expect(encabezado.classList.contains('text-display')).toBe(true);
  });

  it('debe permitir elegir el nivel visual y el color de forma independiente', () => {
    const encabezado = host('titulo-h4');

    expect(encabezado.tagName.toLowerCase()).toBe('h4');
    expect(encabezado.classList.contains('text-cuerpo')).toBe(true);
    expect(encabezado.classList.contains('text-marca-primaria')).toBe(true);
  });

  it('debe aplicar el color secundario cuando se solicita', () => {
    const encabezado = host('titulo-secundario');

    expect(encabezado.classList.contains('text-texto-secundario')).toBe(true);
  });
});
