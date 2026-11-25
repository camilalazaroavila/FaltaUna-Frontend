import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { BarajaService } from '@servicios/baraja.service';
import { SalaJuegoService, type PartidaIniciadaEvento } from '@servicios/sala-juego.service';
import { PartidaJugador } from './partida-jugador';

describe('PartidaJugador', () => {
  let fixture: ComponentFixture<PartidaJugador>;
  let router: Router;
  let partidaIniciadaSignal: ReturnType<typeof signal<PartidaIniciadaEvento | null>>;
  let buscandoRivalSignal: ReturnType<typeof signal<boolean>>;

  beforeEach(async () => {
    jest.useFakeTimers();
    localStorage.clear();

    partidaIniciadaSignal = signal<PartidaIniciadaEvento | null>(null);
    buscandoRivalSignal = signal(false);

    const salaMock = {
      buscandoRival: buscandoRivalSignal,
      partidaIniciada: partidaIniciadaSignal,
      cargando: signal(false),
      error: signal<string | null>(null),
      buscarPartida: jest.fn().mockResolvedValue(undefined),
      cancelarBusqueda: jest.fn().mockResolvedValue(undefined),
      desconectar: jest.fn(),
    };

    const barajaMock = {
      obtenerMazos: jest
        .fn()
        .mockReturnValue(of([{ id: 12, nombre: 'Mazo PvP', completo: true, cartas: [] }])),
    };

    await TestBed.configureTestingModule({
      imports: [PartidaJugador],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { modo: 'pvp' } } } },
        { provide: SalaJuegoService, useValue: salaMock },
        { provide: BarajaService, useValue: barajaMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(PartidaJugador);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
  });

  it('debe crearse correctamente y mostrar el selector de mazos', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-selector-mazos')).toBeTruthy();
  });

  it('muestra la pantalla de carga PvP al encontrar jugador y navega al tablero tras completarse', () => {
    partidaIniciadaSignal.set({ partidaId: 99 });
    fixture.detectChanges();

    expect(localStorage.getItem('faltauna_partida_activa')).toBe('99');
    expect(localStorage.getItem('faltauna_ultimo_mazo')).toBe('12');
    expect(fixture.nativeElement.querySelector('app-pantalla-carga-juego')).toBeTruthy();
    expect(router.navigate).not.toHaveBeenCalled();

    jest.advanceTimersByTime(4900);
    expect(router.navigate).toHaveBeenCalledWith(['/juego/ia']);
  });
});
