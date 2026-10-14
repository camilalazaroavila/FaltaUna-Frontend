import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideIcons } from '@ng-icons/core';
import { NgIcon } from '@ng-icons/core';
import { BotonJugar } from './boton-jugar';

const ICONO_PRUEBA = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

@Component({
  standalone: true,
  imports: [BotonJugar],
  template: `
    <app-boton-jugar id="jugar-default" (accion)="registrar()" />
    <app-boton-jugar
      id="jugar-subtexto"
      texto="Abrir sobre"
      subtexto="2 gratis hoy"
      (accion)="registrar()"
    />
    <app-boton-jugar id="jugar-bloqueado" texto="Partido" [deshabilitado]="true" />
  `,
})
class TestHostComponent {
  readonly eventos: string[] = [];

  registrar(): void {
    this.eventos.push('accion');
  }
}

describe('BotonJugar Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  const boton = (id: string) =>
    fixture.debugElement.query(By.css(`#${id} button`)).nativeElement as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideIcons({ phosphorPlayFill: ICONO_PRUEBA })],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe renderizar el CTA hero con tipografía display y marca primaria', () => {
    const btnEl = boton('jugar-default');

    expect(btnEl.type).toBe('button');
    expect(btnEl.classList.contains('bg-marca-primaria')).toBe(true);
    expect(btnEl.classList.contains('text-marca-sobre-primaria')).toBe(true);
    expect(btnEl.classList.contains('font-titulo')).toBe(true);
    expect(btnEl.classList.contains('shadow-alta')).toBe(true);
    expect(btnEl.textContent).toContain('JUGAR');

    const icono = fixture.debugElement.query(By.css('#jugar-default ng-icon'))
      .componentInstance as NgIcon;
    expect(icono.name()).toBe('phosphorPlayFill');
  });

  it('debe usar el texto y subtexto proporcionados', () => {
    const btnEl = boton('jugar-subtexto');

    expect(btnEl.textContent).toContain('Abrir sobre');
    expect(btnEl.textContent).toContain('2 gratis hoy');

    expect(boton('jugar-default').textContent).not.toContain('undefined');
  });

  it('debe montar el halo animable solo cuando se permite el movimiento', () => {
    expect(boton('jugar-default').querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('debe bloquear el control de forma nativa cuando está deshabilitado', () => {
    const btnEl = boton('jugar-bloqueado');

    expect(btnEl.disabled).toBe(true);
    expect(btnEl.classList.contains('disabled:opacity-60')).toBe(true);
  });

  it('debe emitir accion al hacer clic y no hacerlo cuando está deshabilitado', () => {
    boton('jugar-default').click();
    boton('jugar-subtexto').click();
    boton('jugar-bloqueado').click();

    expect(fixture.componentInstance.eventos).toEqual(['accion', 'accion']);
  });
});
