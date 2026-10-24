import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import type { EstadoBotonListo } from '@compartidos/componentes/partida/boton-listo/boton-listo';

const SEGUNDOS_ADVERTENCIA = 10;

const CLASES_TIEMPO_BASE =
  'inline-flex items-center gap-1.5 rounded-pildora border-2 bg-hundido px-3 py-0.5 font-titulo text-cuerpo leading-titulo tabular-nums';

/** Cada instancia necesita su propio id para aria-labelledby. */
let instancias = 0;

/**
 * Control del turno: un solo botón que muestra el turno y lo finaliza, con el
 * tiempo restante arriba y "Rendirme" aparte (con alerta de confirmación).
 * Es presentacional: no maneja timer ni decide cuándo se resuelve el turno
 * (A confirmar, §10).
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
  readonly segundosTotales = input(40);
  readonly estado = input<EstadoBotonListo>('jugando');

  readonly finalizar = output<void>();
  readonly rendirse = output<void>();

  protected readonly idConfirmacion = `control-turno-confirmar-${++instancias}`;
  protected readonly confirmando = signal(false);

  private readonly refCancelar = viewChild('botonCancelar', { read: ElementRef });

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
   * contenedores chicos cambia el largo, no la presencia (context.md, tablero).
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

  constructor() {
    // Al abrir la alerta, el foco va a "Cancelar" (la opción segura).
    effect(() => {
      this.refCancelar()?.nativeElement.focus();
    });
  }

  protected pulsarFinalizar(): void {
    if (this.activo()) {
      this.finalizar.emit();
    }
  }

  protected pedirConfirmacion(): void {
    this.confirmando.set(true);
  }

  protected cancelar(): void {
    this.confirmando.set(false);
  }

  protected confirmar(): void {
    this.confirmando.set(false);
    this.rendirse.emit();
  }
}