import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ModalResultado, TipoModalResultado } from './modal-resultado';

@Component({
  standalone: true,
  imports: [ModalResultado],
  template: `
    <app-modal-resultado
      [tipo]="tipo()"
      [titulo]="titulo()"
      [mensaje]="mensaje()"
      (cerrar)="cierres = cierres + 1"
    />
  `,
})
class TestHostComponent {
  readonly tipo = signal<TipoModalResultado>('exito');
  readonly titulo = signal('¡Canjeo exitoso!');
  readonly mensaje = signal('Ahora puedes reclamar las recompensas');
  cierres = 0;
}

describe('ModalResultado', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  const texto = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('muestra título y mensaje del caso de éxito', () => {
    expect(texto()).toContain('¡Canjeo exitoso!');
    expect(texto()).toContain('Ahora puedes reclamar las recompensas');
    expect(fixture.debugElement.query(By.css('[role="dialog"]'))).not.toBeNull();
  });

  it('usa alertdialog y el ícono de error cuando el tipo es error', () => {
    host.tipo.set('error');
    host.titulo.set('Hubo un problema :(');
    host.mensaje.set('El código que ingresaste es incorrecto o está expirado');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('[role="alertdialog"]'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('.bg-error'))).not.toBeNull();
    expect(texto()).toContain('Hubo un problema :(');
  });

  it('emite cerrar al tocar la X y al tocar el fondo', () => {
    fixture.debugElement.query(By.css('button[aria-label="Cerrar"]')).nativeElement.click();
    fixture.debugElement.query(By.css('.backdrop-blur-xs')).nativeElement.click();
    expect(host.cierres).toBe(2);
  });
});