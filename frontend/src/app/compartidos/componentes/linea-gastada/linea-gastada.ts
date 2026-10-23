import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

let contador = 0;

/**
 * Trazo de pincel "gastado": una línea con bordes irregulares y huecos de pintura seca.
 * Se dibuja con filtros SVG (ruido fractal) y se adapta al tamaño real del contenedor,
 * así que se puede estirar con CSS sin deformar el efecto.
 *
 * Uso: `<app-linea-gastada orientacion="vertical" class="h-full w-5" [semilla]="3" />`
 * El color es el `color` CSS del elemento (por defecto, el verde de marca).
 */
@Component({
  selector: 'app-linea-gastada',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block pointer-events-none text-marca-primaria',
    'aria-hidden': 'true',
  },
  template: `
    @if (ancho() > 0 && alto() > 0) {
      <svg
        class="block size-full overflow-visible"
        [attr.viewBox]="'0 0 ' + ancho() + ' ' + alto()"
        [attr.width]="ancho()"
        [attr.height]="alto()"
      >
        <defs>
          <filter
            [id]="idFiltro"
            filterUnits="userSpaceOnUse"
            x="-20"
            y="-20"
            [attr.width]="ancho() + 40"
            [attr.height]="alto() + 40"
            color-interpolation-filters="sRGB"
          >
            <!-- 1) Borde irregular: desplaza la forma con ruido de baja frecuencia -->
            <feTurbulence
              type="fractalNoise"
              [attr.baseFrequency]="frecuenciaBorde()"
              numOctaves="2"
              [attr.seed]="semilla()"
              result="ruidoBorde"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="ruidoBorde"
              [attr.scale]="rugosidad()"
              xChannelSelector="R"
              yChannelSelector="G"
              result="forma"
            />

            <!-- 2) Pintura seca: ruido alargado en el sentido del trazo, recortado a huecos -->
            <feTurbulence
              type="fractalNoise"
              [attr.baseFrequency]="frecuenciaFibras()"
              numOctaves="3"
              [attr.seed]="semilla() + 11"
              result="fibras"
            />
            <feColorMatrix
              in="fibras"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 -5 3.1"
              result="huecos"
            />
            <feComposite in="forma" in2="huecos" operator="in" />
          </filter>
        </defs>

        <rect
          [attr.x]="rect().x"
          [attr.y]="rect().y"
          [attr.width]="rect().ancho"
          [attr.height]="rect().alto"
          [attr.rx]="rect().radio"
          fill="currentColor"
          [attr.filter]="'url(#' + idFiltro + ')'"
        />
      </svg>
    }
  `,
})
export class LineaGastada {
  readonly orientacion = input<'vertical' | 'horizontal'>('vertical');
  /** Cambia el patrón del desgaste: distintas semillas, distintos trazos. */
  readonly semilla = input(1);
  /** Qué tanto se desordena el borde, en píxeles. */
  readonly rugosidad = input(7);

  protected readonly idFiltro = `linea-gastada-${++contador}`;
  protected readonly ancho = signal(0);
  protected readonly alto = signal(0);

  protected readonly esVertical = computed(() => this.orientacion() === 'vertical');

  /** Ruido alargado a lo largo del trazo (frecuencia alta a lo ancho, baja a lo largo). */
  protected readonly frecuenciaFibras = computed(() =>
    this.esVertical() ? '0.45 0.012' : '0.012 0.45',
  );
  protected readonly frecuenciaBorde = computed(() =>
    this.esVertical() ? '0.12 0.03' : '0.03 0.12',
  );

  /** El trazo ocupa el centro del contenedor y deja margen para el desplazamiento. */
  protected readonly rect = computed(() => {
    const w = this.ancho();
    const h = this.alto();

    if (this.esVertical()) {
      const grosor = w * 0.6;
      return { x: (w - grosor) / 2, y: 0, ancho: grosor, alto: h, radio: grosor / 2 };
    }

    const grosor = h * 0.6;
    return { x: 0, y: (h - grosor) / 2, ancho: w, alto: grosor, radio: grosor / 2 };
  });

  constructor() {
    const elemento = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destruir = inject(DestroyRef);

    afterNextRender(() => {
      const medir = (): void => {
        this.ancho.set(Math.round(elemento.clientWidth));
        this.alto.set(Math.round(elemento.clientHeight));
      };

      medir();

      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const observador = new ResizeObserver(medir);
      observador.observe(elemento);
      destruir.onDestroy(() => observador.disconnect());
    });
  }
}