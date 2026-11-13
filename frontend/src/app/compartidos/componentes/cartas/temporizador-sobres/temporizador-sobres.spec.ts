import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TemporizadorSobres } from './temporizador-sobres';

@Component({
  standalone: true,
  imports: [TemporizadorSobres],
  template: `
    <app-temporizador-sobres
      [proximaRecarga]="proximaRecarga"
      [sobresDisponibles]="disponibles"
      [sobresMaximos]="maximos"
      [cargando]="cargando"
      [error]="error"
      (tiempoAgotado)="alAgotarTiempo()"
    />
  `,
})
class HostComponent {
  proximaRecarga: string | null = null;
  disponibles = 0;
  maximos = 2;
  cargando = false;
  error: string | null = null;
  tiempoAgotadoLlamado = false;

  alAgotarTiempo(): void {
    this.tiempoAgotadoLlamado = true;
  }
}

describe('TemporizadorSobres', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('muestra estado neutro si no hay fecha provista por el backend y no inventa una cuenta falsa', () => {
    host.proximaRecarga = null;
    host.disponibles = 0;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Los sobres gratuitos se recargan diariamente');
    expect(fixture.debugElement.query(By.css('[role="timer"]'))).toBeNull();
  });

  it('muestra la cuenta regresiva en formato HH:MM:SS cuando el backend envía una fecha futura', () => {
    // 3 horas, 20 minutos y 10 segundos en el futuro
    const futuro = new Date(Date.now() + (3 * 3600 + 20 * 60 + 10) * 1000).toISOString();
    host.proximaRecarga = futuro;
    host.disponibles = 0;
    fixture.detectChanges();

    const timerEl = fixture.debugElement.query(By.css('[role="timer"]'));
    expect(timerEl).toBeTruthy();
    expect(timerEl.nativeElement.textContent).toMatch(/03:20:(09|10)/);
  });

  it('emite tiempoAgotado al llegar a cero o con fecha cumplida', () => {
    const pasado = new Date(Date.now() - 1000).toISOString();
    host.proximaRecarga = pasado;
    host.disponibles = 0;
    fixture.detectChanges();

    expect(host.tiempoAgotadoLlamado).toBe(true);
  });

  it('muestra mensaje de sobres completos cuando los disponibles igualan el máximo', () => {
    host.disponibles = 2;
    host.maximos = 2;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('¡Tenés todos tus sobres diarios listos');
  });

  it('muestra estado de carga cuando cargando es true', () => {
    host.cargando = true;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Consultando sobres…');
  });

  it('muestra una barra como timer de progreso para cada sobre diario', () => {
    // 1 sobre listo y el 2do recargando (con fecha a 6 hs = 50% de 12 hs)
    const seisHoras = new Date(Date.now() + 6 * 3600 * 1000).toISOString();
    host.proximaRecarga = seisHoras;
    host.disponibles = 1;
    host.maximos = 2;
    fixture.detectChanges();

    const progressBars = fixture.debugElement.queryAll(By.css('[role="progressbar"]'));
    expect(progressBars.length).toBe(2);

    // Sobre 1 está listo (100%)
    expect(progressBars[0].attributes['aria-valuenow']).toBe('100');
    expect(fixture.nativeElement.textContent).toContain('Sobre 1');
    expect(fixture.nativeElement.textContent).toContain('¡Listo!');

    // Sobre 2 está recargando (aprox 50%)
    const valorS2 = Number(progressBars[1].attributes['aria-valuenow']);
    expect(valorS2).toBeGreaterThanOrEqual(48);
    expect(valorS2).toBeLessThanOrEqual(52);
    expect(fixture.nativeElement.textContent).toContain('Sobre 2');
    expect(fixture.nativeElement.textContent).toContain('Cargando');
  });
});
