import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideIcons } from '@ng-icons/core';
import { NgIcon } from '@ng-icons/core';
import { BotonIcono } from './boton-icono';

const ICONO_PRUEBA = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

@Component({
  standalone: true,
  imports: [BotonIcono],
  template: `
    <app-boton-icono
      id="icono-default"
      icono="phosphorXFill"
      etiquetaAria="Cerrar modal"
      (accion)="registrar()"
    />
    <app-boton-icono
      id="icono-superficie"
      icono="phosphorHeartFill"
      etiquetaAria="Marcar favorito"
      variante="superficie"
      tamanio="sm"
    />
    <app-boton-icono
      id="icono-deshabilitado"
      icono="phosphorLockFill"
      etiquetaAria="Bloqueado"
      [disabled]="true"
      (accion)="registrar()"
    />
  `,
})
class TestHostComponent {
  readonly acciones: string[] = [];

  registrar(): void {
    this.acciones.push('accion');
  }
}

describe('BotonIcono Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  const host = (id: string) =>
    fixture.debugElement.query(By.css(`#${id}`)).nativeElement as HTMLElement;
  const boton = (id: string) => host(id).querySelector('button') as HTMLButtonElement;
  const iconoDe = (id: string) =>
    fixture.debugElement.query(By.css(`#${id} ng-icon`)).componentInstance as NgIcon;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideIcons({ phosphorXFill: ICONO_PRUEBA, phosphorHeartFill: ICONO_PRUEBA, phosphorLockFill: ICONO_PRUEBA })],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe renderizar un botón nativo con la etiqueta accesible obligatoria', () => {
    const btnEl = boton('icono-default');

    expect(btnEl.type).toBe('button');
    expect(btnEl.getAttribute('aria-label')).toBe('Cerrar modal');
    expect(iconoDe('icono-default').name()).toBe('phosphorXFill');
  });

  it('debe aplicar variante fantasma circular y tamaño md por defecto', () => {
    const btnEl = boton('icono-default');

    expect(btnEl.classList.contains('rounded-circulo')).toBe(true);
    expect(btnEl.classList.contains('bg-btn-fantasma-bg')).toBe(true);
    expect(btnEl.classList.contains('size-11')).toBe(true);
    expect(btnEl.classList.contains('area-tactil')).toBe(false);
  });

  it('debe aplicar la variante superficie con sombra y el área táctil en sm', () => {
    const btnEl = boton('icono-superficie');

    expect(btnEl.classList.contains('bg-fondo-elevado')).toBe(true);
    expect(btnEl.classList.contains('border-borde-default')).toBe(true);
    expect(btnEl.classList.contains('shadow-baja')).toBe(true);
    expect(btnEl.classList.contains('size-8')).toBe(true);
    expect(btnEl.classList.contains('area-tactil')).toBe(true);
  });

  it('debe emitir accion al hacer clic y bloquearla cuando está deshabilitado', () => {
    boton('icono-default').click();
    boton('icono-deshabilitado').click();

    expect(fixture.componentInstance.acciones).toEqual(['accion']);
  });

  it('debe marcar el estado deshabilitado en el DOM y atenuar el control', () => {
    const btnEl = boton('icono-deshabilitado');

    expect(btnEl.disabled).toBe(true);
    expect(btnEl.classList.contains('opacity-50')).toBe(true);
    expect(btnEl.classList.contains('cursor-not-allowed')).toBe(true);
  });
});
