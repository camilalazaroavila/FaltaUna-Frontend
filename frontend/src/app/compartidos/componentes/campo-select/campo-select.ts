import { ChangeDetectionStrategy, Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { CLASES_CAMPO } from '../campo-texto/campo-texto';
import { EtiquetaCampo } from '../etiqueta-campo/etiqueta-campo';

let contador = 0;

export interface OpcionSelect {
  valor: string;
  etiqueta: string;
  /** Nombre de un ícono registrado en app.config (ej. `phosphorHamburgerFill`). */
  icono?: string;
}

/** Desplegable con etiqueta e ícono de la opción elegida. Compatible con formularios reactivos. */
@Component({
  selector: 'app-campo-select',
  standalone: true,
  imports: [NgIcon, EtiquetaCampo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoSelect), multi: true },
  ],
  template: `
    <app-etiqueta-campo
      [texto]="etiqueta()"
      [para]="id"
      [requerido]="requerido()"
      [ayuda]="ayuda()"
    />
    <div class="relative">
      @if (iconoActual(); as icono) {
        <ng-icon
          [name]="icono"
          class="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-texto-primario"
          aria-hidden="true"
        />
      }
      <select
        [id]="id"
        [class]="clases()"
        [disabled]="deshabilitado()"
        [attr.aria-invalid]="error() ? 'true' : null"
        (change)="cambiar($any($event.target).value)"
        (blur)="alTocar()"
      >
        @if (placeholder()) {
          <option value="" [selected]="valor() === ''" disabled>{{ placeholder() }}</option>
        }
        @for (opcion of opciones(); track opcion.valor) {
          <option [value]="opcion.valor" [selected]="opcion.valor === valor()">
            {{ opcion.etiqueta }}
          </option>
        }
      </select>
      <ng-icon
        name="phosphorCaretDownFill"
        class="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-texto-primario"
        aria-hidden="true"
      />
    </div>
    @if (error()) {
      <p class="mt-1 font-interfaz text-xs font-bold text-error" role="alert">{{ error() }}</p>
    }
  `,
})
export class CampoSelect implements ControlValueAccessor {
  readonly etiqueta = input.required<string>();
  readonly opciones = input.required<OpcionSelect[]>();
  readonly requerido = input(false);
  readonly ayuda = input<string | null>(null);
  readonly placeholder = input('');
  readonly error = input<string | null>(null);

  protected readonly id = `campo-select-${++contador}`;
  protected readonly valor = signal('');
  protected readonly deshabilitado = signal(false);

  protected readonly iconoActual = computed(
    () => this.opciones().find((o) => o.valor === this.valor())?.icono ?? null,
  );

  private onChange: (valor: string) => void = () => undefined;
  protected alTocar: () => void = () => undefined;

  protected clases(): string {
    const borde = this.error() ? 'border-error' : 'border-texto-primario';
    const izquierda = this.iconoActual() ? 'pl-12' : '';
    return `${CLASES_CAMPO} cursor-pointer appearance-none rounded-pildora pr-12 uppercase ${izquierda} ${borde}`;
  }

  protected cambiar(valor: string): void {
    this.valor.set(valor);
    this.onChange(valor);
  }

  writeValue(valor: string | null): void {
    this.valor.set(valor ?? '');
  }
  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.alTocar = fn;
  }
  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }
}