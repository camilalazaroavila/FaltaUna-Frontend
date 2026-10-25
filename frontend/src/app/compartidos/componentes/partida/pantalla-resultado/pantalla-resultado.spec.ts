import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PantallaResultado } from './pantalla-resultado';
import type { ResultadoPartidaApi } from '@modelos/partida.model';

@Component({
  standalone: true,
  imports: [PantallaResultado],
  template: `
    <app-pantalla-resultado
      [resultado]="resultado()"
      [nombreJugador]="nombreJugador()"
      [nombreRival]="nombreRival()"
      (jugarOtraVez)="onJugarOtraVez()"
      (volverAlMenu)="onVolverAlMenu()"
    />
  `,
})
class TestHostComponent {
  resultado = signal<ResultadoPartidaApi | null>(null);
  nombreJugador = signal('Vos');
  nombreRival = signal('Bot');
  reintentado = false;
  salido = false;

  onJugarOtraVez(): void {
    this.reintentado = true;
  }

  onVolverAlMenu(): void {
    this.salido = true;
  }
}

describe('PantallaResultado', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('muestra estado neutral cuando el resultado es null o sin ganador reconocible', () => {
    host.resultado.set(null);
    fixture.detectChanges();

    const titulo = fixture.debugElement.query(By.css('#titulo-resultado')).nativeElement;
    expect(titulo.textContent).toContain('Partida finalizada');
  });

  it('muestra Victoria cuando el ganador es propio con sus puntos y motivo', () => {
    host.resultado.set({
      partidaId: 10,
      ganador: 'propio',
      motivo: 'cien-puntos',
      puntosPropio: 102,
      puntosRival: 84,
      fechaFin: '2026-10-25T12:00:00Z',
    });
    fixture.detectChanges();

    const titulo = fixture.debugElement.query(By.css('#titulo-resultado')).nativeElement;
    expect(titulo.textContent).toContain('¡Victoria!');

    const motivo = fixture.debugElement.query(By.css('#motivo-resultado')).nativeElement;
    expect(motivo.textContent).toContain('Se alcanzó el límite de 100 puntos.');

    const textoCompleto = fixture.nativeElement.textContent;
    expect(textoCompleto).toContain('102');
    expect(textoCompleto).toContain('84');
  });

  it('muestra Derrota cuando el ganador es rival por rendición', () => {
    host.resultado.set({
      partidaId: 10,
      ganador: 'rival',
      motivo: 'rendicion',
      puntosPropio: 20,
      puntosRival: 40,
      fechaFin: '2026-10-25T12:00:00Z',
    });
    fixture.detectChanges();

    const titulo = fixture.debugElement.query(By.css('#titulo-resultado')).nativeElement;
    expect(titulo.textContent).toContain('Derrota');

    const motivo = fixture.debugElement.query(By.css('#motivo-resultado')).nativeElement;
    expect(motivo.textContent).toContain('La partida terminó por rendición.');
  });

  it('muestra Empate cuando el ganador es empate por seis rondas', () => {
    host.resultado.set({
      partidaId: 10,
      ganador: 'empate',
      motivo: 'seis-rondas',
      puntosPropio: 50,
      puntosRival: 50,
      fechaFin: '2026-10-25T12:00:00Z',
    });
    fixture.detectChanges();

    const titulo = fixture.debugElement.query(By.css('#titulo-resultado')).nativeElement;
    expect(titulo.textContent).toContain('Empate');

    const motivo = fixture.debugElement.query(By.css('#motivo-resultado')).nativeElement;
    expect(motivo.textContent).toContain('Se completaron las 6 rondas reglamentarias.');
  });

  it('muestra motivo de abandono correctamente', () => {
    host.resultado.set({
      partidaId: 10,
      ganador: 'rival',
      motivo: 'desconexion',
      puntosPropio: 10,
      puntosRival: 30,
      fechaFin: null,
    });
    fixture.detectChanges();

    const motivo = fixture.debugElement.query(By.css('#motivo-resultado')).nativeElement;
    expect(motivo.textContent).toContain('La partida terminó por abandono.');
  });

  it('emite jugarOtraVez al hacer clic en "Jugar otra vez"', () => {
    fixture.detectChanges();
    const botones = fixture.debugElement.queryAll(By.css('button[app-boton]'));
    const botonJugar = botones.find((b) => b.nativeElement.textContent.includes('Jugar otra vez'));
    expect(botonJugar).toBeTruthy();

    botonJugar!.nativeElement.click();
    expect(host.reintentado).toBe(true);
  });

  it('emite volverAlMenu al hacer clic en "Volver al menú"', () => {
    fixture.detectChanges();
    const botones = fixture.debugElement.queryAll(By.css('button[app-boton]'));
    const botonMenu = botones.find((b) => b.nativeElement.textContent.includes('Volver al menú'));
    expect(botonMenu).toBeTruthy();

    botonMenu!.nativeElement.click();
    expect(host.salido).toBe(true);
  });
});
