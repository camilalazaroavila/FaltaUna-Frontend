import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import type { MazoApi } from '@modelos/mazo.model';
import type { JugadorTablero } from '@modelos/partida.model';
import { AuthService } from '@servicios/auth.service';
import { BarajaService } from '@servicios/baraja.service';
import { GsapService } from '@servicios/gsap.service';
import { PartidaIniciadaEvento, SalaJuegoService } from '@servicios/sala-juego.service';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import { PAUSA_CONFIRMACION_CARGA_MS } from '@servicios/servicios-partida/transicion-carga.service';
import { PartidaJugador } from './partida-jugador';

const MAZOS_MOCK: MazoApi[] = [
  {
    id: 1,
    nombre: 'Mazo Incompleto',
    completo: false,
    cartas: [],
  },
  {
    id: 2,
    nombre: 'Mazo Competitivo',
    completo: true,
    cartas: [],
  },
  {
    id: 3,
    nombre: 'Mazo por Cantidad',
    completo: false,
    cartas: Array.from({ length: 12 }, (_, i) => ({
      cartaId: i + 1,
      nombre: `Carta ${i + 1}`,
      poder: 5,
      costeTicket: 1,
      costoCupon: 1,
      rarezaId: 1,
      rareza: 'Común',
      rarezaOrden: 1,
      imagenUrl: null,
    })),
  },
];

