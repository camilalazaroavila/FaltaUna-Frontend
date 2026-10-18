import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Sobretitulo } from './sobretitulo';

@Component({
  standalone: true,
  imports: [Sobretitulo],
  template: `
    <p app-sobretitulo id="sobre-default">Bienvenido de nuevo</p>
    <span app-sobretitulo id="sobre-marca" color="marca">Nuevo</span>
  `,
})
class TestHostComponent {}

describe('Sobretitulo Component', () => {
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

  it('debe renderizar un rótulo en mayúsculas con la familia de interfaz', () => {
    const elemento = host('sobre-default');

    expect(elemento.tagName.toLowerCase()).toBe('p');
    expect(elemento.classList.contains('font-interfaz')).toBe(true);
    expect(elemento.classList.contains('font-peso-etiqueta')).toBe(true);
    expect(elemento.classList.contains('tracking-etiqueta')).toBe(true);
    expect(elemento.classList.contains('uppercase')).toBe(true);
    expect(elemento.classList.contains('text-etiqueta')).toBe(true);
    expect(elemento.classList.contains('text-texto-apagado')).toBe(true);
    expect(elemento.textContent?.trim()).toBe('Bienvenido de nuevo');
  });

  it('debe permitir el color de marca y la etiqueta span', () => {
    const elemento = host('sobre-marca');

    expect(elemento.tagName.toLowerCase()).toBe('span');
    expect(elemento.classList.contains('text-marca-primaria')).toBe(true);
  });
});
