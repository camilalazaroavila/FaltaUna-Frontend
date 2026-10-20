import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { IndicadorTurno } from './indicador-turno';

const ICONO_PRUEBA = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

@Component({
  standalone: true,
  imports: [IndicadorTurno],
  template: `
    <app-indicador-turno
      id="indicador"
      [turno]="turno()"
      [totalTurnos]="6"
      [segundosRestantes]="segundos()"
      (rendirse)="registrarRendicion()"
    />
  `,
})
class HostComponent {
  readonly turno = signal(1);
  readonly segundos = signal(40);
  readonly rendiciones: string[] = [];

  registrarRendicion(): void {
    this.rendiciones.push('rendirse');
  }
}

describe('IndicadorTurno Component', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const indicador = () => fixture.debugElement.query(By.css('#indicador')).nativeElement as HTMLElement;
  const tiempo = () => indicador().querySelector('[role="timer"]') as HTMLElement;
  const icono = () =>
    fixture.debugElement.query(By.css('#indicador [role="timer"] ng-icon')).componentInstance as NgIcon;

  const actualizar = (cambios: { turno?: number; segundos?: number }) => {
    if (cambios.turno !== undefined) {
      host.turno.set(cambios.turno);
    }

    if (cambios.segundos !== undefined) {
      host.segundos.set(cambios.segundos);
    }

    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideIcons({ phosphorWarningFill: ICONO_PRUEBA, phosphorHourglassMediumFill: ICONO_PRUEBA }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe mostrar el turno actual sobre el total', () => {
    expect(indicador().textContent).toContain('Turno 1/6');
  });

  it('debe actualizar el turno en pantalla', () => {
    actualizar({ turno: 4 });

    expect(indicador().textContent).toContain('Turno 4/6');
  });

  it('debe exponer el tiempo como timer accesible sin aria-live', () => {
    const el = tiempo();

    expect(el.getAttribute('role')).toBe('timer');
    expect(el.getAttribute('aria-label')).toBe('Turno 1 de 6, quedan 40 segundos');
    expect(el.hasAttribute('aria-live')).toBe(false);
  });

  it('debe usar el ícono de reloj cuando queda tiempo suficiente', () => {
    expect(icono().name()).toBe('phosphorHourglassMediumFill');
    expect(tiempo().classList.contains('text-advertencia-texto')).toBe(false);
  });

  it('debe pasar a advertencia con ícono cuando quedan 10 segundos o menos', () => {
    actualizar({ segundos: 10 });

    expect(tiempo().classList.contains('text-advertencia-texto')).toBe(true);
    expect(indicador().querySelector('.border-advertencia-borde')).not.toBeNull();
    expect(icono().name()).toBe('phosphorWarningFill');
  });

  it('debe volver al estado normal cuando se recupera el tiempo', () => {
    actualizar({ segundos: 5 });
    actualizar({ segundos: 20 });

    expect(tiempo().classList.contains('text-advertencia-texto')).toBe(false);
    expect(icono().name()).toBe('phosphorHourglassMediumFill');
  });

  const botonPorTexto = (texto: string) =>
    Array.from(indicador().querySelectorAll('button')).find((b) =>
      b.textContent?.includes(texto),
    ) as HTMLButtonElement;

  it('no debe emitir rendirse al primer toque: pide confirmación', () => {
    botonPorTexto('Rendirme').click();
    fixture.detectChanges();

    expect(indicador().querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(host.rendiciones).toEqual([]);
  });

  it('debe emitir rendirse solo tras confirmar', () => {
    botonPorTexto('Rendirme').click();
    fixture.detectChanges();
    botonPorTexto('Sí, rendirme').click();
    fixture.detectChanges();

    expect(host.rendiciones).toEqual(['rendirse']);
    expect(indicador().querySelector('[role="alertdialog"]')).toBeNull();
  });

  it('debe cancelar sin emitir', () => {
    botonPorTexto('Rendirme').click();
    fixture.detectChanges();
    botonPorTexto('Cancelar').click();
    fixture.detectChanges();

    expect(host.rendiciones).toEqual([]);
    expect(indicador().querySelector('[role="alertdialog"]')).toBeNull();
  });
});
