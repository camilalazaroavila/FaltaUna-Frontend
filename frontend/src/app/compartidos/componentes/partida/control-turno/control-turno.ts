import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorWarningFill,
  phosphorHourglassMediumFill,
} from '@ng-icons/phosphor-icons/fill';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import type { EstadoBotonListo } from '@compartidos/componentes/partida/boton-listo/boton-listo';

const SEGUNDOS_ADVERTENCIA = 10;

const CLASES_TIEMPO_BASE =
  'inline-flex items-center justify-center gap-2 rounded-pildora border-2 bg-hundido px-3.5 py-1 font-titulo text-subtitulo leading-titulo tabular-nums shadow-cartoon';

/**
 * Control del turno: botón principal "Finalizar turno" y acciones secundarias
 * "Abandonar" y "Rendirse" con modal temático del sistema de diseño de Falta Una.
 */
@Component({
  selector: 'app-control-turno',
  templateUrl: './control-turno.html',
  styleUrl: './control-turno.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, Boton],
  viewProviders: [provideIcons({ phosphorWarningFill, phosphorHourglassMediumFill })],
  host: { class: 'block' },
})
export class ControlTurno {
  readonly turno = input.required<number>();
  readonly totalTurnos = input(6);
  readonly segundosRestantes = input.required<number>();
  readonly segundosTotales = input<number | undefined>(undefined);
  readonly estado = input<EstadoBotonListo>('jugando');
  readonly terminada = input(false);

  readonly finalizar = output<void>();
  readonly abandonar = output<void>();
  readonly rendirse = output<void>();

  private procesandoAccion = false;

  protected readonly activo = computed(() => !this.terminada() && this.estado() === 'jugando');
  protected readonly resolviendo = computed(() => !this.terminada() && this.estado() === 'resolviendo');
  protected readonly enAdvertencia = computed(
    () => !this.terminada() && this.segundosRestantes() <= SEGUNDOS_ADVERTENCIA,
  );
  protected readonly proporcion = computed(() => {
    const total = this.segundosTotales();

    return total && total > 0 ? Math.min(1, Math.max(0, this.segundosRestantes() / total)) : 0;
  });
  protected readonly contadorTurno = computed(
    () => `${this.turno()}/${this.totalTurnos()}`,
  );

  protected readonly accionBoton = computed(() => {
    if (this.terminada()) {
      return 'Fin de la partida';
    }
    if (this.estado() === 'jugando') {
      return this.turno() >= this.totalTurnos() ? 'Ronda final' : 'Realizar';
    }
    if (this.estado() === 'esperando') {
      return 'Esperando';
    }
    return 'Realizando';
  });

  protected readonly accionBotonCorto = computed(() => {
    if (this.terminada()) {
      return 'Fin de partida';
    }
    if (this.estado() === 'jugando') {
      return this.turno() >= this.totalTurnos() ? 'Final' : 'Realizar';
    }
    if (this.estado() === 'esperando') {
      return 'Esperando';
    }
    return 'Realizando';
  });

  protected readonly nombreAccesible = computed(() => {
    if (this.terminada()) {
      return 'Fin de la partida';
    }
    const turno = this.turno();
    const total = this.totalTurnos();

    if (this.estado() === 'jugando') {
      if (turno >= total) {
        return `Ronda final, turno ${turno} de ${total}`;
      }
      return `Realizar turno ${turno} de ${total}`;
    }
    if (this.estado() === 'esperando') {
      return `Esperando turno ${turno} de ${total}`;
    }
    return `Realizando turno ${turno} de ${total}`;
  });

  protected readonly textoBoton = computed(() => {
    if (this.terminada()) {
      return 'Fin de la partida';
    }
    return `${this.accionBoton()} ${this.contadorTurno()}`;
  });

  /**
   * Versión corta para columnas angostas: el texto SIEMPRE queda visible y
   * el contador de turno n/6 nunca desaparece.
   */
  protected readonly textoBotonCorto = computed(() => {
    if (this.terminada()) {
      return 'Fin de partida';
    }
    return `${this.accionBotonCorto()} ${this.contadorTurno()}`;
  });
  protected readonly clasesTiempo = computed(() =>
    [
      CLASES_TIEMPO_BASE,
      this.enAdvertencia()
        ? 'border-advertencia-borde text-advertencia-texto'
        : 'border-zona-marco text-texto-primario',
    ].join(' '),
  );
  protected readonly clasesBarra = computed(() =>
    this.enAdvertencia() ? 'bg-advertencia' : 'bg-marca-primaria',
  );
  protected readonly etiquetaTiempo = computed(
    () => `Ronda ${this.turno()} de ${this.totalTurnos()}, quedan ${this.segundosRestantes()} segundos`,
  );

  protected pulsarFinalizar(): void {
    if (this.activo()) {
      this.finalizar.emit();
    }
  }

  protected readonly modalRendirseVisible = signal(false);
  protected readonly modalAbandonarVisible = signal(false);

  pedirConfirmacionAbandonar(): void {
    if (this.procesandoAccion) return;
    this.modalAbandonarVisible.set(true);
  }

  cancelarAbandonar(): void {
    this.modalAbandonarVisible.set(false);
  }

  confirmarAbandonar(): void {
    this.modalAbandonarVisible.set(false);
    this.procesandoAccion = true;
    this.abandonar.emit();
    setTimeout(() => {
      this.procesandoAccion = false;
    }, 1000);
  }

  pedirConfirmacionRendirse(): void {
    if (this.procesandoAccion) return;
    this.modalRendirseVisible.set(true);
  }

  cancelarRendirse(): void {
    this.modalRendirseVisible.set(false);
  }

  confirmarRendirse(): void {
    this.modalRendirseVisible.set(false);
    this.procesandoAccion = true;
    this.rendirse.emit();
    setTimeout(() => {
      this.procesandoAccion = false;
    }, 1000);
  }
}
