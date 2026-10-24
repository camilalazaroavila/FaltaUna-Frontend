import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BarajaService } from '@servicios/baraja.service';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import { Tablero } from '@compartidos/componentes/partida/tablero/tablero';
import type { ResultadoRonda } from '@modelos/partida.model';
import { Partida } from './partida';

@Component({
  selector: 'app-tablero',
  template: '',
  standalone: true,
})
class DummyTableroComponent {}

describe('Partida', () => {
  let fixture: ComponentFixture<Partida>;
  let partidaIdSignal: ReturnType<typeof signal<number | null>>;
  let resultadoSignal: ReturnType<typeof signal<ResultadoRonda | null>>;
  let anuncioSignal: ReturnType<typeof signal<string>>;

  beforeEach(async () => {
    partidaIdSignal = signal<number | null>(7);
    resultadoSignal = signal<ResultadoRonda | null>(null);
    anuncioSignal = signal<string>('');

    const servicioMock = {
      partidaId: partidaIdSignal,
      cargando: signal(false),
      error: signal(null),
      terminada: signal(false),
      gane: signal(null),
      turno: signal(1),
      rondasTotales: signal(6),
      resultadoRonda: resultadoSignal,
      anuncio: anuncioSignal,
      reconectar: jest.fn().mockReturnValue(of(true)),
      detenerSincronizacion: jest.fn(),
      abandonarPartida: jest.fn(),
      rendirse: jest.fn(),
      iniciarContraBot: jest.fn().mockReturnValue(of(true)),
    };

    const barajaMock = {
      obtenerMazos: jest.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [Partida],
      providers: [
        provideRouter([]),
        { provide: PartidaServicio, useValue: servicioMock },
        { provide: BarajaService, useValue: barajaMock },
      ],
    })
      .overrideComponent(Partida, {
        remove: { imports: [Tablero] },
        add: { imports: [DummyTableroComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Partida);
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra la cabecera de ronda y el tablero cuando la partida está activa', () => {
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Partida contra el bot');
    expect(texto).toContain('Ronda 1 de 6');
    expect(texto).toContain('Abandonar');
  });

  it('expone el anuncio en la partida', () => {
    anuncioSignal.set('El bot jugó Dibu Martinez con poder 8 en Grido.');
    fixture.detectChanges();

    expect(fixture.componentInstance['servicio'].anuncio()).toBe(
      'El bot jugó Dibu Martinez con poder 8 en Grido.',
    );
  });
});
