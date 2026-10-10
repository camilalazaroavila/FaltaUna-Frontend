import { ChangeDetectionStrategy, Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { EtiquetaCampo } from '../etiqueta-campo/etiqueta-campo';

let contador = 0;

/** Clases compartidas por los controles de formulario (texto, fecha, select). */
export const CLASES_CAMPO =
  'w-full border-2 bg-transparent px-4 py-2.5 font-interfaz text-sm font-bold text-texto-primario ' +
  'placeholder:text-texto-apagado focus-visible:outline-2 focus-visible:outline-offset-2 ' +
  'focus-visible:outline-borde-foco disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Campo de texto con etiqueta. Compatible con formularios reactivos y ngModel.
 * Sirve para texto, email, url, fecha o área de texto (`multilinea`).
 */
@Component({
  selector: 'app-campo-texto',
  standalone: true,
  imports: [EtiquetaCampo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoTexto), multi: true },
  ],
  template: `
    <app-etiqueta-campo
      [texto]="etiqueta()"
      [para]="id"
      [requerido]="requerido()"
      [ayuda]="ayuda()"
    />
    @if (multilinea()) {
      <textarea
        [id]="id"
        rows="3"
        [class]="clases()"
        [placeholder]="placeholder()"
        [attr.maxlength]="maxLength()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="error() ? id + '-error' : null"
        [value]="valor()"
        [disabled]="deshabilitado()"
        (input)="cambiar($any($event.target).value)"
        (blur)="alTocar()"
      ></textarea>
    } @else {
      <input
        [id]="id"
        [type]="tipo()"
        [class]="clases()"
        [placeholder]="placeholder()"
        [attr.maxlength]="maxLength()"
        [attr.min]="min()"
        [attr.autocomplete]="autocompletar()"
        [attr.aria-invalid]="error() ? 'true' : null"
        [attr.aria-describedby]="error() ? id + '-error' : null"
        [value]="valor()"
        [disabled]="deshabilitado()"
        (input)="cambiar($any($event.target).value)"
        (blur)="alTocar()"
      />
    }
    @if (error()) {
      <p [id]="id + '-error'" class="mt-1 font-interfaz text-xs font-bold text-error" role="alert">
        {{ error() }}
      </p>
    }
  `,
})
export class CampoTexto implements ControlValueAccessor {
  readonly etiqueta = input.required<string>();
  readonly tipo = input<'text' | 'email' | 'url' | 'date'>('text');
  readonly multilinea = input(false);
  readonly requerido = input(false);
  readonly ayuda = input<string | null>(null);
  readonly placeholder = input('');
  readonly maxLength = input<number | null>(null);
  readonly min = input<string | null>(null);
  readonly autocompletar = input<string | null>(null);
  /** Mensaje de error ya resuelto por la página; null si el campo es válido. */
  readonly error = input<string | null>(null);

  protected readonly id = `campo-texto-${++contador}`;
  protected readonly valor = signal('');
  protected readonly deshabilitado = signal(false);

  private onChange: (valor: string) => void = () => undefined;
  protected alTocar: () => void = () => undefined;

  protected clases(): string {
    const forma = this.multilinea() ? 'rounded-lg resize-none' : 'rounded-pildora';
    const borde = this.error() ? 'border-error' : 'border-texto-primario';
    return `${CLASES_CAMPO} ${forma} ${borde}`;
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