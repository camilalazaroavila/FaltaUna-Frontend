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
 * (Misiones en verde, PT System en amarillo) y un botón dedicado para
 * colapsar/expandir las etiquetas. En escritorio es una pastilla vertical; en
 * móvil, una fila horizontal.
 *
 * Los botones son propios (no `app-boton`) porque el color por sección es parte
 * del significado y `app-boton` fija su paleta por variante, no por instancia.
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
    { id: 'pity', etiqueta: 'PT System', icono: 'phosphorSparkleFill' },
  ];

  protected esActiva(id: SeccionMisiones): boolean {
    return this.seccionActiva() === id;
  }

  protected clasesSeccion(id: SeccionMisiones): string {
    const base = [
      'inline-flex size-11 cursor-pointer items-center justify-center rounded-circulo border-2',
      'transition-[background-color,border-color,color,box-shadow,transform] duration-200',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco',
      'motion-reduce:transition-none hover:scale-110 active:scale-100',
    ];

    if (id === 'misiones') {
      return [
        ...base,
        this.esActiva(id)
          ? 'border-transparent bg-marca-primaria text-marca-sobre-primaria shadow-baja'
          : 'border-marca-primaria bg-transparent text-marca-primaria hover:bg-marca-primaria hover:text-marca-sobre-primaria',
      ].join(' ');
    }

    return [
      ...base,
      this.esActiva(id)
        ? 'border-transparent bg-marca-acento text-marca-sobre-acento shadow-baja'
        : 'border-marca-acento bg-transparent text-marca-acento hover:bg-marca-acento hover:text-marca-sobre-acento',
    ].join(' ');
  }

  protected alternarColapso(): void {
    this.colapsado.update((valor) => !valor);
  }
}
