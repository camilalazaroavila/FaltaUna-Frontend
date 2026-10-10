import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';

import type { CategoriaSobre } from '../../../modelos/categoria.model';
import { ETIQUETAS_CATEGORIA } from '../../../modelos/categoria.model';
import { ICONOS_CATEGORIA } from './iconos-categoria';

/** oscuro es el sobre verde de cancha (Paquete1), claro el crema (Paquete2). */
export type VarianteSobreMarca = 'oscuro' | 'claro';

/**
 * Anchos en rem, no alturas: el sobre es vertical (viewBox 208.67 x 340.93)
 * y la altura sale de la proporcion intrinseca del SVG, que nunca se deforma.
 */
export type TamanioSobreMarca = 'sm' | 'md' | 'lg';

const CLASES_BASE = ['motion-reduce:transition-none motion-reduce:transform-none',].join(' ');

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
 * Zona maxima donde entra la imagen de una marca, en unidades del viewBox del
 * sobre. Es la misma que ocupa el icono de las categorias, asi los tres tipos
 * de sobre quedan alineados y centrados sobre el pliegue.
 */
export const ZONA_LOGO = { ancho: 157, alto: 150, centroX: 104.5, centroY: 157 } as const;

export interface CajaLogo {
  readonly x: number;
  readonly y: number;
  readonly ancho: number;
  readonly alto: number;
}

/** La propia ZONA_LOGO como caja: el area donde viven la placa y el icono de categoria. */
export const CAJA_ZONA_LOGO: CajaLogo = {
  x: ZONA_LOGO.centroX - ZONA_LOGO.ancho / 2,
  y: ZONA_LOGO.centroY - ZONA_LOGO.alto / 2,
  ancho: ZONA_LOGO.ancho,
  alto: ZONA_LOGO.alto,
};

/**
 * Cuanto se corta cada esquina, como fraccion del lado corto de la caja, en
 * orden [superior-izquierda, superior-derecha, inferior-derecha, inferior-
 * izquierda]. Radios chicos y desiguales a proposito: dos esquinas casi en
 * punta (superior-izquierda e inferior-derecha) y dos con corte marcado, como
 * una etiqueta cartoon.
 */
const RADIOS_ESQUINA_PLACA = [0.03, 0.15, 0.025, 0.11] as const;

/**
 * Rectangulo del logo: respeta su proporcion real, entra en la zona maxima y
 * queda centrado sobre el pliegue. Hasta medirse el logo, se asume cuadrado.
 */
export const calcularCajaLogo = (
  proporcion: number,
  zona: typeof ZONA_LOGO = ZONA_LOGO,
): CajaLogo => {
  const proporcionValida = Number.isFinite(proporcion) && proporcion > 0 ? proporcion : 1;

  let ancho = zona.ancho;
  let alto = ancho / proporcionValida;
  if (alto > zona.alto) {
    alto = zona.alto;
    ancho = alto * proporcionValida;
  }

  return {
    x: zona.centroX - ancho / 2,
    y: zona.centroY - alto / 2,
    ancho,
    alto,
  };
};

const redondear = (valor: number): number => Math.round(valor * 1000) / 1000;

/**
 * Silueta cartoon de la placa para una caja dada: repite las cuatro esquinas
 * con radios irregulares, asi la forma acompaña cualquier proporcion del logo
 * (apaisado, cuadrado o vertical) conservando el corte punteagudo de siempre.
 */
export const construirTrazoPlaca = (caja: CajaLogo): string => {
  const lado = Math.min(caja.ancho, caja.alto);
  const limite = lado / 2;
  const [rSI, rSD, rID, rII] = RADIOS_ESQUINA_PLACA.map((factor) => Math.min(lado * factor, limite));

  return [
    `M ${redondear(caja.x + rSI)} ${redondear(caja.y)}`,
    `H ${redondear(caja.x + caja.ancho - rSD)}`,
    `A ${redondear(rSD)} ${redondear(rSD)} 0 0 1 ${redondear(caja.x + caja.ancho)} ${redondear(caja.y + rSD)}`,
    `V ${redondear(caja.y + caja.alto - rID)}`,
    `A ${redondear(rID)} ${redondear(rID)} 0 0 1 ${redondear(caja.x + caja.ancho - rID)} ${redondear(caja.y + caja.alto)}`,
    `H ${redondear(caja.x + rII)}`,
    `A ${redondear(rII)} ${redondear(rII)} 0 0 1 ${redondear(caja.x)} ${redondear(caja.y + caja.alto - rII)}`,
    `V ${redondear(caja.y + rSI)}`,
    `A ${redondear(rSI)} ${redondear(rSI)} 0 0 1 ${redondear(caja.x + rSI)} ${redondear(caja.y)}`,
    'Z',
  ].join(' ');
};

