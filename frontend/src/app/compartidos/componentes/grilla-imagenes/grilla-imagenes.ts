import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { SubidaImagen } from '../subida-imagen/subida-imagen';

/**
 * Grilla de `cantidad` casillas de subida de imagen. El valor es un arreglo
 * de largo fijo (`null` = casilla vacía). Usalo con `[(archivos)]`.
 */
@Component({
  selector: 'app-grilla-imagenes',
  standalone: true,
  imports: [SubidaImagen],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6" role="group" [attr.aria-label]="etiquetaAccesible()">
      @for (indice of indices(); track indice) {
        <app-subida-imagen
          tamanio="sm"
          [maxKb]="maxKb()"
          [etiquetaAccesible]="'imagen ' + (indice + 1)"
          [archivo]="archivos()[indice] ?? null"
          (archivoChange)="cambiar(indice, $event)"
          (rechazado)="rechazado.emit($event)"
        />
      }
    </div>
  `,
})
export class GrillaImagenes {
  readonly archivos = model<(File | null)[]>([]);
  readonly cantidad = input(12);
  readonly maxKb = input(200);
  readonly etiquetaAccesible = input('Imágenes');
  readonly rechazado = output<string>();

  protected readonly indices = computed(() => Array.from({ length: this.cantidad() }, (_, i) => i));

  protected cambiar(indice: number, archivo: File | null): void {
    const copia = this.indices().map((i) => this.archivos()[i] ?? null);
    copia[indice] = archivo;
    this.archivos.set(copia);
  }
}