import { Injectable, inject, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '@environments/environment';
import { AuthService } from './auth.service';

export interface PartidaIniciadaEvento {
  readonly partidaId: number;
}

@Injectable({
  providedIn: 'root',
})
export class SalaJuegoService {
  private readonly auth = inject(AuthService);
  private hubConnection: signalR.HubConnection | null = null;

  readonly codigoSala = signal<string | null>(null);
  readonly buscandoRival = signal<boolean>(false);
  readonly partidaIniciada = signal<PartidaIniciadaEvento | null>(null);
  readonly cargando = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async conectar(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = this.auth.obtenerToken();
    if (!token) {
      throw new Error('No hay sesión iniciada.');
    }

    this.cargando.set(true);
    this.error.set(null);

    try {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(environment.hubUrl, {
          accessTokenFactory: () => this.auth.obtenerToken() ?? '',
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect()
        .build();

      this.hubConnection.on('BuscandoRival', () => {
        this.buscandoRival.set(true);
        this.cargando.set(false);
      });

      this.hubConnection.on('BusquedaCancelada', () => {
        this.buscandoRival.set(false);
        this.cargando.set(false);
      });

      this.hubConnection.on('SalaCreada', (codigo: string) => {
        this.codigoSala.set(codigo);
        this.cargando.set(false);
      });

      this.hubConnection.on('PartidaIniciada', (evento: PartidaIniciadaEvento) => {
        this.buscandoRival.set(false);
        this.partidaIniciada.set(evento);
        this.cargando.set(false);
      });

      this.hubConnection.on('ErrorSala', (mensaje: string) => {
        this.error.set(mensaje);
        this.buscandoRival.set(false);
        this.cargando.set(false);
      });

      await this.hubConnection.start();
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al conectar con el servidor de juego.';
      this.error.set(mensaje);
      this.cargando.set(false);
      throw err;
    }
  }

  async buscarPartida(mazoId: number): Promise<void> {
    await this.conectar();
    this.cargando.set(true);
    this.error.set(null);

    try {
      await this.hubConnection!.invoke('BuscarPartida', Number(mazoId));
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al buscar partida.';
      this.error.set(mensaje);
      this.buscandoRival.set(false);
      this.cargando.set(false);
      throw err;
    }
  }

  async cancelarBusqueda(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('CancelarBusqueda');
      } catch {
        // Ignorar si ya se cerró
      }
    }
    this.buscandoRival.set(false);
    this.cargando.set(false);
  }

  async crearSala(mazoId: number): Promise<void> {
    await this.conectar();
    this.cargando.set(true);
    this.error.set(null);

    try {
      await this.hubConnection!.invoke('CrearSala', mazoId);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear la sala.';
      this.error.set(mensaje);
      this.cargando.set(false);
      throw err;
    }
  }

  async unirseASala(codigo: string, mazoId: number): Promise<void> {
    await this.conectar();
    this.cargando.set(true);
    this.error.set(null);

    try {
      await this.hubConnection!.invoke('UnirseASala', codigo.trim().toUpperCase(), mazoId);
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al unirse a la sala.';
      this.error.set(mensaje);
      this.cargando.set(false);
      throw err;
    }
  }

  desconectar(): void {
    if (this.hubConnection) {
      if (this.buscandoRival()) {
        this.hubConnection.invoke('CancelarBusqueda').catch(() => {});
      }
      this.hubConnection.stop();
      this.hubConnection = null;
    }
    this.codigoSala.set(null);
    this.buscandoRival.set(false);
    this.partidaIniciada.set(null);
    this.cargando.set(false);
    this.error.set(null);
  }
}
