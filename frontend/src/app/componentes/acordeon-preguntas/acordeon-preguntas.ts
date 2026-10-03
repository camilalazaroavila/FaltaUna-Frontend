import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model,
} from '@angular/core';

let contadorIds = 0;

@Component({
  selector: 'app-acordeon-pregunta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="acordeon overflow-hidden rounded-md border border-landing-oscuro-borde-control bg-landing-oscuro-fondo text-landing-oscuro-texto"
      [class.acordeon--abierto]="abierto()"
    >
      <button
        type="button"
        [class]="clasesCabecera()"
        [id]="idCabecera"
        [attr.aria-expanded]="abierto()"
        [attr.aria-controls]="idPanel"
        (click)="alternar()"
      >
        <span class="min-w-0 truncate">{{ pregunta() }}</span>
        <svg
          class="acordeon__flecha size-3 shrink-0 text-landing-marca md:size-4 lg:size-5"
          viewBox="0 0 24 24"
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
        <div class="acordeon__contenido" [class]="clasesContenido()">
          <ng-content />
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
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
      line-height: 1.5;
    }

    .acordeon--abierto .acordeon__contenido {
      padding-block: 0.25rem 0.75rem;
    }

    .acordeon__flecha {
      transition: transform 200ms ease;
    }

    .acordeon--abierto .acordeon__flecha {
      transform: rotate(180deg);
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

  /** Versión reducida para el grid de dos columnas del FAQ. */
  readonly compacto = input(false, { transform: booleanAttribute });

  protected readonly clasesCabecera = computed(() =>
    [
      'flex w-full items-center justify-between gap-2 text-left font-interfaz font-semibold text-landing-oscuro-texto transition-colors hover:text-landing-marca',
      this.compacto()
        ? 'px-2.5 py-2 text-[11px] md:px-3 md:py-3 md:text-sm lg:px-3.5 lg:py-3.5 lg:text-landing-faq'
        : 'px-4 py-2.5 text-sm',
    ].join(' ')
  );

  protected readonly clasesContenido = computed(() =>
    [
      'acordeon__contenido font-cuerpo text-landing-oscuro-tenue',
      this.compacto() ? 'px-2.5 text-[11px] md:px-3 md:text-sm lg:px-3.5 lg:text-landing-faq' : 'px-4 text-sm',
    ].join(' ')
  );

  private readonly id = ++contadorIds;
  protected readonly idCabecera = `acordeon-cabecera-${this.id}`;
  protected readonly idPanel = `acordeon-panel-${this.id}`;

  protected alternar(): void {
    this.abierto.update((valor) => !valor);
  }
}
