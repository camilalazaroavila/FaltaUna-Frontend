import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import Swal from 'sweetalert2';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import type { EstadoBotonListo } from '@compartidos/componentes/partida/boton-listo/boton-listo';

const SEGUNDOS_ADVERTENCIA = 10;

const CLASES_TIEMPO_BASE =
  'inline-flex items-center gap-1.5 rounded-pildora border-2 bg-hundido px-3 py-0.5 font-titulo text-cuerpo leading-titulo tabular-nums';

/**
 * Control del turno: botón principal "Finalizar turno" y acciones secundarias
 * "Abandonar" y "Rendirme" con cuadro de confirmación SweetAlert.
 */
@Component({
  selector: 'app-control-turno',
  templateUrl: './control-turno.html',
  styleUrl: './control-turno.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, Boton],
  host: { class: 'block' },
})
export class ControlTurno {
  readonly turno = input.required<number>();
  readonly totalTurnos = input(6);
  readonly segundosRestantes = input.required<number>();
  readonly segundosTotales = input(60);
  readonly estado = input<EstadoBotonListo>('jugando');

  readonly finalizar = output<void>();
  readonly abandonar = output<void>();
  readonly rendirse = output<void>();

  private procesandoAccion = false;

  protected readonly activo = computed(() => this.estado() === 'jugando');
  protected readonly resolviendo = computed(() => this.estado() === 'resolviendo');
  protected readonly enAdvertencia = computed(
    () => this.segundosRestantes() <= SEGUNDOS_ADVERTENCIA,
  );
  protected readonly proporcion = computed(() => {
    const total = this.segundosTotales();

    return total > 0 ? Math.min(1, Math.max(0, this.segundosRestantes() / total)) : 0;
  });
  protected readonly textoBoton = computed(() => {
    const turno = this.turno();
    const total = this.totalTurnos();

    if (this.estado() === 'jugando') {
      if (turno >= total) {
        return `Ronda final (${turno} de ${total})`;
      }
      return `Finalizar ${turno} de ${total}`;
    }
    if (this.estado() === 'esperando') {
      return `Esperando… ${turno} de ${total}`;
    }
    return `Realizando turno ${turno} de ${total}`;
  });
  /**
   * Versión corta para columnas angostas: el texto SIEMPRE queda visible, en
   * contenedores chicos cambia el largo, no la presencia.
   */
  protected readonly textoBotonCorto = computed(() => {
    switch (this.estado()) {
      case 'jugando':
        return 'Finalizar';
      case 'esperando':
        return 'Esperando…';
      default:
        return 'Realizando';
    }
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

  async pedirConfirmacionAbandonar(): Promise<void> {
    if (this.procesandoAccion) return;

    const resultado = await Swal.fire({
      title: '¿Abandonar la partida?',
      text: 'Si abandonás, la partida se dará por terminada por desconexión y se registrará tu salida.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, abandonar',
      cancelButtonText: 'No, volver',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      background: '#1a1f2c',
      color: '#f3f4f6',
      customClass: {
        popup: 'rounded-2xl border border-borde-default shadow-cartoon',
        confirmButton: 'font-titulo font-bold tracking-wide uppercase',
        cancelButton: 'font-interfaz font-bold',
      },
    });

    if (resultado.isConfirmed) {
      this.procesandoAccion = true;
      this.abandonar.emit();
      setTimeout(() => {
        this.procesandoAccion = false;
      }, 1000);
    }
  }

  async pedirConfirmacionRendirse(): Promise<void> {
    if (this.procesandoAccion) return;

    const resultado = await Swal.fire({
      title: '¿Rendirte?',
      text: 'Si te rendís, se le otorgará la victoria a tu rival y la partida finalizará como derrota.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, rendirme',
      cancelButtonText: 'No, volver',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#4b5563',
      background: '#1a1f2c',
      color: '#f3f4f6',
      customClass: {
        popup: 'rounded-2xl border border-borde-default shadow-cartoon',
        confirmButton: 'font-titulo font-bold tracking-wide uppercase',
        cancelButton: 'font-interfaz font-bold',
      },
    });

    if (resultado.isConfirmed) {
      this.procesandoAccion = true;
      this.rendirse.emit();
      setTimeout(() => {
        this.procesandoAccion = false;
      }, 1000);
    }
  }
}