/** Las cuatro caras del sobre (Paquete1 / Paquete2): una sola fuente para el cuerpo y la silueta. */
const CUERPO_SOBRE: readonly string[] = [
  'M195.39,156.79V271.91a9.61,9.61,0,0,1-9.61,9.6H23.29a9.61,9.61,0,0,1-9.61-9.61V156.79C83.92,236.55,121.63,79.23,195.39,156.79Z',
  'M13.68,156.79V41.68a9.61,9.61,0,0,1,9.61-9.61H185.78a9.61,9.61,0,0,1,9.61,9.61V156.79C121,166.49,86.66,280.13,13.68,156.79Z',
  'M200.72,161.64,200.56,25H7.79L8,150.77,0,141.52V15.6c77-21.84,145.8-19.74,208.67,0V170.89Z',
  'M8,150.77,8.11,287.4H200.88l-.16-125.76,7.95,9.25V323.56C137.7,347,68.18,346.44,0,323.56v-182Z',
];

/** Variables CSS que el puntero escribe en el `<button>`. */
const VARIABLES_PUNTERO = [
  '--puntero-x',
  '--puntero-y',
  '--rotar-x',
  '--rotar-y',
  '--fondo-x',
  '--fondo-y',
] as const;

/** Inclinacion maxima (grados) en los bordes del sobre. */
const INCLINACION_MAXIMA = 12;

const acotar = (valor: number, minimo: number, maximo: number): number =>
  Math.min(maximo, Math.max(minimo, valor));

/**
 * Cada sobre necesita un `id` distinto para su `<clipPath>`: varios sobres en
 * pantalla (un `@for` de la galería, una grilla de colecciones) no pueden
 * compartirlo, porque el `url(#id)` del recorte resolvería siempre al primero.
 * El contador es de módulo, monotono y sin dependencias.
 */
let instancias = 0;

/**
 * Sobres de cartas con el logo de una marca o el icono de una categoría en el centro.
 */
