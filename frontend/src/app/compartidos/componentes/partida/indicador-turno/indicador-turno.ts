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

const SEGUNDOS_ADVERTENCIA = 10;

const CLASES_TIEMPO_BASE =
  'inline-flex items-center gap-1.5 rounded-pildora border-2 bg-hundido px-3 py-0.5 font-titulo text-cuerpo leading-titulo tabular-nums';

/** Contador de módulo: cada instancia necesita su propio id para aria-labelledby. */
let instancias = 0;

/**
 * Cabecera de la partida: turno actual, tiempo restante con barra fina y
 * "Rendirme" como acción discreta con confirmación en 2 pasos (abandonar es
 * derrota, sección 10). Es presentacional: no maneja su propio timer, recibe
 * `segundosRestantes`. Sin `aria-live` en el tiempo: cambia cada segundo y
 * saturaría al lector de pantalla.
 */
@Component({
  selector: 'app-indicador-turno',
  templateUrl: './indicador-turno.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, Boton],
  host: { class: 'block' },
})
export class IndicadorTurno {
  readonly turno = input.required<number>();
  readonly totalTurnos = input(6);
  readonly segundosRestantes = input.required<number>();
  /** Duración total del turno, para dibujar la barra de tiempo. */
  readonly segundosTotales = input(60);

  readonly rendirse = output<void>();

  protected readonly idConfirmacion = `indicador-turno-confirmar-${++instancias}`;
  protected readonly confirmando = signal(false);
  readonly resolviendo = input(false);
  private readonly botonCancelar = viewChild('botonCancelar', { read: ElementRef });

  protected readonly enAdvertencia = computed(
    () => this.segundosRestantes() <= SEGUNDOS_ADVERTENCIA,
  );
  protected readonly proporcion = computed(() => {
    const total = this.segundosTotales();
    return total > 0 ? Math.min(1, Math.max(0, this.segundosRestantes() / total)) : 0;
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
  protected readonly etiqueta = computed(
    () =>
      `Turno ${this.turno()} de ${this.totalTurnos()}, quedan ${this.segundosRestantes()} segundos`,
  );

  constructor() {
    // Al abrir la confirmación, el foco va a "Cancelar" (la opción segura).
    effect(() => {
      this.botonCancelar()?.nativeElement.focus();
    });
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