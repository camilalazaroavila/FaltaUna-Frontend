import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

export const URL_JAIME_REPOSO =
  '/imagenes/gatito/Gato%20astuto%20con%20cartas%20%20para%20jugar.png';
export const URL_JAIME_HOVER =
  '/imagenes/gatito/Gato%20tramposo%20invita%20a%20jugar.png';

/**
 * Botón ilustrado de Jaime para acceder a jugar.
 *
 * En reposo muestra a Jaime con las cartas coleccionables, y en hover, foco
 * por teclado o toque presionado cambia a la variante "¿jugamos?".
 *
 * Conserva semántica nativa de `<button>`, soporte de deshabilitado, anillo de foco,
 * compatibilidad con movimiento reducido y respaldo visual si falla la carga.
 */
@Component({
  selector: 'app-boton-jugar',
  imports: [NgIcon],
  templateUrl: './boton-jugar.html',
  styleUrl: './boton-jugar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex',
  },
})
export class BotonJugar {
  readonly texto = input('JUGAR');
  readonly subtexto = input<string>();
  readonly textoGlobo = input<string>('¡Jugá!');
  readonly deshabilitado = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>('Jugar una partida');

  readonly accion = output<void>();

  protected readonly urlReposo = URL_JAIME_REPOSO;
  protected readonly urlHover = URL_JAIME_HOVER;
  protected readonly jaimeImagenError = signal(false);

  protected readonly haySubtexto = computed(() => !!this.subtexto()?.trim());

  constructor() {
    // Precargar el PNG de hover para evitar parpadeos en interacción
    if (typeof window !== 'undefined') {
      const precarga = new Image();
      precarga.src = URL_JAIME_HOVER;
    }
  }

  alHacerClic(): void {
    if (!this.deshabilitado()) {
      this.accion.emit();
    }
  }

  alFallarCarga(): void {
    this.jaimeImagenError.set(true);
  }
}
