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
  `,
})
class TestHostComponent {}

describe('Badge Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe renderizar con valores por defecto (exito, md, sin punto) y proyectar contenido', () => {
    const badgeEl = fixture.debugElement.query(By.css('#badge-default')).nativeElement as HTMLElement;
    expect(badgeEl).toBeTruthy();
    expect(badgeEl.classList.contains('badge')).toBe(true);
    expect(badgeEl.classList.contains('badge--exito')).toBe(true);
    expect(badgeEl.classList.contains('badge--md')).toBe(true);
    expect(badgeEl.textContent?.trim()).toBe('ACTIVO');
    expect(badgeEl.querySelector('.badge__punto')).toBeNull();
  });

  it('debe renderizar el punto indicador cuando punto="true" y aplicar variante acento', () => {
    const badgeEl = fixture.debugElement.query(By.css('#badge-acento')).nativeElement as HTMLElement;
    expect(badgeEl.classList.contains('badge--acento')).toBe(true);
    const puntoEl = badgeEl.querySelector('.badge__punto');
    expect(puntoEl).not.toBeNull();
    expect(puntoEl?.getAttribute('aria-hidden')).toBe('true');
    expect(badgeEl.textContent?.trim()).toBe('2/2 GRÁTIS');
  });

  it('debe aplicar tamaño sm y preservar clases del consumidor', () => {
    const badgeEl = fixture.debugElement.query(By.css('#badge-sm')).nativeElement as HTMLElement;
    expect(badgeEl.classList.contains('badge--sm')).toBe(true);
    expect(badgeEl.classList.contains('badge--error')).toBe(true);
    expect(badgeEl.classList.contains('custom-badge')).toBe(true);
  });
});
