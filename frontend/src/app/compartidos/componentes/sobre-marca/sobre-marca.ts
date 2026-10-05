import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

/** `oscuro` es el sobre verde de cancha (Paquete1), `claro` el crema (Paquete2). */
export type VarianteSobreMarca = 'oscuro' | 'claro';

/**
 * Anchos en rem, no alturas: el sobre es vertical (viewBox `208.67 x 340.93`)
 * y la altura sale de la proporcion intrinseca del SVG, que nunca se deforma.
 */
export type TamanioSobreMarca = 'sm' | 'md' | 'lg';

const CLASES_BASE = [
  'rounded-md',
  'transition-[transform,box-shadow] duration-200 ease-out',
  'motion-reduce:transition-none motion-reduce:transform-none',
].join(' ');

/**
 * El hover y el anillo de foco viven en el elemento interactivo (el `<button>`
 * interno), no en el host: el que recibe el foco es el control, y un
 * `focus-visible` en el ancestro no matchea nunca.
 *
 * El modo visual no lleva ninguna de estas clases, para que el sobre no
 * sugiera que responde a un clic. `habilitado` es el mismo candado que usa
 * `app-boton`.
 */
const CLASES_INTERACTIVAS = [
  'habilitado:cursor-pointer',
  'habilitado:hover:-translate-y-0.5',
  'habilitado:hover:shadow-media',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco',
].join(' ');

const CLASES_TAMANIO: Record<TamanioSobreMarca, string> = {
  sm: 'w-20',
  md: 'w-28',
  lg: 'w-44',
};

/** Texto por defecto del `aria-label` cuando la marca no pasa nombre. */
export const ETIQUETA_SOBRE_POR_DEFECTO = 'Sobre de Falta Una';

/**
 * Caracteres que entran en el frente del sobre antes de recortar. El recorte
 * existe porque `<text>` de SVG no envuelve: un nombre largo se saldria del
 * sobre. El nombre completo sigue intacto en el `aria-label`.
 */
const MAXIMO_CARACTERES_NOMBRE = 16;

const recortar = (texto: string): string =>
  texto.length > MAXIMO_CARACTERES_NOMBRE
    ? `${texto.slice(0, MAXIMO_CARACTERES_NOMBRE - 1).trimEnd()}…`
    : texto;

/**
 * Cada sobre necesita un `id` distinto para su `<clipPath>`: varias placas en
 * pantalla (un `@for` de la galería, una grilla de colecciones) no pueden
 * compartirlo, porque el `url(#id)` del recorte resolvería siempre al primero.
 * El contador es de módulo, monotono y sin dependencias.
 */
let instancias = 0;

/**
 * Sobres de cartas con el logo de una marca en el centro.
 *
 * Es presentacion pura: no hace peticiones HTTP y no sabe de donde sale el
 * logo. Todo llega por inputs, asi que el padre puede usarlo en un `@for`
 * alimentado por un servicio sin que el componente tenga nada hardcodeado.
 *
 * El SVG va INLINE en el template, no como `<img src>`: dentro de un `<img>`
 * las referencias internas a recursos no cargan, y el `<image>` del logo es
 * justamente un recurso. Ademas el `<img>` obligaria a escribir el color en el
 * markup de cada sobre.
 *
 * La geometria (4 paths de cuerpo y 9 de letras) es exactamente la de
 * `compartidos/SVGs/Paquete1.svg` y `Paquete2.svg`, que son la unica fuente:
 * los dos archivos comparten la misma geometria y solo cambian los colores, asi
 * que acá hay un unico juego de paths y el color lo decide la variante por
 * token. NO usar `PaqueteUnColor.svg`, que viene sin fill y se dibuja negro.
 *
 * Sin `logoUrl` muestra las letras "FALTA UNA" originales, que ocupan casi
 * todo el frente y por eso se ocultan cuando hay logo. El logo no lleva ningun
 * `mask` ni gradiente: el unico `id` del SVG es el del recorte de la placa, y es
 * unico por instancia.
 */
