import { ChangeDetectionStrategy, Component, effect, input, model, output, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/**
 * Casilla cuadrada para subir UNA imagen (logo, carta, etc.).
 * Valida tipo y peso (`maxKb`); si no cumple emite `rechazado` con el motivo
 * y no modifica el archivo actual. Es un `model`: usalo con `[(archivo)]`.
 */
@Component({
  selector: 'app-subida-imagen',
  standalone: true,
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" [class]="tamanio() === 'lg' ? 'size-28 sm:size-32' : 'size-14 sm:size-16'">
      <button
        type="button"
        class="flex size-full cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-texto-primario bg-marca-primaria text-marca-sobre-primaria shadow-baja transition-transform hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco"
        [attr.aria-label]="archivo() ? 'Cambiar ' + etiquetaAccesible() : 'Subir ' + etiquetaAccesible()"
        (click)="entrada.click()"
      >
        @if (urlPreview(); as url) {
          <img [src]="url" alt="" class="size-full object-cover" />
        } @else {
          <ng-icon
            name="phosphorPlusFill"
            [class]="tamanio() === 'lg' ? 'size-10 text-texto-primario' : 'size-6 text-texto-primario'"
            aria-hidden="true"
          />
        }
      </button>

      @if (archivo()) {
        <button
          type="button"
          class="absolute -right-2 -top-2 flex size-6 cursor-pointer items-center justify-center rounded-circulo border-2 border-texto-primario bg-fondo-superficie text-texto-primario"
          [attr.aria-label]="'Quitar ' + etiquetaAccesible()"
          (click)="quitar()"
        >
          <ng-icon name="phosphorXFill" class="size-3" aria-hidden="true" />
        </button>
      }

      <input
        #entrada
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="sr-only"
        tabindex="-1"
        (change)="seleccionar($event)"
      />
    </div>
  `,
})
export class SubidaImagen {
  readonly archivo = model<File | null>(null);
  readonly maxKb = input(200);
  readonly tamanio = input<'lg' | 'sm'>('lg');
  readonly etiquetaAccesible = input('imagen');
  readonly rechazado = output<string>();

  protected readonly urlPreview = signal<string | null>(null);

  constructor() {
    effect((alLimpiar) => {
      const archivo = this.archivo();
      if (!archivo || typeof URL.createObjectURL !== 'function') {
        this.urlPreview.set(null);
        return;
      }
      const url = URL.createObjectURL(archivo);
      this.urlPreview.set(url);
      alLimpiar(() => URL.revokeObjectURL(url));
    });
  }

  protected seleccionar(evento: Event): void {
    const entrada = evento.target as HTMLInputElement;
    const elegido = entrada.files?.[0];
    entrada.value = ''; // permite volver a elegir el mismo archivo
    if (!elegido) return;

    if (!elegido.type.startsWith('image/')) {
      this.rechazado.emit('El archivo tiene que ser una imagen (PNG, JPG o WEBP).');
      return;
    }
    if (elegido.size > this.maxKb() * 1024) {
      this.rechazado.emit(`La imagen no puede pesar más de ${this.maxKb()}kb.`);
      return;
    }
    this.archivo.set(elegido);
  }

  protected quitar(): void {
    this.archivo.set(null);
  }
}