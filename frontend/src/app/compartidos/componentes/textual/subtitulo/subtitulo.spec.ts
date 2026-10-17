import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subtitulo } from './subtitulo';

@Component({
  standalone: true,
  imports: [Subtitulo],
  template: `
    <p app-subtitulo id="subtitulo-default">Subtítulo por defecto</p>
    <h3 app-subtitulo id="subtitulo-h3" tamano="sm">Chico</h3>
    <p app-subtitulo id="subtitulo-heredar" color="heredar">Heredado</p>
  `,
})
class TestHostComponent {}

describe('Subtitulo Component', () => {
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

  it('debe renderizar la etiqueta nativa con familia display y color secundario por defecto', () => {
    const elemento = host('subtitulo-default');

    expect(elemento.tagName.toLowerCase()).toBe('p');
    expect(elemento.classList.contains('font-titulo')).toBe(true);
    expect(elemento.classList.contains('text-subtitulo')).toBe(true);
    expect(elemento.classList.contains('text-texto-secundario')).toBe(true);
    expect(elemento.textContent?.trim()).toBe('Subtítulo por defecto');
  });

  it('debe combinar nivel semántico y visual por separado', () => {
    const elemento = host('subtitulo-h3');

    expect(elemento.tagName.toLowerCase()).toBe('h3');
    expect(elemento.classList.contains('text-menor')).toBe(true);
  });

  it('debe omitir el color cuando se elige heredar', () => {
    const elemento = host('subtitulo-heredar');

    expect(elemento.classList.contains('text-texto-secundario')).toBe(false);
    expect(elemento.classList.contains('text-texto-primario')).toBe(false);
  });
});