@Component({
  selector: 'app-sobre-marca',
  imports: [NgTemplateOutlet],
  templateUrl: './sobre-marca.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sobre-marca--oscuro]': 'variante() === "oscuro"',
    '[class.sobre-marca--claro]': 'variante() === "claro"',
  },
  styles: `
    /* El host aporta el layout y la variante: las tres variables locales bajan
       por cascada hasta las partes del SVG, asi que cada grupo escribe su fill
       una sola vez.

       OJO con el alcance: la variante tiene que usar :host(...). Escrita suelta,
       Angular compila ".sobre-marca--oscuro" como ".sobre-marca--oscuro[
       _ngcontent-xxx]", y el host nunca lleva _ngcontent (lleva _nghost): la
       regla no matchea, las tres variables quedan sin definir y todos los fill
       caen al valor inicial, que es negro. */
    :host {
      display: inline-flex;
    }

    :host(.sobre-marca--oscuro) {
      --sobre-cuerpo-local: var(--sobre-cuerpo-oscuro);
      --sobre-detalle-local: var(--sobre-detalle-oscuro);
      --sobre-sello-local: var(--sobre-sello-oscuro);
    }

    :host(.sobre-marca--claro) {
      --sobre-cuerpo-local: var(--sobre-cuerpo-claro);
      --sobre-detalle-local: var(--sobre-detalle-claro);
      --sobre-sello-local: var(--sobre-sello-claro);
    }

    .sobre__cuerpo {
      fill: var(--sobre-cuerpo-local);
    }

    .sobre__letras,
    .sobre__nombre {
      fill: var(--sobre-detalle-local);
    }

    .sobre__placa {
      fill: var(--sobre-sello-local);
    }

    .sobre__logo {
      opacity: 1;
      transition: opacity 200ms ease-out;
    }

    .sobre__logo--oculto {
      opacity: 0;
    }

    .sobre__placa--cargando {
      animation: sobre-pulso 1.2s ease-in-out infinite;
    }

    @keyframes sobre-pulso {
      50% {
        opacity: 0.45;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .sobre__logo {
        transition: none;
      }

      .sobre__placa--cargando {
        animation: none;
      }
    }
  `,
})
export class SobreMarca {
  /** `id` del `<clipPath>` de la placa: unico por instancia. */
  protected readonly idPlaca = `sobre-marca-placa-${++instancias}`;

  /**
   * URL del logo de la marca (PNG/JPG/SVG/WebP). Viene del backend
   * (`Coleccion.ImagenUrl`) y puede venir de otro origen: para mostrarlo no
   * hay problema, solo para exportarlo a canvas.
   */
  readonly logoUrl = input<string | null>(null);

  /**
   * Nombre de la marca. Opcional: si el logo ya incluye el nombre, se omite.
   * Solo se dibuja cuando hay logo, porque las letras "FALTA UNA" ocupan el
   * frente completo del sobre.
   */
  readonly nombre = input<string | null>(null);

  readonly variante = input<VarianteSobreMarca>('oscuro');
  readonly tamanio = input<TamanioSobreMarca>('md');

  /**
   * `false` (por defecto) deja el sobre como pieza visual: sin boton, sin foco
   * y sin hover. `true` lo convierte en un control que emite `accion`.
   */
  readonly clickeable = input<boolean, unknown>(false, { transform: booleanAttribute });

  readonly accion = output<void>();

  /** URL del logo que termino de cargar. */
  private readonly urlCargada = signal<string | null>(null);

  /** URL del logo que fallo. */
  private readonly urlFallida = signal<string | null>(null);

  /**
   * El estado de la imagen se deriva comparando contra la URL actual, en vez de
   * con un boolean. Asi un error de una URL anterior no sobrevive a un cambio de
   * `logoUrl`: el caso normal de un `@for` que reutiliza la instancia para otra
   * marca. Tampoco hace falta un `effect` para reiniciar nada.
   */
  protected readonly cargando = computed(() => {
    const url = this.logoUrl();
    return !!url && this.urlCargada() !== url;
  });

  /**
   * Un logo que no carga cae al envoltorio generico de la app: un `<image>`
   * invalido se dibuja como un recuadro vacio, que es justo el "espacio roto"
   * que el sobre no puede mostrar.
   */
  protected readonly fallo = computed(() => {
    const url = this.logoUrl();
    return !!url && this.urlFallida() === url;
  });

  /** Hay logo y todavia no fallo: corresponde pintar el sello. */
  protected readonly conLogo = computed(() => !!this.logoUrl() && !this.fallo());

  protected readonly etiqueta = computed(() => {
    const nombre = this.nombre()?.trim();
    return nombre ? `Sobre de ${nombre}` : ETIQUETA_SOBRE_POR_DEFECTO;
  });

  protected readonly nombreVisible = computed(() => {
    const nombre = this.nombre()?.trim();
    return nombre ? recortar(nombre) : null;
  });

  protected readonly clases = computed(() => {
    const clases = [CLASES_BASE, CLASES_TAMANIO[this.tamanio()]];

    if (this.clickeable()) {
      clases.push(CLASES_INTERACTIVAS);
    }

    return clases.join(' ');
  });

  protected readonly imagenCargada = (): void => this.urlCargada.set(this.logoUrl());

  protected readonly imagenFallida = (): void => this.urlFallida.set(this.logoUrl());
}