import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Boton } from '@compartidos/componentes/controles/boton/boton';

const SEGUNDOS_ADVERTENCIA = 10;

const CLASES_CONTENEDOR =
  'flex items-center justify-between gap-3 rounded-md border-2 px-3 py-2 transition-colors duration-200 motion-reduce:transition-none';

const CLASES_TIEMPO =
  'flex items-center gap-1.5 font-titulo text-subtitulo leading-titulo';

/**
 * Cabecera de la partida: cuenta el turno actual y el tiempo restante, y ofrece
 * el botón de rendirse. Es presentacional: no maneja su propio timer, recibe
 * `segundosRestantes` ya calculado. Se evita `aria-live` porque el valor cambia
 * cada segundo y saturaría al lector de pantalla; se expone `role="timer"` con
 * una etiqueta que resume turno y tiempo.
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

  readonly rendirse = output<void>();

  protected readonly segundosAdvertencia = SEGUNDOS_ADVERTENCIA;
  protected readonly enAdvertencia = computed(
    () => this.segundosRestantes() <= SEGUNDOS_ADVERTENCIA,
  );
  protected readonly clasesContenedor = computed(() =>
    [
      CLASES_CONTENEDOR,
      this.enAdvertencia()
        ? 'border-advertencia-borde bg-advertencia-fondo text-advertencia-texto'
        : 'border-zona-marco bg-superficie text-texto-primario',
    ].join(' '),
  );
  protected readonly clasesTiempo = computed(() =>
    [CLASES_TIEMPO, this.enAdvertencia() ? 'text-advertencia-texto' : 'text-texto-primario'].join(
      ' ',
    ),
  );
  protected readonly etiqueta = computed(
    () =>
      `Turno ${this.turno()} de ${this.totalTurnos()}, quedan ${this.segundosRestantes()} segundos`,
  );
}
