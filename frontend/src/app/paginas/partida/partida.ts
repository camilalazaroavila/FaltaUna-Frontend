import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Caja } from '@compartidos/componentes/contenedor/caja/caja';
import { Header } from '@compartidos/componentes/layout/header/header';
import { Tablero } from '@compartidos/componentes/partida/tablero/tablero';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { Titulo } from '@compartidos/componentes/textual/titulo/titulo';
import type { MazoApi } from '@modelos/mazo.model';
import { BarajaService } from '@servicios/baraja.service';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
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
  imports: [Boton, Caja, Header, RouterLink, Tablero, Texto, Titulo],
  templateUrl: './partida.html',
  styleUrl: './partida.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Partida implements OnInit, OnDestroy {
  protected readonly servicio = inject(PartidaServicio);
  private readonly baraja = inject(BarajaService);
  private readonly destroyRef = inject(DestroyRef);

  /** Hay una partida real en curso (no la maqueta). */
  protected readonly enPartida = computed(() => this.servicio.partidaId() !== null);
  /** Evita mostrar header global mientras reconecta y aún no hay partida. */
  protected readonly mostrarHeader = computed(
    () => !this.enPartida() && !this.servicio.cargando(),
  );
  protected readonly resultado = this.servicio.resultadoRonda;
  protected readonly terminada = this.servicio.terminada;
  protected readonly gane = this.servicio.gane;

  protected readonly mazos = signal<readonly MazoApi[]>([]);
  protected readonly mazoSeleccionado = signal<number | null>(null);
  protected readonly cargandoMazos = signal(true);
  protected readonly errorMazos = signal<string | null>(null);
  protected readonly mazosCompletos = computed(() => this.mazos().filter((mazo) => mazo.completo));
  protected readonly puedeJugar = computed(
    () => this.mazoSeleccionado() !== null && !this.servicio.cargando(),
  );

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

    return resultado.gane ? '¡Ganaste la partida!' : 'La partida la ganó el bot';
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
  }

  /** Crea una partida nueva contra el bot con el mazo elegido. */
  protected jugar(): void {
    const mazoId = this.mazoSeleccionado();

    if (mazoId === null) {
      return;
    }

    this.servicio.iniciarContraBot(mazoId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /** Cierra la partida local y vuelve al menú de juego. */
  protected abandonar(): void {
    this.servicio.abandonarPartida();
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
          this.mazoSeleccionado.set(mazos.find((mazo) => mazo.completo)?.id ?? null);
          this.cargandoMazos.set(false);
        },
        error: () => {
          this.errorMazos.set('No pudimos cargar tus mazos. Recargá la página e intentá de nuevo.');
          this.cargandoMazos.set(false);
        },
      });
  }
}
