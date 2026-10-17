import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Texto } from './texto';

@Component({
  standalone: true,
  imports: [Texto],
  template: `
    <p app-texto id="texto-default">Párrafo normal</p>
    <p app-texto id="texto-secundario" variante="secundario" tamano="menor">Apoyo</p>
    <p app-texto id="texto-apagado" variante="apagado">Metadato</p>
    <p app-texto id="texto-heredar" variante="heredar">Heredado</p>
    <span app-texto id="texto-span">En línea</span>
  `,
})
class TestHostComponent {}

describe('Texto Component', () => {
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

  it('debe renderizar la etiqueta nativa con familia de lectura y color primario por defecto', () => {
    const elemento = host('texto-default');

    expect(elemento.tagName.toLowerCase()).toBe('p');
    expect(elemento.classList.contains('font-cuerpo')).toBe(true);
    expect(elemento.classList.contains('text-cuerpo')).toBe(true);
    expect(elemento.classList.contains('text-texto-primario')).toBe(true);
    expect(elemento.textContent?.trim()).toBe('Párrafo normal');
  });

  it('debe aplicar la variante secundaria con tamaño menor', () => {
    const elemento = host('texto-secundario');

    expect(elemento.classList.contains('text-texto-secundario')).toBe(true);
    expect(elemento.classList.contains('text-menor')).toBe(true);
  });

  it('debe aplicar la variante apagada para metadatos', () => {
    const elemento = host('texto-apagado');

    expect(elemento.classList.contains('text-texto-apagado')).toBe(true);
  });

  it('debe omitir el color cuando se elige heredar', () => {
    const elemento = host('texto-heredar');

    expect(elemento.classList.contains('text-texto-primario')).toBe(false);
    expect(elemento.classList.contains('text-texto-secundario')).toBe(false);
    expect(elemento.classList.contains('text-texto-apagado')).toBe(false);
  });

  it('debe poder renderizarse sobre un span en línea', () => {
    const elemento = host('texto-span');

    expect(elemento.tagName.toLowerCase()).toBe('span');
    expect(elemento.textContent?.trim()).toBe('En línea');
  });
});
