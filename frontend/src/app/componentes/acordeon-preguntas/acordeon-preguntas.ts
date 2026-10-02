import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

let contadorIds = 0;

@Component({
  selector: 'app-acordeon-pregunta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="acordeon" [class.acordeon--abierto]="abierto()">
      <button
        type="button"
        class="acordeon__cabecera"
        [id]="idCabecera"
        [attr.aria-expanded]="abierto()"
        [attr.aria-controls]="idPanel"
        (click)="alternar()"
      >
        <span>{{ pregunta() }}</span>
        <svg
          class="acordeon__flecha"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        class="acordeon__panel"
        role="region"
        [id]="idPanel"
        [attr.aria-labelledby]="idCabecera"
        [attr.inert]="abierto() ? null : ''"
      >
        <div class="acordeon__contenido">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .acordeon {
      border: 2px solid var(--acento);
      border-radius: var(--radio-lg);
      background: var(--superficie);
      color: var(--texto);
    }

    .acordeon__cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      width: 100%;
      padding: 0.6rem 1rem;
      border: 0;
      border-radius: inherit;
      background: transparent;
      color: inherit;
      font-family: system-ui, sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      text-align: start;
      cursor: pointer;
    }

    .acordeon__cabecera:focus-visible {
      outline: 3px solid var(--marca);
      outline-offset: 3px;
    }

    .acordeon__flecha {
      flex-shrink: 0;
      color: var(--acento);
      transition: rotate 200ms ease;
    }

    .acordeon--abierto .acordeon__flecha {
      rotate: 180deg;
    }

    /* Animación de altura sin medir con JS */
    .acordeon__panel {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 200ms ease;
    }

    .acordeon--abierto .acordeon__panel {
      grid-template-rows: 1fr;
    }

    .acordeon__contenido {
      min-height: 0;
      overflow: hidden;
      padding-inline: 1rem;
      font-family: 'Merriweather', Georgia, serif;
      font-size: 0.85rem;
      line-height: 1.6;
    }

    .acordeon--abierto .acordeon__contenido {
      padding-block: 0.25rem 1rem;
    }

    @media (prefers-reduced-motion: reduce) {
      .acordeon__flecha,
      .acordeon__panel {
        transition: none;
      }
    }
  `,
})
export class AcordeonPregunta {
  readonly pregunta = input.required<string>();

  /** Permite abrirlo desde afuera con [(abierto)]. */
  readonly abierto = model(false);

  private readonly id = ++contadorIds;
  protected readonly idCabecera = `acordeon-cabecera-${this.id}`;
  protected readonly idPanel = `acordeon-panel-${this.id}`;

  protected alternar(): void {
    this.abierto.update((valor) => !valor);
  }
}