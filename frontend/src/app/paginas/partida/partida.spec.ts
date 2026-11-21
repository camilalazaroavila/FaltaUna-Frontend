import { Component, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BarajaService } from '@servicios/baraja.service';
import { SalaJuegoService } from '@servicios/sala-juego.service';
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
  let barajaMock: {
    obtenerMazos: jest.Mock;
  };

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
      resultadoFinal: signal(null),
      historialRondas: signal<readonly ResultadoRonda[]>([]),
      jugadores: signal({
        propio: { nombre: 'Vos', avatarUrl: null },
        rival: { nombre: 'Bot', avatarUrl: null },
      }),
      rivalEsBot: signal(true),
      anuncio: anuncioSignal,
      reconectar: jest.fn().mockReturnValue(of(true)),
      detenerSincronizacion: jest.fn(),
      abandonarPartida: jest.fn(),
      abandonar: jest.fn(),
      rendirse: jest.fn(),
      iniciarContraBot: jest.fn().mockReturnValue(of(true)),
    };

    const salaMock = {
      esperandoRivalRevancha: signal(false),
      revanchaSolicitada: signal(false),
      revanchaCancelada: signal(false),
      revanchaIniciada: signal(null),
      unirseACanalPartida: jest.fn().mockResolvedValue(undefined),
      solicitarRevancha: jest.fn().mockResolvedValue(undefined),
      cancelarRevancha: jest.fn().mockResolvedValue(undefined),
      limpiarEstadoRevancha: jest.fn(),
    };

    barajaMock = {
      obtenerMazos: jest.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [Partida],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PartidaServicio, useValue: servicioMock },
        { provide: SalaJuegoService, useValue: salaMock },
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

  it('muestra el tablero cuando la partida está activa sin cabecera superior redundante', () => {
    fixture.detectChanges();

    const tablero = fixture.nativeElement.querySelector('app-tablero');
    expect(tablero).toBeTruthy();
    const texto = fixture.nativeElement.textContent;
    expect(texto).not.toContain('Partida contra el bot');
  });

  it('expone el anuncio en la partida', () => {
    anuncioSignal.set('El bot jugó Dibu Martinez con poder 8 en Grido.');
    fixture.detectChanges();

    expect(fixture.componentInstance['servicio'].anuncio()).toBe(
      'El bot jugó Dibu Martinez con poder 8 en Grido.',
    );
  });

  it('muestra la pantalla de resultado cuando la partida finaliza', () => {
    (fixture.componentInstance['servicio'].terminada as unknown as { set: (v: boolean) => void }).set(true);
    (fixture.componentInstance['servicio'].resultadoFinal as unknown as { set: (v: unknown) => void }).set({
      partidaId: 7,
      ganador: 'propio',
      motivo: 'cien-puntos',
      puntosPropio: 105,
      puntosRival: 80,
      fechaFin: '2026-10-25T14:00:00Z',
    });
    fixture.detectChanges();

    const pantallaResultado = fixture.debugElement.nativeElement.querySelector('app-pantalla-resultado');
    expect(pantallaResultado).toBeTruthy();
    expect(pantallaResultado.textContent).toContain('¡Victoria!');
  });

  describe('Pantalla de selección de mazo (sin partida activa)', () => {
    beforeEach(() => {
      partidaIdSignal.set(null);
      fixture.detectChanges();
    });

    it('muestra el enlace de volver y el selector de mazos sin ilustración del bot', () => {
      const enlaceVolver = fixture.nativeElement.querySelector('a[routerLink="/usuario/jugar"]');
      expect(enlaceVolver).toBeTruthy();
      expect(enlaceVolver.textContent).toContain('Volver');

      // Comprobar que no hay imágenes de mascota del bot
      const mascota = fixture.nativeElement.querySelector('img[src*="Gatos jugando cartas"]');
      expect(mascota).toBeFalsy();

      // Comprobar que contiene el componente selector de mazos
      const selector = fixture.nativeElement.querySelector('app-selector-mazos');
      expect(selector).toBeTruthy();
    });

    it('permite jugar cuando hay un mazo completo seleccionado', () => {
      fixture.componentInstance['cargandoMazos'].set(false);
      fixture.componentInstance['errorMazos'].set(null);
      fixture.componentInstance['mazos'].set([
        { id: 10, nombre: 'Mazo Campeón', completo: true, cartas: [] } as any,
      ]);
      fixture.componentInstance['mazoSeleccionado'].set(10);
      fixture.detectChanges();

      expect(fixture.componentInstance['puedeJugar']()).toBe(true);
      const botonJugar = Array.from(fixture.nativeElement.querySelectorAll('button[app-boton]')).find(
        (b) => (b as HTMLButtonElement).textContent?.includes('Jugar contra el bot'),
      ) as HTMLButtonElement;
      expect(botonJugar).toBeTruthy();
      expect(botonJugar.disabled).toBe(false);
    });

    it('deshabilita el botón de jugar si el mazo seleccionado está incompleto', () => {
      fixture.componentInstance['cargandoMazos'].set(false);
      fixture.componentInstance['mazos'].set([
        { id: 1, nombre: 'Mazo Incompleto', completo: false, cartas: [] } as any,
      ]);
      fixture.componentInstance['mazoSeleccionado'].set(1);
      fixture.detectChanges();

      expect(fixture.componentInstance['puedeJugar']()).toBe(false);
      const botonJugar = Array.from(fixture.nativeElement.querySelectorAll('button[app-boton]')).find(
        (b) => (b as HTMLButtonElement).textContent?.includes('Jugar contra el bot'),
      ) as HTMLButtonElement;
      expect(botonJugar.disabled).toBe(true);
    });
  });
});