describe('PartidaJugador', () => {
  let fixture: ComponentFixture<PartidaJugador>;
  let componente: PartidaJugador;
  let router: Router;

  let buscandoRivalSignal: ReturnType<typeof signal<boolean>>;
  let partidaIniciadaSignal: ReturnType<typeof signal<PartidaIniciadaEvento | null>>;
  let cargandoSalaSignal: ReturnType<typeof signal<boolean>>;
  let errorSalaSignal: ReturnType<typeof signal<string | null>>;
  let partidaIdSignal: ReturnType<typeof signal<number | null>>;
  let jugadoresSignal: ReturnType<
    typeof signal<{ propio: JugadorTablero; rival: JugadorTablero }>
  >;

  let salaMock: {
    buscandoRival: ReturnType<typeof signal<boolean>>;
    partidaIniciada: ReturnType<typeof signal<PartidaIniciadaEvento | null>>;
    cargando: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    buscarPartida: jest.Mock;
    cancelarBusqueda: jest.Mock;
    desconectar: jest.Mock;
  };

  let barajaMock: {
    obtenerMazos: jest.Mock;
  };

  let partidaServicioMock: {
    partidaId: ReturnType<typeof signal<number | null>>;
    jugadores: ReturnType<typeof signal<{ propio: JugadorTablero; rival: JugadorTablero }>>;
    reconectar: jest.Mock;
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    localStorage.clear();

    buscandoRivalSignal = signal<boolean>(false);
    partidaIniciadaSignal = signal<PartidaIniciadaEvento | null>(null);
    cargandoSalaSignal = signal<boolean>(false);
    errorSalaSignal = signal<string | null>(null);
    partidaIdSignal = signal<number | null>(null);
    jugadoresSignal = signal({
      propio: { nombre: 'Gonzamirko', avatarUrl: null },
      rival: { nombre: 'Pedrope', avatarUrl: null },
    });

    salaMock = {
      buscandoRival: buscandoRivalSignal,
      partidaIniciada: partidaIniciadaSignal,
      cargando: cargandoSalaSignal,
      error: errorSalaSignal,
      buscarPartida: jest.fn().mockResolvedValue(undefined),
      cancelarBusqueda: jest.fn().mockResolvedValue(undefined),
      desconectar: jest.fn(),
    };
    barajaMock = {
      obtenerMazos: jest.fn().mockReturnValue(of(MAZOS_MOCK)),
    };

    partidaServicioMock = {
      partidaId: partidaIdSignal,
      jugadores: jugadoresSignal,
      reconectar: jest.fn().mockImplementation(() => {
        partidaIdSignal.set(99);
        jugadoresSignal.set({
          propio: { nombre: 'UsuarioReal', avatarUrl: null },
          rival: { nombre: 'RivalReal', avatarUrl: null },
        });
        return of(true);
      }),
    };

    const authMock = {
      usuarioActual: signal({ nombreUsuario: 'UsuarioReal' }),
    };

    const gsapMock = {
      movimientoReducido: jest.fn().mockReturnValue(true),
      crearContexto: jest.fn(),
      gsap: {},
    };

    await TestBed.configureTestingModule({
      imports: [PartidaJugador],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { modo: 'pvp' } } } },
        { provide: AuthService, useValue: authMock },
        { provide: SalaJuegoService, useValue: salaMock },
        { provide: BarajaService, useValue: barajaMock },
        { provide: PartidaServicio, useValue: partidaServicioMock },
        { provide: GsapService, useValue: gsapMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(PartidaJugador);
    componente = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
  });

  it('debe crearse correctamente y cargar los mazos al iniciar', () => {
    expect(componente).toBeTruthy();
    expect(barajaMock.obtenerMazos).toHaveBeenCalledTimes(1);
    expect(componente['mazos']()).toEqual(MAZOS_MOCK);
    expect(componente['cargandoMazos']()).toBe(false);
  });

  it('selecciona automáticamente el primer mazo válido (completo o de 12 cartas)', () => {
    expect(componente['mazoSeleccionado']()).toBe(2);
    expect(componente['mazoSeleccionadoDetalle']()?.nombre).toBe('Mazo Competitivo');
    expect(componente['mazosValidos']().map((m) => m.id)).toEqual([2, 3]);
  });

  it('permite cambiar el mazo seleccionado', () => {
    componente['seleccionarMazo'](3);
    fixture.detectChanges();

    expect(componente['mazoSeleccionado']()).toBe(3);
    expect(componente['mazoSeleccionadoDetalle']()?.nombre).toBe('Mazo por Cantidad');
  });

  it('muestra alerta si el usuario tiene mazos pero ninguno es válido', () => {
    barajaMock.obtenerMazos.mockReturnValue(
      of([{ id: 10, nombre: 'Incompleto', completo: false, cartas: [] }]),
    );
    componente['mazoSeleccionado'].set(null);
    componente['cargarMazos']();
    fixture.detectChanges();

    expect(componente['mazosValidos']()).toHaveLength(0);
    expect(componente['mazoSeleccionado']()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Ninguno de tus mazos tiene las 12 cartas',
    );
  });

  it('maneja el error al fallar la carga de mazos', () => {
    barajaMock.obtenerMazos.mockReturnValue(throwError(() => new Error('Error de red')));
    componente['cargarMazos']();
    fixture.detectChanges();

    expect(componente['cargandoMazos']()).toBe(false);
    expect(componente['errorMazos']()).toBe('No pudimos cargar tus mazos. Intentá de nuevo.');
  });

  it('habilita el botón de buscar partida cuando hay mazo seleccionado y no está cargando', () => {
    expect(componente['puedeAccionar']()).toBe(true);

    const botonBuscar = Array.from(
      fixture.nativeElement.querySelectorAll('button[app-boton]'),
    ).find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Buscar Partida'),
    ) as HTMLButtonElement;

    expect(botonBuscar).toBeTruthy();
    expect(botonBuscar.disabled).toBe(false);
  });

  it('deshabilita el botón de buscar partida y muestra "Conectando..." cuando salaService está cargando', () => {
    cargandoSalaSignal.set(true);
    fixture.detectChanges();

    expect(componente['puedeAccionar']()).toBe(false);

    const botonBuscar = Array.from(
      fixture.nativeElement.querySelectorAll('button[app-boton]'),
    ).find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Conectando...'),
    ) as HTMLButtonElement;

    expect(botonBuscar).toBeTruthy();
    expect(botonBuscar.disabled).toBe(true);
  });

  it('invoca salaService.buscarPartida con el mazo seleccionado al buscar partida', async () => {
    await componente['buscarPartida']();

    expect(salaMock.buscarPartida).toHaveBeenCalledWith(2);
  });

  it('no invoca salaService.buscarPartida si no hay mazo seleccionado', async () => {
    componente['mazoSeleccionado'].set(null);
    await componente['buscarPartida']();

    expect(salaMock.buscarPartida).not.toHaveBeenCalled();
  });

  it('captura silenciosamente errores lanzados por salaService.buscarPartida', async () => {
    salaMock.buscarPartida.mockRejectedValueOnce(new Error('Fallo SignalR'));

    await expect(componente['buscarPartida']()).resolves.toBeUndefined();
  });

  it('muestra el estado de búsqueda cuando buscandoRival es true y permite cancelar', async () => {
    buscandoRivalSignal.set(true);
    fixture.detectChanges();

    expect(componente['enBusquedaOEntrando']()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Buscando oponente...');
    expect(fixture.nativeElement.textContent).toContain('Mazo Competitivo');

    const botonCancelar = Array.from(
      fixture.nativeElement.querySelectorAll('button[app-boton]'),
    ).find((b) =>
      (b as HTMLButtonElement).textContent?.includes('Cancelar búsqueda'),
    ) as HTMLButtonElement;

    expect(botonCancelar).toBeTruthy();
    botonCancelar.click();

    expect(salaMock.cancelarBusqueda).toHaveBeenCalledTimes(1);
  });

  it('muestra el mensaje de error de salaService cuando existe', () => {
    errorSalaSignal.set('No se pudo conectar al servidor de emparejamiento.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se pudo conectar al servidor de emparejamiento.',
    );
  });

  it('guarda datos, muestra los nombres reales del backend en la pantalla de carga y navega al completarse', () => {
    partidaIniciadaSignal.set({ partidaId: 99 });
    fixture.detectChanges();

    expect(localStorage.getItem('faltauna_ultimo_mazo')).toBe('2');
    expect(localStorage.getItem('faltauna_partida_activa')).toBe('99');
    expect(componente['entrandoAPartida']()).toBe(true);
    expect(partidaServicioMock.reconectar).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.querySelector('app-pantalla-carga-juego')).toBeTruthy();
    expect(router.navigate).not.toHaveBeenCalled();

    jest.advanceTimersByTime(4000);
    fixture.detectChanges();

    const textoCarga = fixture.nativeElement.textContent;
    expect(textoCarga).toContain('UsuarioReal');
    expect(textoCarga).toContain('RivalReal');
    expect(router.navigate).not.toHaveBeenCalled();

    jest.advanceTimersByTime(PAUSA_CONFIRMACION_CARGA_MS);
    expect(router.navigate).toHaveBeenCalledWith(['/juego/ia']);
  });

  it('vuelve a la selección si falla la reconexión sin navegar al tablero', () => {
    partidaServicioMock.reconectar.mockReturnValueOnce(of(false));
    partidaIniciadaSignal.set({ partidaId: 99 });
    fixture.detectChanges();

    expect(componente['mostrandoCarga']()).toBe(false);
    expect(componente['entrandoAPartida']()).toBe(false);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('desconecta salaService al destruir el componente', () => {
    fixture.destroy();
    expect(salaMock.desconectar).toHaveBeenCalledTimes(1);
  });
});
