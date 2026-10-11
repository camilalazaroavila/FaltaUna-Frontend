import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { InfoTooltip } from '../info-tooltip/info-tooltip';

/**
 * Etiqueta de un campo de formulario: texto, asterisco de obligatorio,
 * contador opcional (ej. "0/12") y tooltip de ayuda. Si recibe `para`
 * renderiza un <label for>, si no un <span> (grupos de archivos).
 */
@Component({
  selector: 'app-etiqueta-campo',
  standalone: true,
  imports: [InfoTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-1 flex items-center gap-2">
      @if (para()) {
        <label [attr.for]="para()" class="font-interfaz text-xs font-bold uppercase text-texto-primario">
          {{ texto() }}
          @if (requerido()) {
            <span class="text-error" aria-hidden="true">*</span>
          }
        </label>
      } @else {
        <span class="font-interfaz text-xs font-bold uppercase text-texto-primario">
          {{ texto() }}
          @if (requerido()) {
            <span class="text-error" aria-hidden="true">*</span>
          }
        </span>
      }
      @if (contador()) {
        <span class="font-interfaz text-xs font-bold text-error">{{ contador() }}*</span>
      }
      @if (ayuda()) {
        <app-info-tooltip [texto]="ayuda()!" />
      }
    </div>
  `,
})
export class EtiquetaCampo {
  readonly texto = input.required<string>();
  readonly para = input<string | null>(null);
  readonly requerido = input(false);
  readonly contador = input<string | null>(null);
  readonly ayuda = input<string | null>(null);
}