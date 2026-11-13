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

  readonly buscandoRival = signal<boolean>(false);
  readonly partidaIniciada = signal<PartidaIniciadaEvento | null>(null);
  readonly esperandoRivalRevancha = signal<boolean>(false);
  readonly revanchaSolicitada = signal<boolean>(false);
  readonly revanchaCancelada = signal<boolean>(false);
  readonly revanchaIniciada = signal<PartidaIniciadaEvento | null>(null);
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

      this.hubConnection.on('PartidaIniciada', (evento: PartidaIniciadaEvento) => {
        this.buscandoRival.set(false);
        this.partidaIniciada.set(evento);
        this.cargando.set(false);
      });

      this.hubConnection.on('EsperandoRivalRevancha', () => {
        this.esperandoRivalRevancha.set(true);
        this.revanchaSolicitada.set(false);
        this.revanchaCancelada.set(false);
        this.cargando.set(false);
      });

      this.hubConnection.on('RevanchaSolicitada', () => {
        this.revanchaSolicitada.set(true);
        this.revanchaCancelada.set(false);
        this.cargando.set(false);
      });

      this.hubConnection.on('RevanchaCancelada', () => {
        this.esperandoRivalRevancha.set(false);
        this.revanchaSolicitada.set(false);
        this.revanchaCancelada.set(true);
        this.cargando.set(false);
      });

      this.hubConnection.on('RevanchaIniciada', (evento: PartidaIniciadaEvento) => {
        this.esperandoRivalRevancha.set(false);
        this.revanchaSolicitada.set(false);
        this.revanchaCancelada.set(false);
        this.revanchaIniciada.set(evento);
        this.cargando.set(false);
      });

      this.hubConnection.on('ErrorSala', (mensaje: string) => {
        this.error.set(mensaje);
        this.buscandoRival.set(false);
        this.esperandoRivalRevancha.set(false);
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

  async unirseACanalPartida(partidaId: number): Promise<void> {
    await this.conectar();
    this.cargando.set(false);
    try {
      await this.hubConnection!.invoke('UnirseACanalPartida', Number(partidaId));
    } catch {
      // Ignorar errores de suscripción silenciosa
    }
  }

  async solicitarRevancha(partidaId: number, mazoId: number): Promise<void> {
    await this.conectar();
    this.cargando.set(true);
    this.error.set(null);

    try {
      await this.hubConnection!.invoke('SolicitarRevancha', Number(partidaId), Number(mazoId));
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error al solicitar la revancha.';
      this.error.set(mensaje);
      this.esperandoRivalRevancha.set(false);
      this.cargando.set(false);
      throw err;
    }
  }

  async cancelarRevancha(partidaId: number): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.hubConnection.invoke('CancelarRevancha', Number(partidaId));
      } catch {
        // Ignorar si ya se cerró
      }
    }
    this.esperandoRivalRevancha.set(false);
    this.revanchaSolicitada.set(false);
    this.revanchaCancelada.set(true);
    this.cargando.set(false);
  }

  limpiarEstadoRevancha(): void {
    this.esperandoRivalRevancha.set(false);
    this.revanchaSolicitada.set(false);
    this.revanchaCancelada.set(false);
    this.revanchaIniciada.set(null);
  }

  desconectar(): void {
    if (this.hubConnection) {
      if (this.buscandoRival()) {
        this.hubConnection.invoke('CancelarBusqueda').catch(() => {});
      }
      this.hubConnection.stop();
      this.hubConnection = null;
    }
    this.buscandoRival.set(false);
    this.partidaIniciada.set(null);
    this.limpiarEstadoRevancha();
    this.cargando.set(false);
    this.error.set(null);
  }
}
