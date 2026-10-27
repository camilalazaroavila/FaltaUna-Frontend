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
      resultadoFinal: signal(null),
      historialRondas: signal<readonly ResultadoRonda[]>([]),
      jugadores: signal({
        propio: { nombre: 'Vos', avatarUrl: null },
        rival: { nombre: 'Bot', avatarUrl: null },
      }),
      anuncio: anuncioSignal,
      reconectar: jest.fn().mockReturnValue(of(true)),
      detenerSincronizacion: jest.fn(),
      abandonarPartida: jest.fn(),
      abandonar: jest.fn(),
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

    it('muestra el enlace de volver y la mascota con texto alternativo accesible', () => {
      const enlaceVolver = fixture.nativeElement.querySelector('a[routerLink="/usuario/jugar"]');
      expect(enlaceVolver).toBeTruthy();
      expect(enlaceVolver.textContent).toContain('Volver');

      const mascota = fixture.nativeElement.querySelector('img.mascota-imagen') as HTMLImageElement;
      expect(mascota).toBeTruthy();
      expect(mascota.getAttribute('alt')).toContain('Elegí tu mazo, lo voy a poner');
    });

    it('muestra estado de carga mientras cargandoMazos es true', () => {
      fixture.componentInstance['cargandoMazos'].set(true);
      fixture.detectChanges();

      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('Cargando tus mazos…');
    });

    it('muestra mensaje de error cuando falla la carga de mazos', () => {
      fixture.componentInstance['cargandoMazos'].set(false);
      fixture.componentInstance['errorMazos'].set('Error al conectar con el servidor.');
      fixture.detectChanges();

      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('Error al conectar con el servidor.');
    });

    it('muestra advertencia y acceso directo a Mi baraja cuando no hay mazos completos', () => {
      fixture.componentInstance['cargandoMazos'].set(false);
      fixture.componentInstance['errorMazos'].set(null);
      fixture.componentInstance['mazos'].set([
        { id: 1, nombre: 'Mazo Incompleto', completo: false, cartas: [] } as any,
      ]);
      fixture.detectChanges();

      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('No tenés un mazo completo');

      const enlaceBaraja = fixture.nativeElement.querySelector('a[routerLink="/usuario/baraja"]');
      expect(enlaceBaraja).toBeTruthy();
      expect(enlaceBaraja.textContent).toContain('Ir a Mi baraja');

      const botonJugar = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
        (b) => (b as HTMLButtonElement).textContent?.includes('Jugar contra el bot'),
      ) as HTMLButtonElement;
      expect(botonJugar.disabled).toBe(true);
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
      const botonJugar = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
        (b) => (b as HTMLButtonElement).textContent?.includes('Jugar contra el bot'),
      ) as HTMLButtonElement;
      expect(botonJugar).toBeTruthy();
      expect(botonJugar.disabled).toBe(false);
    });

    it('deshabilita el botón y muestra spinner cuando la partida está creándose', () => {
      fixture.componentInstance['cargandoMazos'].set(false);
      fixture.componentInstance['mazos'].set([
        { id: 10, nombre: 'Mazo Campeón', completo: true, cartas: [] } as any,
      ]);
      fixture.componentInstance['mazoSeleccionado'].set(10);
      (fixture.componentInstance['servicio'].cargando as unknown as { set: (v: boolean) => void }).set(true);
      fixture.detectChanges();

      expect(fixture.componentInstance['puedeJugar']()).toBe(false);
      const botonJugar = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
        (b) => (b as HTMLButtonElement).textContent?.includes('Jugar contra el bot'),
      ) as HTMLButtonElement;
      expect(botonJugar.disabled).toBe(true);
    });
  });
});
