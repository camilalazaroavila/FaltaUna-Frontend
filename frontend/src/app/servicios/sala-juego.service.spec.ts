import { TestBed } from '@angular/core/testing';
import * as signalR from '@microsoft/signalr';
import { AuthService } from './auth.service';
import { SalaJuegoService } from './sala-juego.service';

describe('SalaJuegoService', () => {
  let servicio: SalaJuegoService;
  let authMock: { obtenerToken: jest.Mock };
  let handlers: Record<string, (...args: any[]) => void>;
  let mockConnection: {
    state: signalR.HubConnectionState;
    on: jest.Mock;
    start: jest.Mock;
    stop: jest.Mock;
    invoke: jest.Mock;
  };

  beforeEach(() => {
    handlers = {};
    mockConnection = {
      state: signalR.HubConnectionState.Disconnected,
      on: jest.fn((evento: string, callback: (...args: any[]) => void) => {
        handlers[evento] = callback;
      }),
      start: jest.fn().mockImplementation(async () => {
        mockConnection.state = signalR.HubConnectionState.Connected;
      }),
      stop: jest.fn().mockImplementation(async () => {
        mockConnection.state = signalR.HubConnectionState.Disconnected;
      }),
      invoke: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(signalR.HubConnectionBuilder.prototype, 'withUrl').mockReturnThis();
    jest.spyOn(signalR.HubConnectionBuilder.prototype, 'withAutomaticReconnect').mockReturnThis();
    jest
      .spyOn(signalR.HubConnectionBuilder.prototype, 'build')
      .mockReturnValue(mockConnection as unknown as signalR.HubConnection);

    authMock = {
      obtenerToken: jest.fn().mockReturnValue('token-jwt-valido'),
    };

    TestBed.configureTestingModule({
      providers: [SalaJuegoService, { provide: AuthService, useValue: authMock }],
    });

    servicio = TestBed.inject(SalaJuegoService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lanza error al conectar si no hay sesión iniciada', async () => {
    authMock.obtenerToken.mockReturnValue(null);

    await expect(servicio.conectar()).rejects.toThrow('No hay sesión iniciada.');
  });

  it('conecta al hub y registra los manejadores de eventos', async () => {
    await servicio.conectar();

    expect(mockConnection.start).toHaveBeenCalledTimes(1);
    expect(Object.keys(handlers)).toEqual(
      expect.arrayContaining([
        'BuscandoRival',
        'BusquedaCancelada',
        'PartidaIniciada',
        'EsperandoRivalRevancha',
        'RevanchaSolicitada',
        'RevanchaCancelada',
        'RevanchaIniciada',
        'ErrorSala',
      ]),
    );
  });

  it('no vuelve a iniciar la conexión si ya está conectado', async () => {
    await servicio.conectar();
    await servicio.conectar();

    expect(mockConnection.start).toHaveBeenCalledTimes(1);
  });

  it('actualiza los signals al recibir eventos del Hub (BuscandoRival, PartidaIniciada, ErrorSala)', async () => {
    await servicio.conectar();

    handlers['BuscandoRival']();
    expect(servicio.buscandoRival()).toBe(true);
    expect(servicio.cargando()).toBe(false);

    handlers['BusquedaCancelada']();
    expect(servicio.buscandoRival()).toBe(false);

    handlers['PartidaIniciada']({ partidaId: 42 });
    expect(servicio.buscandoRival()).toBe(false);
    expect(servicio.partidaIniciada()).toEqual({ partidaId: 42 });
    expect(servicio.cargando()).toBe(false);

    handlers['ErrorSala']('Mazo inválido');
    expect(servicio.error()).toBe('Mazo inválido');
    expect(servicio.buscandoRival()).toBe(false);
  });

  it('invoca BuscarPartida en el hub con el id del mazo', async () => {
    await servicio.buscarPartida(5);

    expect(mockConnection.start).toHaveBeenCalledTimes(1);
    expect(mockConnection.invoke).toHaveBeenCalledWith('BuscarPartida', 5);
  });

  it('maneja errores cuando BuscarPartida falla en el hub', async () => {
    mockConnection.invoke.mockRejectedValueOnce(new Error('Error en servidor'));

    await expect(servicio.buscarPartida(5)).rejects.toThrow('Error en servidor');
    expect(servicio.error()).toBe('Error en servidor');
    expect(servicio.buscandoRival()).toBe(false);
    expect(servicio.cargando()).toBe(false);
  });

  it('invoca CancelarBusqueda cuando está conectado y limpia el estado', async () => {
    await servicio.conectar();
    servicio.buscandoRival.set(true);

    await servicio.cancelarBusqueda();

    expect(mockConnection.invoke).toHaveBeenCalledWith('CancelarBusqueda');
    expect(servicio.buscandoRival()).toBe(false);
    expect(servicio.cargando()).toBe(false);
  });

  it('gestiona el flujo de revancha (solicitar, eventos y cancelar)', async () => {
    await servicio.solicitarRevancha(15, 2);
    expect(mockConnection.invoke).toHaveBeenCalledWith('SolicitarRevancha', 15, 2);

    handlers['EsperandoRivalRevancha']();
    expect(servicio.esperandoRivalRevancha()).toBe(true);

    handlers['RevanchaSolicitada']();
    expect(servicio.revanchaSolicitada()).toBe(true);

    handlers['RevanchaIniciada']({ partidaId: 16 });
    expect(servicio.revanchaIniciada()).toEqual({ partidaId: 16 });
    expect(servicio.esperandoRivalRevancha()).toBe(false);

    await servicio.cancelarRevancha(16);
    expect(mockConnection.invoke).toHaveBeenCalledWith('CancelarRevancha', 16);
    expect(servicio.revanchaCancelada()).toBe(true);
  });

  it('cancela búsqueda activa, detiene la conexión y reinicia signals al desconectar', async () => {
    await servicio.conectar();
    servicio.buscandoRival.set(true);
    servicio.partidaIniciada.set({ partidaId: 10 });

    servicio.desconectar();

    expect(mockConnection.invoke).toHaveBeenCalledWith('CancelarBusqueda');
    expect(mockConnection.stop).toHaveBeenCalledTimes(1);
    expect(servicio.buscandoRival()).toBe(false);
    expect(servicio.partidaIniciada()).toBeNull();
    expect(servicio.error()).toBeNull();
  });
});
