import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideIcons } from '@ng-icons/core';
import { BotonNavegacionCircular } from './boton-navegacion-circular';

const ICONO_PRUEBA = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

@Component({
  standalone: true,
  imports: [BotonNavegacionCircular],
  template: `
    <app-boton-navegacion-circular
      id="nav-inactivo"
      icono="phosphorHouseFill"
      etiquetaAria="Inicio"
      (accion)="registrar()"
    />
    <app-boton-navegacion-circular
      id="nav-activo"
      icono="phosphorTrophyFill"
      etiquetaAria="Torneos"
      [activo]="true"
      tamanio="lg"
    />
    <app-boton-navegacion-circular
      id="nav-insignia"
      icono="phosphorBellFill"
      etiquetaAria="Notificaciones"
      [insignia]="3"
    />
    <app-boton-navegacion-circular
      id="nav-deshabilitado"
      icono="phosphorQrCodeFill"
      etiquetaAria="Escanear QR"
      [deshabilitado]="true"
    />
  `,
})
class TestHostComponent {
  readonly acciones: string[] = [];

  registrar(): void {
    this.acciones.push('accion');
  }
}

describe('BotonNavegacionCircular Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  const boton = (id: string) =>
    fixture.debugElement.query(By.css(`#${id} button`)).nativeElement as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideIcons({
          phosphorHouseFill: ICONO_PRUEBA,
          phosphorTrophyFill: ICONO_PRUEBA,
          phosphorBellFill: ICONO_PRUEBA,
          phosphorQrCodeFill: ICONO_PRUEBA,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe renderizar el estado inactivo por defecto con la etiqueta accesible', () => {
    const btnEl = boton('nav-inactivo');

    expect(btnEl.type).toBe('button');
    expect(btnEl.getAttribute('aria-label')).toBe('Inicio');
    expect(btnEl.classList.contains('bg-fondo-superficie')).toBe(true);
    expect(btnEl.classList.contains('text-texto-secundario')).toBe(true);
    expect(btnEl.getAttribute('aria-pressed')).toBeNull();
  });

  it('debe marcar el estado activo con la marca primaria y aria-pressed', () => {
    const btnEl = boton('nav-activo');

    expect(btnEl.classList.contains('bg-marca-primaria')).toBe(true);
    expect(btnEl.classList.contains('text-marca-sobre-primaria')).toBe(true);
    expect(btnEl.classList.contains('h-[3.25rem]')).toBe(true);
    expect(btnEl.getAttribute('aria-pressed')).toBe('true');
  });

  it('debe integrar la insignia al nombre accesible y decorarla visualmente', () => {
    const btnEl = boton('nav-insignia');

    expect(btnEl.getAttribute('aria-label')).toBe('Notificaciones (3)');

    const insignia = btnEl.querySelector('[aria-hidden="true"]:not(ng-icon)');
    expect(insignia?.textContent?.trim()).toBe('3');
    expect(insignia?.classList.contains('bg-atencion')).toBe(true);
  });

  it('debe emitir accion al hacer clic', () => {
    boton('nav-inactivo').click();

    expect(fixture.componentInstance.acciones).toEqual(['accion']);
  });

  it('debe deshabilitar el control de forma nativa y semantica', () => {
    const btnEl = boton('nav-deshabilitado');

    expect(btnEl.disabled).toBe(true);
    expect(btnEl.getAttribute('aria-disabled')).toBe('true');
    expect(btnEl.classList.contains('opacity-50')).toBe(true);
    expect(btnEl.classList.contains('cursor-not-allowed')).toBe(true);
  });

  it('debe anular los estados hover y active cuando esta deshabilitado', () => {
    const btnEl = boton('nav-deshabilitado');

    // Las utilidades `habilitado:` siguen en el marcado: lo que las cancela es
    // el selector `:not(:disabled)` del variante custom de styles.css. Por eso
    // el atributo nativo `disabled` es la pieza que realmente las desactiva.
    expect(btnEl.className).toContain('habilitado:hover:bg-btn-terciario-hover');
    expect(btnEl.disabled).toBe(true);

    expect(btnEl.classList.contains('opacity-50')).toBe(true);
    expect(btnEl.classList.contains('shadow-none')).toBe(true);
  });

  it('debe conservar los estados hover y active cuando esta habilitado', () => {
    const btnEl = boton('nav-inactivo');

    expect(btnEl.className).toContain('habilitado:hover:bg-btn-terciario-hover');
    expect(btnEl.className).toContain('habilitado:active:bg-btn-terciario-activo');
    expect(btnEl.disabled).toBe(false);
    expect(btnEl.classList.contains('opacity-50')).toBe(false);
  });

  it('debe ignorar el clic cuando esta deshabilitado', () => {
    boton('nav-deshabilitado').click();

    expect(fixture.componentInstance.acciones).toEqual([]);
  });
});
