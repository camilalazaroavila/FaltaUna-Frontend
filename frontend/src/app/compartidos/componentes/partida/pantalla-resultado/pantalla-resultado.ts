import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Confeti } from '@compartidos/componentes/confeti/confeti';
import type { ResultadoPartidaApi, ResultadoRonda } from '@modelos/partida.model';
import { GsapService } from '@servicios/gsap.service';

export type TipoResultadoVisual = 'victoria' | 'derrota' | 'empate' | 'finalizada';

/** Duración en ms de la celebración heroica destacada. Decisión tomada, a revisar: 5000ms. */
const DURACION_HEROICA_MS = 5000;

/**
 * Panel superior no bloqueante de fin de partida (Victoria, Derrota, Empate o Neutro).
 *
 * Muestra el resultado final del servidor dejando el tablero visible e interactuable.
 * Cuenta con estado compacto (título, puntos, motivo y acciones) y expandible ("Ver por qué")
 * con el desglose por ronda y por zona.
 */
@Component({
  selector: 'app-pantalla-resultado',
  standalone: true,
  imports: [Boton, Confeti],
  templateUrl: './pantalla-resultado.html',
  styleUrl: './pantalla-resultado.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantallaResultado implements AfterViewInit, OnDestroy {
  private readonly gsapServicio = inject(GsapService);

  readonly resultado = input<ResultadoPartidaApi | null>(null);
  readonly nombreJugador = input<string>('Vos');
  readonly nombreRival = input<string>('Bot');
  readonly historialRondas = input<readonly ResultadoRonda[]>([]);
  readonly ultimoResultado = input<ResultadoRonda | null>(null);
  readonly modoIncrustado = input<boolean>(false);
  readonly expandidoInicial = input<boolean>(false);

  readonly jugarOtraVez = output<void>();
  readonly volverAlMenu = output<void>();

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panelRef');
  private readonly confeti = viewChild(Confeti);

  /** Fase heroica destacada inicial de 5s para que la victoria/derrota sea evidente. */
  readonly faseHeroica = signal<boolean>(false);
  private temporizadorHeroico?: ReturnType<typeof setTimeout>;

  readonly expandido = linkedSignal({
    source: () => this.expandidoInicial(),
    computation: (inicial) => inicial,
  });

  protected terminarFaseHeroica(): void {
    if (this.temporizadorHeroico) {
      clearTimeout(this.temporizadorHeroico);
      this.temporizadorHeroico = undefined;
    }
    this.faseHeroica.set(false);
  }

  protected alternarDetalle(): void {
    this.expandido.update((v) => !v);
  }

  protected readonly tipo = computed<TipoResultadoVisual>(() => {
    const res = this.resultado();
    if (!res || !res.ganador) {
      return 'finalizada';
    }
    if (res.ganador === 'propio') {
      return 'victoria';
    }
    if (res.ganador === 'rival') {
      return 'derrota';
    }
    if (res.ganador === 'empate') {
      return 'empate';
    }
    return 'finalizada';
  });

  protected readonly badgeTexto = computed(() => {
    switch (this.tipo()) {
      case 'victoria':
        return 'Victoria';
      case 'derrota':
        return 'Derrota';
      case 'empate':
        return 'Empate';
      case 'finalizada':
      default:
        return 'Finalizada';
    }
  });

  protected readonly titulo = computed(() => {
    switch (this.tipo()) {
      case 'victoria':
        return '¡Victoria!';
      case 'derrota':
        return 'Derrota';
      case 'empate':
        return 'Empate';
      case 'finalizada':
      default:
        return 'Partida finalizada';
    }
  });

  protected readonly subtitulo = computed(() => {
    switch (this.tipo()) {
      case 'victoria':
        return '¡Ganaste la partida! Podés explorar el tablero o revisar el detalle.';
      case 'derrota':
        return 'La partida la ganó el rival. Podés revisar el tablero o el detalle.';
      case 'empate':
        return 'La partida terminó igualada. Podés revisar el tablero o el detalle.';
      case 'finalizada':
      default:
        return 'La partida concluyó según el servidor.';
    }
  });

  protected readonly motivoTexto = computed(() => {
    const motivo = this.resultado()?.motivo;
    if (!motivo) {
      return 'Partida finalizada por resolución del servidor.';
    }
    switch (motivo) {
      case 'seis-rondas':
        return 'Se completaron las 6 rondas reglamentarias.';
      case 'cien-puntos':
        return 'Se alcanzó el límite de 100 puntos.';
      case 'rendicion':
        return 'La partida terminó por rendición.';
      case 'desconexion':
        return 'La partida terminó por abandono.';
      default:
        return motivo;
    }
  });

  protected readonly puntosPropio = computed(() => this.resultado()?.puntosPropio ?? 0);
  protected readonly puntosRival = computed(() => this.resultado()?.puntosRival ?? 0);

  protected readonly rondasParaMostrar = computed<readonly ResultadoRonda[]>(() => {
    const historial = this.historialRondas();
    if (historial.length > 0) {
      return historial;
    }
    const ultimo = this.ultimoResultado();
    if (ultimo) {
      return [ultimo];
    }
    return [];
  });

  protected textoResultadoRonda(ronda: ResultadoRonda): string {
    if (ronda.ganador === 'propio') {
      return 'Ganaste esta ronda';
    }
    if (ronda.ganador === 'rival') {
      return 'Rival ganó esta ronda';
    }
    if (ronda.ganador === 'empate') {
      return 'Ronda empatada';
    }
    return `Ronda ${ronda.numero}`;
  }

  ngAfterViewInit(): void {
    if (this.modoIncrustado()) {
      return;
    }

    // Celebración heroica inicial durante 5 segundos para destacar el resultado
    if (!this.gsapServicio.movimientoReducido()) {
      this.faseHeroica.set(true);
      this.temporizadorHeroico = setTimeout(() => {
        this.terminarFaseHeroica();
      }, DURACION_HEROICA_MS);

      if (this.tipo() === 'victoria' && typeof window !== 'undefined') {
        setTimeout(() => {
          this.confeti()?.lanzar(window.innerWidth / 2, window.innerHeight * 0.4, {
            cantidad: 90,
            alcance: 360,
          });
        }, 120);
      }
    }

    const panel = this.panelRef()?.nativeElement;
    if (!panel) {
      return;
    }

    const motivo = this.resultado()?.motivo;
    const esInmediato = motivo === 'rendicion' || motivo === 'desconexion';
    const demora = esInmediato || this.gsapServicio.movimientoReducido() ? 0 : 0.65;

    if (!this.gsapServicio.movimientoReducido()) {
      this.gsapServicio.gsap.from(panel, {
        y: -24,
        opacity: 0,
        duration: 0.35,
        delay: demora,
        ease: 'power2.out',
      });
    }
  }

  ngOnDestroy(): void {
    if (this.temporizadorHeroico) {
      clearTimeout(this.temporizadorHeroico);
      this.temporizadorHeroico = undefined;
    }
  }
}
