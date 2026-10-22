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
    <div [class]="clasesContenedor()">
      <button
        type="button"
        [class]="clasesCabecera()"
        [id]="idCabecera"
        [attr.aria-expanded]="abierto()"
        [attr.aria-controls]="idPanel"
        (click)="alternar()"
      >
        <span [class]="clasesTextoCabecera()">{{ pregunta() }}</span>
        <svg
          [class]="clasesFlecha()"
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
      overflow-wrap: anywhere;
    }

    .acordeon--abierto .acordeon__contenido {
      padding-block: 0.25rem 1rem;
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

  /** Formato píldora redondeada para la landing de usuario. */
  readonly pildora = input(false, { transform: booleanAttribute });

  protected readonly clasesContenedor = computed(() => {
    const base =
      'acordeon overflow-hidden border border-landing-oscuro-borde-control bg-landing-oscuro-fondo text-landing-oscuro-texto transition-all';
    const abierto = this.abierto();
    const estado = abierto ? 'acordeon--abierto' : '';

    if (!this.pildora()) {
      return `${base} rounded-md ${estado}`;
    }

    // En móvil la pregunta puede ocupar 2+ líneas: rounded-full se ve deformado,
    // así que usamos esquinas grandes y desde sm la píldora completa.
    const forma = abierto ? 'rounded-2xl' : 'rounded-3xl sm:rounded-full';
    return `${base} ${forma} ${estado}`;
  });

  protected readonly clasesCabecera = computed(() => {
    if (this.pildora()) {
      // Texto centrado; el padding lateral reserva lugar para la flecha absoluta.
      return 'relative flex w-full min-h-11 items-center justify-center text-center font-interfaz font-semibold text-landing-oscuro-texto transition-colors hover:text-landing-marca pl-10 pr-10 sm:pl-12 sm:pr-12 py-3 text-sm sm:text-base lg:text-lg cursor-pointer';
    }
    return [
      'flex w-full items-center justify-between gap-2 text-left font-interfaz font-semibold text-landing-oscuro-texto transition-colors hover:text-landing-marca cursor-pointer',
      this.compacto()
        ? 'px-2.5 py-2 text-[11px] md:px-3 md:py-3 md:text-sm lg:px-3.5 lg:py-3.5 lg:text-landing-faq'
        : 'px-4 py-2.5 text-sm',
    ].join(' ');
  });

  protected readonly clasesTextoCabecera = computed(() =>
    this.pildora() ? 'min-w-0 break-words' : 'min-w-0 flex-1 break-words',
  );

  protected readonly clasesFlecha = computed(() => {
    const base = 'acordeon__flecha size-4 shrink-0 text-white md:size-5';
    return this.pildora() ? `${base} absolute right-4 sm:right-5 inset-y-0 my-auto` : base;
  });

  protected readonly clasesContenido = computed(() => {
    if (this.pildora()) {
      return 'acordeon__contenido font-cuerpo text-landing-oscuro-tenue text-center px-5 sm:px-8 text-sm sm:text-base';
    }
    return [
      'acordeon__contenido font-cuerpo text-landing-oscuro-tenue',
      this.compacto() ? 'px-2.5 text-[11px] md:px-3 md:text-sm lg:px-3.5 lg:text-landing-faq' : 'px-4 text-sm',
    ].join(' ');
  });

  private readonly id = ++contadorIds;
  protected readonly idCabecera = `acordeon-cabecera-${this.id}`;
  protected readonly idPanel = `acordeon-panel-${this.id}`;

  protected alternar(): void {
    this.abierto.update((valor) => !valor);
  }
}