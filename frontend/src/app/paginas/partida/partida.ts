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
import { Router, RouterLink } from '@angular/router';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Caja } from '@compartidos/componentes/contenedor/caja/caja';
import { SelectorMazos } from '@compartidos/componentes/cartas/selector-mazos/selector-mazos';
import { PantallaResultado } from '@compartidos/componentes/partida/pantalla-resultado/pantalla-resultado';
import { Tablero } from '@compartidos/componentes/partida/tablero/tablero';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { Titulo } from '@compartidos/componentes/textual/titulo/titulo';
import type { MazoApi } from '@modelos/mazo.model';
import { BarajaService } from '@servicios/baraja.service';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import { SonidoService } from '@servicios/sonido.service';
import type { VarianteCaja } from '@compartidos/componentes/contenedor/caja/caja';

/**
 * Pantalla de partida contra el bot.
 *
 * Permite seleccionar el mazo con SelectorMazos escalable (hasta 20 mazos con tarjetas,
 * búsqueda y filtro de completos), crear la partida contra el bot, jugar el tablero
 * y presentar el resultado de cada ronda.
 */
@Component({
  selector: 'app-partida',
  imports: [
    Boton,
    Caja,
    PantallaResultado,
    RouterLink,
    SelectorMazos,
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

  // Estado de mazos
  protected readonly mazos = signal<readonly MazoApi[]>([]);
  protected readonly mazoSeleccionado = signal<number | null>(null);
  protected readonly cargandoMazos = signal(true);
  protected readonly errorMazos = signal<string | null>(null);

  /** Mazos que cumplen con las 12 cartas reglamentarias */
  protected readonly mazosCompletos = computed(() =>
    this.mazos().filter((mazo) => mazo.completo || mazo.cartas?.length === 12),
  );

  /** Detalle del mazo seleccionado actualmente */
  protected readonly mazoSeleccionadoDetalle = computed(() => {
    const id = this.mazoSeleccionado();
    if (id === null) return null;
    return this.mazos().find((m) => m.id === id) ?? null;
  });

  /** Si el mazo seleccionado es reglamentario de 12 cartas */
  protected readonly mazoSeleccionadoEsReglamentario = computed(() => {
    const mazo = this.mazoSeleccionadoDetalle();
    if (!mazo) return false;
    return mazo.completo || mazo.cartas?.length === 12;
  });

  protected readonly puedeJugar = computed(
    () =>
      this.mazoSeleccionado() !== null &&
      this.mazoSeleccionadoEsReglamentario() &&
      !this.servicio.cargando(),
  );

  protected seleccionarMazo(mazoId: number): void {
    this.mazoSeleccionado.set(mazoId);
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
    this.sonido.detenerMusicaFondo();
  }

  /** Crea una partida nueva contra el bot con el mazo elegido. */
  protected jugar(): void {
    const mazoId = this.mazoSeleccionado();

    if (mazoId === null || !this.mazoSeleccionadoEsReglamentario()) {
      return;
    }

    this.servicio.iniciarContraBot(mazoId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /** Abandona la partida (la confirmación visual previa ya se resolvió en el control de turno). */
  protected abandonar(): void {
    this.servicio.abandonar();
  }

  /** Reinicia una partida nueva con el mismo mazo contra el bot. */
  protected reintentarPartida(): void {
    const mazoId = this.mazoSeleccionado() ?? this.mazosCompletos()[0]?.id ?? null;
    this.servicio.abandonarPartida();
    if (mazoId !== null) {
      this.servicio.iniciarContraBot(mazoId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    }
  }

  /** Sale de la partida finalizada y vuelve al menú de modos de juego. */
  protected volverAlMenu(): void {
    this.servicio.abandonarPartida();
    this.router.navigate(['/usuario/jugar']);
  }

  protected cargarMazos(): void {
    this.errorMazos.set(null);
    this.cargandoMazos.set(true);

    this.baraja
      .obtenerMazos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (mazos) => {
          this.mazos.set(mazos);
          const primerValido = mazos.find((mazo) => mazo.completo || mazo.cartas?.length === 12);
          this.mazoSeleccionado.set(primerValido?.id ?? mazos[0]?.id ?? null);
          this.cargandoMazos.set(false);
        },
        error: () => {
          this.errorMazos.set('No pudimos cargar tus mazos. Intentá de nuevo.');
          this.cargandoMazos.set(false);
        },
      });
  }
}
