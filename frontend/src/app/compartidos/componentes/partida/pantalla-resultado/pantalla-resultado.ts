import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import type { ResultadoPartidaApi } from '@modelos/partida.model';

export type TipoResultadoVisual = 'victoria' | 'derrota' | 'empate' | 'finalizada';

/**
 * Pantalla modal de fin de partida (Victoria, Derrota, Empate o Neutro).
 *
 * Muestra el resultado final único devuelto por el servidor, los puntos
 * finales de cada jugador, el motivo y las opciones para jugar otra vez o
 * volver al menú.
 */
@Component({
  selector: 'app-pantalla-resultado',
  standalone: true,
  imports: [Boton],
  templateUrl: './pantalla-resultado.html',
  styleUrl: './pantalla-resultado.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantallaResultado implements AfterViewInit {
  readonly resultado = input<ResultadoPartidaApi | null>(null);
  readonly nombreJugador = input<string>('Vos');
  readonly nombreRival = input<string>('Bot');

  readonly jugarOtraVez = output<void>();
  readonly volverAlMenu = output<void>();

  private readonly botonReintentarRef = viewChild<ElementRef<HTMLButtonElement>>('botonReintentar');

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
        return '¡Ganaste la partida!';
      case 'derrota':
        return 'La partida la ganó el rival.';
      case 'empate':
        return 'La partida terminó igualada.';
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

  ngAfterViewInit(): void {
    // Foco inicial en la acción principal
    this.botonReintentarRef()?.nativeElement?.focus();
  }
}
