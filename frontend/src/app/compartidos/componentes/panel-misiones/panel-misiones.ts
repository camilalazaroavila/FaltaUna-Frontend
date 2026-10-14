import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/** Las dos secciones que alterna el panel lateral. */
export type SeccionMisiones = 'misiones' | 'pity';

interface BotonSeccion {
  readonly id: SeccionMisiones;
  readonly etiqueta: string;
  readonly icono: string;
}

/**
 * Navegación lateral de la vista de Misiones: dos botones circulares de icono
 * (Misiones y PT System) y un botón dedicado para colapsar/expandir las
 * etiquetas. En escritorio es una pastilla vertical; en móvil, una fila
 * horizontal.
 *
 * Los botones son propios (no `app-boton`) porque el estado activo se marca con
 * el acento crema en lugar de la paleta de variantes de `app-boton`, y el verde
 * saturado queda reservado para el relleno de las barras y las acciones
 * principales.
 */
@Component({
  selector: 'app-panel-misiones',
  imports: [NgIcon],
  templateUrl: './panel-misiones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class PanelMisiones {
  readonly seccionActiva = input.required<SeccionMisiones>();

  readonly cambiar = output<SeccionMisiones>();

  protected readonly colapsado = signal(false);

  protected readonly secciones: readonly BotonSeccion[] = [
    { id: 'misiones', etiqueta: 'Misiones', icono: 'phosphorTrophyFill' },
    { id: 'pity', etiqueta: 'PT System', icono: 'phosphorSealCheckFill' },
  ];

  protected esActiva(id: SeccionMisiones): boolean {
    return this.seccionActiva() === id;
  }

  /**
   * El estado activo usa el acento crema (no el verde saturado, reservado para
   * el relleno de las barras y las acciones principales). La sección se
   * identifica por su ícono y su etiqueta, no por el color de fondo.
   */
  protected clasesSeccion(id: SeccionMisiones): string {
    const base = [
      'inline-flex size-misiones-panel-boton cursor-pointer items-center justify-center rounded-circulo border-2',
      'transition-[background-color,border-color,color,box-shadow,transform] duration-200',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco',
      'motion-reduce:transition-none hover:scale-110 active:scale-100',
    ];

    return [
      ...base,
      this.esActiva(id)
        ? 'scale-105 border-marca-acento bg-marca-acento text-marca-sobre-acento shadow-marca'
        : 'border-borde-coleccion bg-transparent text-texto-secundario hover:border-marca-acento hover:text-marca-acento',
    ].join(' ');
  }

  protected alternarColapso(): void {
    this.colapsado.update((valor) => !valor);
  }
}