@Component({
  selector: 'app-sobre-marca',
  imports: [NgTemplateOutlet],
  templateUrl: './sobre-marca.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sobre-marca--oscuro]': 'variante() === "oscuro"',
    '[class.sobre-marca--claro]': 'variante() === "claro"',
    '[class.sobre-marca--categoria]': '!!categoria()',
  },
  styles: `
    :host {
      display: inline-flex;
    }

    :host(.sobre-marca--oscuro) {
      --sobre-cuerpo-local: var(--sobre-cuerpo-oscuro);
      --sobre-detalle-local: var(--sobre-detalle-oscuro);
    }

    :host(.sobre-marca--claro) {
      --sobre-cuerpo-local: var(--sobre-cuerpo-claro);
      --sobre-detalle-local: var(--sobre-detalle-claro);
    }

    /* Va DESPUÉS de --oscuro y --claro: misma especificidad, gana el orden. */
    :host(.sobre-marca--categoria) {
      --sobre-cuerpo-local: var(--sobre-categoria-cuerpo);
      --sobre-detalle-local: var(--sobre-categoria-detalle);
    }

    .sobre__cuerpo {
      fill: var(--sobre-cuerpo-local);
    }

    .sobre__letras,
    .sobre__nombre {
      fill: var(--sobre-detalle-local);
    }

    .sobre__icono {
      fill: var(--sobre-detalle-local);
    }

    /* Placa de marca: silueta cartoon recortada a la proporcion del logo.
       La sombra es una copia solida de la misma silueta desplazada 9 unidades,
       y el borde de tinta rodea la placa para fundirse con esa sombra. */
    .sobre__placa--marca {
      fill: none;
      stroke: var(--sobre-sombra-placa);
      stroke-width: 3;
      stroke-linejoin: round;
    }

    .sobre__placa-sombra {
      fill: var(--sobre-sombra-placa);
    }

    /* Efecto holografico: solo en sobres clickeables. */
    .sobre__escena {
      position: relative;
      display: block;
      width: 100%;
    }

    .sobre__escena--holo {
      transform: perspective(700px) rotateX(var(--rotar-x, 0deg)) rotateY(var(--rotar-y, 0deg));
      transition: transform 180ms ease-out;
    }

    .sobre__brillo,
    .sobre__reflejo {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0;
      transition: opacity 250ms ease-out;
    }

    .sobre__brillo {
      background:
        repeating-linear-gradient(
          110deg,
          var(--sobre-holo-a) 0%,
          var(--sobre-holo-b) 14%,
          var(--sobre-holo-c) 28%,
          var(--sobre-holo-d) 42%,
          var(--sobre-holo-e) 56%,
          var(--sobre-holo-a) 70%
        ),
        radial-gradient(
          farthest-corner circle at var(--puntero-x, 50%) var(--puntero-y, 50%),
          var(--sobre-reflejo) 0%,
          transparent 55%
        );
      background-size: 300% 300%, 100% 100%;
      background-position: var(--fondo-x, 50%) var(--fondo-y, 50%), center;
      mix-blend-mode: color-dodge;
      filter: brightness(0.85) contrast(1.15) saturate(1.2);
    }

    .sobre__reflejo {
      background: radial-gradient(
        farthest-corner circle at var(--puntero-x, 50%) var(--puntero-y, 50%),
        var(--sobre-reflejo) 0%,
        transparent 60%
      );
      mix-blend-mode: overlay;
    }

    button:hover .sobre__brillo,
    button:focus-visible .sobre__brillo {
      opacity: var(--sobre-brillo-intensidad, 0.5);
    }

    button:hover .sobre__reflejo,
    button:focus-visible .sobre__reflejo {
      opacity: 1;
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

    :host-context([data-movimiento='reducido']) .sobre__escena--holo {
      transform: none;
      transition: none;
    }

    @keyframes sobre-pulso {
      50% {
        opacity: 0.45;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .sobre__escena--holo {
        transform: none;
        transition: none;
      }

      .sobre__brillo,
      .sobre__reflejo {
        transition: none;
      }
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
  /** `id` del `<clipPath>` del logo o de la placa: unico por instancia. */
  protected readonly idPlaca = `sobre-marca-placa-${++instancias}`;

  /** `id` del recorte con la silueta del sobre (capas del efecto holografico). */
  protected readonly idSilueta = `sobre-marca-silueta-${++instancias}`;

  protected readonly cuerpo = CUERPO_SOBRE;

  /** Area del icono de categoria: la zona maxima que dejo la placa. */
  protected readonly cajaCategoria = CAJA_ZONA_LOGO;

  /**
   * URL del logo de la marca (PNG/JPG/SVG/WebP).
   */
  readonly logoUrl = input<string | null>(null);

  /**
   * Nombre de la marca.
   */
  readonly nombre = input<string | null>(null);

  /**
   * Categoría de la carta/sobre. Si está presente, muestra el icono de categoría.
   */
  readonly categoria = input<CategoriaSobre | null>(null);

  readonly variante = input<VarianteSobreMarca>('oscuro');
  readonly tamanio = input<TamanioSobreMarca>('md');

  readonly clickeable = input<boolean, unknown>(false, { transform: booleanAttribute });

  readonly accion = output<void>();

  private readonly urlCargada = signal<string | null>(null);
  private readonly urlFallida = signal<string | null>(null);

  /** Proporcion real (ancho / alto) del logo, medida una vez cargado. */
  private readonly medidaLogo = signal<{ url: string; proporcion: number } | null>(null);

  protected readonly esCategoria = computed(() => !!this.categoria());

  protected readonly iconoCategoria = computed(() => {
    const cat = this.categoria();
    return cat ? ICONOS_CATEGORIA[cat] : null;
  });

  protected readonly cargando = computed(() => {
    const url = this.logoUrl();
    return !!url && this.urlCargada() !== url;
  });

  protected readonly fallo = computed(() => {
    const url = this.logoUrl();
    return !!url && this.urlFallida() === url;
  });

  protected readonly conLogo = computed(() => !!this.logoUrl() && !this.fallo());

  /**
   * Caja del logo: respeta su proporcion real, entra en la zona maxima y
   * queda centrada sobre el pliegue. Hasta medirse, se asume cuadrada.
   */
  protected readonly cajaLogo = computed(() => {
    const medida = this.medidaLogo();
    const proporcion = medida && medida.url === this.logoUrl() ? medida.proporcion : 1;
    return calcularCajaLogo(proporcion);
  });

  /** Silueta cartoon de la placa, recortada a la proporcion real del logo. */
  protected readonly trazoPlaca = computed(() => construirTrazoPlaca(this.cajaLogo()));

  protected readonly etiqueta = computed(() => {
    const cat = this.categoria();
    if (cat) {
      return `Sobre de ${ETIQUETAS_CATEGORIA[cat]}`;
    }
    const nombre = this.nombre()?.trim();
    return nombre ? `Sobre de ${nombre}` : ETIQUETA_SOBRE_POR_DEFECTO;
  });

  protected readonly nombreVisible = computed(() => {
    const cat = this.categoria();
    if (cat) {
      return ETIQUETAS_CATEGORIA[cat];
    }
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

  private punteroPresente = false;
  private cuadroPendiente = false;

  /**
   * Traduce la posicion del puntero a variables CSS del `<button>`. No toca
   * signals ni el template: el navegador solo recompone transform y opacity.
   */
  protected moverPuntero(evento: PointerEvent): void {
    this.punteroPresente = true;
    if (this.cuadroPendiente) {
      return;
    }

    const objetivo = evento.currentTarget as HTMLElement;
    const { clientX, clientY } = evento;
    this.cuadroPendiente = true;

    requestAnimationFrame(() => {
      this.cuadroPendiente = false;
      if (!this.punteroPresente) {
        return;
      }

      const caja = objetivo.getBoundingClientRect();
      if (!caja.width || !caja.height) {
        return;
      }

      const x = acotar(((clientX - caja.left) / caja.width) * 100, 0, 100);
      const y = acotar(((clientY - caja.top) / caja.height) * 100, 0, 100);

      objetivo.style.setProperty('--puntero-x', `${x.toFixed(1)}%`);
      objetivo.style.setProperty('--puntero-y', `${y.toFixed(1)}%`);
      objetivo.style.setProperty('--rotar-y', `${(((x - 50) / 50) * INCLINACION_MAXIMA).toFixed(2)}deg`);
      objetivo.style.setProperty('--rotar-x', `${((-(y - 50) / 50) * INCLINACION_MAXIMA).toFixed(2)}deg`);
      objetivo.style.setProperty('--fondo-x', `${(37 + (x / 100) * 26).toFixed(1)}%`);
      objetivo.style.setProperty('--fondo-y', `${(37 + (y / 100) * 26).toFixed(1)}%`);
    });
  }

  protected soltarPuntero(evento: PointerEvent): void {
    this.punteroPresente = false;
    const objetivo = evento.currentTarget as HTMLElement;
    for (const variable of VARIABLES_PUNTERO) {
      objetivo.style.removeProperty(variable);
    }
  }

  constructor() {
    // Mide la proporcion real del logo para dibujarlo ajustado, sin blanco sobrante.
    effect(() => {
      const url = this.logoUrl();
      if (!url || typeof Image === 'undefined') {
        return;
      }

      const imagen = new Image();
      imagen.onload = () => {
        const proporcion = imagen.naturalWidth / imagen.naturalHeight;
        this.medidaLogo.set({
          url,
          proporcion: Number.isFinite(proporcion) && proporcion > 0 ? proporcion : 1,
        });
      };
      imagen.src = url;
    });
  }
}