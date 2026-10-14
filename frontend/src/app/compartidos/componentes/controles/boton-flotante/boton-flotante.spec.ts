import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideIcons } from '@ng-icons/core';
import { BotonFlotante } from './boton-flotante';

const ICONO_PRUEBA = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

@Component({
  standalone: true,
  imports: [BotonFlotante],
  template: `
    <app-boton-flotante
      id="fab-default"
      icono="phosphorGiftFill"
      etiquetaAria="Abrir sobre"
      (accion)="registrar()"
    />
    <app-boton-flotante
      id="fab-contador"
      icono="phosphorBellFill"
      etiquetaAria="Notificaciones"
      [contador]="4"
    />
    <app-boton-flotante
      id="fab-cero"
      icono="phosphorBellFill"
      etiquetaAria="Notificaciones"
      [contador]="0"
    />
    <app-boton-flotante
      id="fab-deshabilitado"
      icono="phosphorLockFill"
      etiquetaAria="Disponible pronto"
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

describe('BotonFlotante Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  const boton = (id: string) =>
    fixture.debugElement.query(By.css(`#${id} button`)).nativeElement as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideIcons({
          phosphorGiftFill: ICONO_PRUEBA,
          phosphorBellFill: ICONO_PRUEBA,
          phosphorLockFill: ICONO_PRUEBA,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe quedar fijo en la esquina inferior derecha con la marca primaria', () => {
    const btnEl = boton('fab-default');

    expect(btnEl.classList.contains('fixed')).toBe(true);
    expect(btnEl.classList.contains('bottom-5')).toBe(true);
    expect(btnEl.classList.contains('right-5')).toBe(true);
    expect(btnEl.classList.contains('sm:bottom-8')).toBe(true);
    expect(btnEl.classList.contains('bg-marca-primaria')).toBe(true);
    expect(btnEl.classList.contains('rounded-circulo')).toBe(true);
    expect(btnEl.getAttribute('aria-label')).toBe('Abrir sobre');
  });

  it('debe mostrar el contador solo cuando es positivo', () => {
    expect(boton('fab-contador').querySelector('span')?.textContent?.trim()).toBe('4');
    expect(boton('fab-contador').getAttribute('aria-label')).toBe('Notificaciones (4 pendientes)');

    expect(boton('fab-cero').querySelector('span')).toBeNull();
    expect(boton('fab-cero').getAttribute('aria-label')).toBe('Notificaciones');
  });

  it('debe bloquear la interacción y atenuar el control cuando está deshabilitado', () => {
    const btnEl = boton('fab-deshabilitado');

    expect(btnEl.disabled).toBe(true);
    expect(btnEl.classList.contains('opacity-50')).toBe(true);
  });

  it('debe emitir accion al hacer clic y no hacerlo cuando está deshabilitado', () => {
    boton('fab-default').click();
    boton('fab-deshabilitado').click();

    expect(fixture.componentInstance.acciones).toEqual(['accion']);
  });
});
