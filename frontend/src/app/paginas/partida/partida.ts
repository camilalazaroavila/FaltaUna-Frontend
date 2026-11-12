import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import type { OpcionSelect } from '@compartidos/componentes/controles/campo-select/campo-select';
import { Caja } from '@compartidos/componentes/contenedor/caja/caja';
import { PantallaResultado } from '@compartidos/componentes/partida/pantalla-resultado/pantalla-resultado';
import { Tablero } from '@compartidos/componentes/partida/tablero/tablero';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { Titulo } from '@compartidos/componentes/textual/titulo/titulo';
import type { MazoApi } from '@modelos/mazo.model';
import { BarajaService } from '@servicios/baraja.service';
import { SalaJuegoService } from '@servicios/sala-juego.service';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import { SonidoService } from '@servicios/sonido.service';
import type { VarianteCaja } from '@compartidos/componentes/contenedor/caja/caja';

/**
 * Pantalla de partida contra el bot.
 *
 * Es el único consumidor del flujo real: elige un mazo, crea la partida, deja
 * jugar el tablero y presenta el resultado de cada ronda. Toda la lógica de
 * partida vive en `PartidaServicio`; la página solo dispara acciones y
 * presenta estados.
 */
@Component({
  selector: 'app-partida',
  imports: [
    Boton,
    Caja,
    FormsModule,
    PantallaResultado,
    RouterLink,
    Tablero,
    Texto,
    Titulo,
  ],
  templateUrl: './partida.html',
  styleUrl: './partida.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Partida implements OnInit, OnDestroy {
  protected readonly servicio = inject(PartidaServicio);
  protected readonly salaService = inject(SalaJuegoService);
  private readonly baraja = inject(BarajaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly sonido = inject(SonidoService);

  constructor() {
    effect(() => {
      const enJuego = this.enPartida();
      const conResultado = this.mostrarPantallaResultado();

      if (enJuego && !conResultado) {
        this.sonido.iniciarMusicaFondo(0.18);
      } else if (conResultado) {
        this.sonido.ajustarVolumenMusicaFondo(0.04);
      } else {
        this.sonido.detenerMusicaFondo();
      }
    });

    // Cuando termina una partida PvP, nos suscribimos al canal de revancha de esa partida
    effect(() => {
      const partidaId = this.servicio.partidaId();
      const conResultado = this.mostrarPantallaResultado();
      const esBot = this.servicio.rivalEsBot();

      if (partidaId !== null && conResultado && !esBot) {
        void this.salaService.unirseACanalPartida(partidaId);
      }
    });

    // Cuando ambos jugadores aceptan la revancha y llega el nuevo partidaId, cargamos la nueva partida
    effect(() => {
      const evento = this.salaService.revanchaIniciada();
      if (evento) {
        this.salaService.limpiarEstadoRevancha();
        this.rondaConteoCompletada.set(0);
        this.enConteoRonda.set(false);
        this.servicio.abandonarPartida();
        localStorage.setItem('faltauna_partida_activa', String(evento.partidaId));
        this.servicio.reconectar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      }
    });
  }

  /** Hay una partida real en curso (no la maqueta). */
  protected readonly enPartida = computed(() => this.servicio.partidaId() !== null);
  /** Evita mostrar header global mientras reconecta y aún no hay partida. */
  protected readonly mostrarHeader = computed(
    () => !this.enPartida() && !this.servicio.cargando(),
  );
  protected readonly resultado = this.servicio.resultadoRonda;
  protected readonly resultadoFinal = this.servicio.resultadoFinal;
  protected readonly terminada = this.servicio.terminada;
  protected readonly gane = this.servicio.gane;
  /** Estado del conteo secuencial de puntos de ronda. */
  protected readonly enConteoRonda = signal<boolean>(false);
  /** Última ronda cuyo conteo de puntos finalizó por completo. */
  protected readonly rondaConteoCompletada = signal<number>(0);
  /** La pantalla de resultado solo aparece una vez concluido el conteo de la ronda y con resultado final. */
  protected readonly mostrarPantallaResultado = computed(() => {
    if (!this.terminada() && this.resultadoFinal() === null) {
      return false;
    }

    if (this.enConteoRonda()) {
      return false;
    }

    const ultimaRonda = this.servicio.resultadoRonda();
    if (ultimaRonda && ultimaRonda.numero > this.rondaConteoCompletada()) {
      return false;
    }

    return true;
  });

  protected readonly mazos = signal<readonly MazoApi[]>([]);
  protected readonly mazoSeleccionado = signal<number | null>(null);
  protected readonly cargandoMazos = signal(true);
  protected readonly errorMazos = signal<string | null>(null);
  protected readonly mazosCompletos = computed(() =>
    this.mazos().filter((mazo) => mazo.completo || mazo.cartas?.length === 12),
  );
  protected readonly opcionesMazos = computed<OpcionSelect[]>(() =>
    this.mazosCompletos().map((mazo) => ({
      valor: String(mazo.id),
      etiqueta: mazo.nombre,
    })),
  );
  protected readonly mazoSeleccionadoStr = computed(() => {
    const id = this.mazoSeleccionado();
    return id !== null ? String(id) : '';
  });
  protected readonly puedeJugar = computed(
    () => this.mazoSeleccionado() !== null && !this.servicio.cargando(),
  );

  protected seleccionarMazoStr(valor: string): void {
    const mazoId = Number(valor);
    this.mazoSeleccionado.set(Number.isInteger(mazoId) && mazoId > 0 ? mazoId : null);
  }

  /** Variante del aviso de resultado según cómo terminó la ronda. */
  protected readonly varianteResultado = computed<VarianteCaja>(() => {
    const resultado = this.resultado();

    if (!resultado) {
      return 'info';
    }

    if (!resultado.terminada) {
      return 'info';
    }

    if (resultado.gane === null) {
      return 'advertencia';
    }

    return resultado.gane ? 'exito' : 'error';
  });

  /** Título del aviso de resultado. */
  protected readonly tituloResultado = computed(() => {
    const resultado = this.resultado();

    if (!resultado) {
      return '';
    }

    if (!resultado.terminada) {
      return `Ronda ${resultado.numero} resuelta`;
    }

    if (resultado.gane === null) {
      return 'La partida terminó empatada';
    }

    if (resultado.gane) {
      return '¡Ganaste la partida!';
    }

    const rival = this.servicio.jugadores().rival;
    return rival.esBot ? 'La partida la ganó el bot' : `La partida la ganó ${rival.nombre}`;
  });

  /** Motivo del fin de partida, con un texto legible para el jugador. */
  protected readonly textoMotivo = computed(() => {
    const motivo = this.resultado()?.motivo;

    if (!motivo) {
      return '';
    }

    switch (motivo) {
      case 'cien-puntos':
        return 'La partida terminó al alcanzar los 100 puntos.';
      case 'seis-rondas':
        return 'La partida terminó al completar las 6 rondas.';
      case 'rendicion':
        return 'La partida terminó por rendición.';
      case 'desconexion':
        return 'La partida terminó por abandono.';
      default:
        return motivo;
    }
  });

  ngOnInit(): void {
    this.cargarMazos();
    // Si quedó una partida guardada, se retoma; si no, se ofrece empezar una.
    this.servicio.reconectar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  ngOnDestroy(): void {
    this.servicio.detenerSincronizacion();
    this.sonido.detenerMusicaFondo();
    this.salaService.limpiarEstadoRevancha();
  }

  /** Crea una partida nueva contra el bot con el mazo elegido. */
  protected jugar(): void {
    const mazoId = this.mazoSeleccionado();

    if (mazoId === null) {
      return;
    }

    this.servicio.iniciarContraBot(mazoId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /** Abandona la partida (la confirmación visual previa ya se resolvió en el control de turno). */
  protected abandonar(): void {
    const eraContraJugador = !this.servicio.rivalEsBot();
    this.servicio.abandonar();

    if (eraContraJugador) {
      this.router.navigate(['/juego/jugador']);
    }
  }

  /** Reinicia una partida contra el bot o solicita/acepta revancha si es PvP. */
  protected reintentarPartida(): void {
    const ultimoMazoGuardado = Number(localStorage.getItem('faltauna_ultimo_mazo'));
    const mazoGuardadoValido = this.mazosCompletos().find((m) => m.id === ultimoMazoGuardado)?.id ?? null;
    const mazoId =
      mazoGuardadoValido ??
      this.mazoSeleccionado() ??
      this.mazosCompletos()[0]?.id ??
      null;

    if (!this.servicio.rivalEsBot()) {
      const partidaId = this.servicio.partidaId();
      if (partidaId !== null && mazoId !== null) {
        void this.salaService.solicitarRevancha(partidaId, mazoId);
      }
      return;
    }

    this.servicio.abandonarPartida();
    if (mazoId !== null) {
      this.servicio.iniciarContraBot(mazoId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  /** Cancela o rechaza la solicitud de revancha en curso. */
  protected cancelarRevancha(): void {
    const partidaId = this.servicio.partidaId();
    if (partidaId !== null) {
      void this.salaService.cancelarRevancha(partidaId);
    }
  }

  /** Sale de la partida finalizada y vuelve al menú de modos de juego. */
  protected volverAlMenu(): void {
    const partidaId = this.servicio.partidaId();
    if (partidaId !== null && !this.servicio.rivalEsBot()) {
      void this.salaService.cancelarRevancha(partidaId);
    }
    this.salaService.limpiarEstadoRevancha();
    this.servicio.abandonarPartida();
    this.router.navigate(['/usuario/jugar']);
  }

  protected seleccionarMazo(evento: Event): void {
    const mazoId = Number((evento.target as HTMLSelectElement).value);

    this.mazoSeleccionado.set(Number.isInteger(mazoId) && mazoId > 0 ? mazoId : null);
  }

  private cargarMazos(): void {
    this.errorMazos.set(null);

    this.baraja
      .obtenerMazos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (mazos) => {
          this.mazos.set(mazos);
          const valido = mazos.find((mazo) => mazo.completo || mazo.cartas?.length === 12) ?? mazos[0];
          this.mazoSeleccionado.set(valido?.id ?? null);
          this.cargandoMazos.set(false);
        },
        error: () => {
          this.errorMazos.set('No pudimos cargar tus mazos. Recargá la página e intentá de nuevo.');
          this.cargandoMazos.set(false);
        },
      });
  }
}
