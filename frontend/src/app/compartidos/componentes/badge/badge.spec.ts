import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Badge } from './badge';

@Component({
  standalone: true,
  imports: [Badge],
  template: `
    <app-badge id="badge-default">ACTIVO</app-badge>
    <app-badge id="badge-acento" variante="acento" punto>2/2 GRÁTIS</app-badge>
    <app-badge id="badge-sm" tamanio="sm" variante="error" class="custom-badge">ERROR</app-badge>
    <app-badge id="badge-neutro" variante="neutro" punto>CERRADO</app-badge>
  `,
})
class TestHostComponent {}

describe('Badge Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  const badge = (id: string) =>
    fixture.debugElement.query(By.css(`#${id}`)).nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe renderizar con valores por defecto (exito, md, sin punto) y proyectar contenido', () => {
    const badgeEl = badge('badge-default');

    expect(badgeEl.classList.contains('inline-flex')).toBe(true);
    expect(badgeEl.classList.contains('rounded-pildora')).toBe(true);
    expect(badgeEl.classList.contains('font-interfaz')).toBe(true);
    expect(badgeEl.classList.contains('bg-exito-fondo')).toBe(true);
    expect(badgeEl.classList.contains('text-exito-texto')).toBe(true);
    expect(badgeEl.classList.contains('h-[1.75rem]')).toBe(true);
    expect(badgeEl.textContent?.trim()).toBe('ACTIVO');
    expect(badgeEl.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('debe renderizar el punto indicador con el color de la marca en la variante acento', () => {
    const badgeEl = badge('badge-acento');

    expect(badgeEl.classList.contains('font-titulo')).toBe(true);
    expect(badgeEl.classList.contains('text-marca-acento')).toBe(true);
    // La variante acento no debe heredar el alto fijo de las variantes con fondo.
    expect(badgeEl.classList.contains('h-auto')).toBe(true);
    expect(badgeEl.classList.contains('h-\\[1.75rem\\]')).toBe(false);

    const puntoEl = badgeEl.querySelector('[aria-hidden="true"]');
    expect(puntoEl).not.toBeNull();
    expect(puntoEl?.classList.contains('bg-marca-primaria')).toBe(true);
    expect(puntoEl?.classList.contains('bg-current')).toBe(false);
    expect(badgeEl.textContent?.trim()).toBe('2/2 GRÁTIS');
  });

  it('debe aplicar el punto con el color actual del texto en variantes con fondo', () => {
    const badgeEl = badge('badge-neutro');

    expect(badgeEl.classList.contains('bg-estado-neutro-fondo')).toBe(true);
    expect(badgeEl.textContent?.trim()).toBe('CERRADO');

    const puntoEl = badgeEl.querySelector('[aria-hidden="true"]');
    expect(puntoEl?.classList.contains('bg-current')).toBe(true);
    expect(puntoEl?.classList.contains('bg-marca-primaria')).toBe(false);
  });

  it('debe aplicar tamaño sm y preservar clases del consumidor', () => {
    const badgeEl = badge('badge-sm');

    expect(badgeEl.classList.contains('h-[1.375rem]')).toBe(true);
    expect(badgeEl.classList.contains('text-[0.6875rem]')).toBe(true);
    expect(badgeEl.classList.contains('bg-error-fondo')).toBe(true);
    expect(badgeEl.classList.contains('custom-badge')).toBe(true);
  });
});
