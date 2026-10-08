import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Contenedor con barra de desplazamiento personalizada reutilizable.
 * Estiliza el scrollbar para navegadores basados en WebKit y Firefox
 * con una pista sutil y un tirador redondeado en tono acento/crema.
 */
@Component({
  selector: 'app-panel-desplazable',
  standalone: true,
  template: `
    <div
      class="panel-desplazable w-full h-full overflow-y-auto overflow-x-hidden pr-2 select-none"
      [class]="clasesExtra()"
    >
      <ng-content />
    </div>
  `,
  styles: `
    .panel-desplazable {
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb, #eaf9a6) var(--color-scrollbar-track, rgba(255, 255, 255, 0.08));
    }

    .panel-desplazable::-webkit-scrollbar {
      width: 8px;
    }

    .panel-desplazable::-webkit-scrollbar-track {
      background: var(--color-scrollbar-track, rgba(255, 255, 255, 0.08));
      border-radius: 9999px;
    }

    .panel-desplazable::-webkit-scrollbar-thumb {
      background: var(--color-scrollbar-thumb, #eaf9a6);
      border-radius: 9999px;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .panel-desplazable::-webkit-scrollbar-thumb:hover {
      background: #d4e788;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelDesplazable {
  readonly clasesExtra = input<string>('');
}
