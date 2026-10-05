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
import { ETIQUETAS_CATEGORIA } from '../../../modelos/categoria.model';
import type { CategoriaSobre } from '../../../modelos/categoria.model';
import { ICONOS_CATEGORIA } from './iconos-categoria';
import type { IconoCategoria } from './iconos-categoria';

/** `oscuro` es el sobre verde de cancha (Paquete1), `claro` el crema (Paquete2). */
export type VarianteSobreMarca = 'oscuro' | 'claro';

/**
 * Anchos en rem, no alturas: el sobre es vertical (viewBox `208.67 x 340.93`)
 * y la altura sale de la proporcion intrinseca del SVG, que nunca se deforma.
 *
 * `xs` y `xl` son los extremos reales del rango y `fluid` cede el ancho al
 * padre (`w-full`), que es lo que necesita una ficha de colección que ocupa
 * todo el ancho disponible.
 */
export type TamanioSobreMarca = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'fluid';

const CLASES_BASE = [
  'rounded-md',
  'transition-transform duration-200 ease-out',
  'motion-reduce:transition-none motion-reduce:transform-none',
].join(' ');

/**
 * El hover y el anillo de foco viven en el elemento interactivo (el `<button>`
 * interno), no en el host: el que recibe el foco es el control, y un
 * `focus-visible` en el ancestro no matchea nunca.
 *
 * NO lleva `shadow-media`: ese `box-shadow` sigue la caja del `<button>`, que es
 * un rectangulo, y el sobre es una silueta. Alrededor del sobre solo se quiere
 * el aura, que si sigue el contorno real del envelope. La sombra de elevation se
 * deja para superficies rectangulares.
 *
 * El modo visual no lleva ninguna de estas clases, para que el sobre no
 * sugiera que responde a un clic. `habilitado` es el mismo candado que usa
 * `app-boton`.
 */
const CLASES_INTERACTIVAS = [
  'habilitado:cursor-pointer',
  'habilitado:hover:-translate-y-0.5',
  'habilitado:active:scale-[0.97]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco',
].join(' ');

/**
 * Ancho de cada tamano. `sm`, `md` y `lg` conservan los valores que ya tenian
 * para no cambiar el aspecto de lo que ya se ve en pantalla.
 */
const CLASES_TAMANIO: Record<TamanioSobreMarca, string> = {
  xs: 'w-14',
  sm: 'w-20',
  md: 'w-28',
  lg: 'w-44',
  xl: 'w-60',
  fluid: 'w-full',
};

/**
 * Tamanos en los que el nombre de la marca no se dibuja.
 *
 * El texto vive en unidades del `viewBox` y escala con el sobre, asi que a
 * `xs` (56 px de ancho) el nombre mide ~4 px y a `sm` (80 px) ~5,7 px: no se
 * leen. Dibujarlos igual los convierte en una mancha gris, que es peor que no
 * dibujarlos. El nombre completo sigue en el `aria-label`, que es donde un
 * lector de pantalla lo encuentra, y el logo ya lleva la marca a escala
 * legible en cualquier tamano.
 *
 * `md` (112 px) ya da ~8 px, que es el piso accepted: el recorte a 16
 * caracteres sigue impidiendo que el texto se salga del frente.
 */
const TAMANOS_SIN_NOMBRE: readonly TamanioSobreMarca[] = ['xs', 'sm'];

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
 * Geometría de la placa, en unidades del `viewBox`.
 *
 * Ocupa el 86% del ancho útil del frente (márgenes parejos de ~12 a cada lado)
 * y queda centrada sobre el pliegue central, que es lo que la hace leer como una
 * etiqueta impresa y no como un sticker pegado.
 */
const PLACA = { x: 26, y: 82, ancho: 157, alto: 150, radio: 16 } as const;

/**
 * Aire entre el borde de la placa y el logo, en unidades del `viewBox`.
 *
 * PROVISIONAL a 12, a la espera de la comparación de la galería: 12u ≈ 7,6% del
 * ancho de la placa y deja pasar el recorte al 5% de los archivos ya ajustados;
 * 6u y 8u hacen el logo visiblemente más grande, con el riesgo de que las
 * esquinas redondeadas muerdan la marca.
 *
 * El radio del recorte se deriva de este valor en vez de fijarse aparte: es el
 * radio interior de la misma placa, y a 12u da 4u, a 8u da 8u.
 */
const MARGEN_LOGO = 8;

/** �?rea en la que se dibuja el logo, ya con el aire interno aplicado. */
const AREA_LOGO = {
  x: PLACA.x + MARGEN_LOGO,
  y: PLACA.y + MARGEN_LOGO,
  ancho: PLACA.ancho - MARGEN_LOGO * 2,
  alto: PLACA.alto - MARGEN_LOGO * 2,
  radio: PLACA.radio - MARGEN_LOGO,
} as const;

/**
 * Caja cuadrada en la que entra el icono de categoría, y su centro.
 *
 * Los seis SVG de diseño tienen `viewBox` distintos (de 0,89:1 a 1,21:1). Sin
 * esta normalización, cada uno se escalaría a su propio tamaño y el más alto
 * parecería un 20% más grande que el más bajo. La caja es algo menor que el
 * área del logo porque un icono tiene aire propio y no necesita el de un
 * wordmark.
 */
const LADO_ICANO = 104;
const CENTRO_PLACA = {
  x: PLACA.x + PLACA.ancho / 2,
  y: PLACA.y + PLACA.alto / 2,
} as const;

/**
 * `transform` que mete un icono de `viewBox` propio dentro de la caja cuadrada.
 *
 * Es el equivalente SVG de `preserveAspectRatio="xMidYMid meet"` en un grupo
 * anidado: `min` de las dos escalas preserva la proporción (el icono nunca se
 * deforma) y las dos translaciones lo dejan centrado en la placa. El `d` de cada
 * icono sigue en su propio sistema de coordenadas, así que los archivos no
 * necesitan ni `width` ni `height` modificados.
 */
const encajarIcono = (icono: IconoCategoria): string => {
  const escala = Math.min(LADO_ICANO / icono.ancho, LADO_ICANO / icono.alto);

  return (
    `translate(${CENTRO_PLACA.x} ${CENTRO_PLACA.y}) ` +
    `scale(${escala.toFixed(4)}) ` +
    `translate(${-icono.ancho / 2} ${-icono.alto / 2})`
  );
};

/**
 * Los cuatro `path` del cuerpo, exactamente los de `Paquete1.svg` / `Paquete2.svg`.
 *
 * Vive en una constante y no en el markup porque el aura necesita la misma
 * silueta: si el `d` estuviera escrito dos veces, un retoque del arte dejaria el
 * halo desalineado del sobre sin que nada lo delatara.
 */
const CUERPO_SOBRE = [
  'M195.39,156.79V271.91a9.61,9.61,0,0,1-9.61,9.6H23.29a9.61,9.61,0,0,1-9.61-9.61V156.79C83.92,236.55,121.63,79.23,195.39,156.79Z',
  'M13.68,156.79V41.68a9.61,9.61,0,0,1,9.61-9.61H185.78a9.61,9.61,0,0,1,9.61,9.61V156.79C121,166.49,86.66,280.13,13.68,156.79Z',
  'M200.72,161.64,200.56,25H7.79L8,150.77,0,141.52V15.6c77-21.84,145.8-19.74,208.67,0V170.89Z',
  'M8,150.77,8.11,287.4H200.88l-.16-125.76,7.95,9.25V323.56C137.7,347,68.18,346.44,0,323.56v-182Z',
] as const;

/** `viewBox` del SVG. El centro de esta caja es el origen de la escala de cada
 * halo (`transform-box: view-box` + `transform-origin: 50% 50%`), de modo que
 * los tres anillos crecen parejo en lugar de correr hacia una esquina. Tambien
 * fija la proporcion del sobre: el ancho lo elige el tamano y la altura sale de
 * aqui, asi que las medidas viven en un unico lugar. */
const VIEWBOX = { ancho: 208.67, alto: 340.93 } as const;

/**
 * Relleno del hueco entre paneles, solo para la silueta del aura.
 *
 * El arte fuente dibuja el sobre como cuatro paneles separados y deja un hueco
 * de ~5,8 unidades entre la banda exterior y los paneles interiores, por donde se
 * ve el fondo de la pagina. Es caracteristico de `Paquete1.svg` / `Paquete2.svg`,
 * no de este componente, asi que el sobre en reposo lo conserva.
 *
 * El aura, en cambio, no puede: por ese hueco se veria el halo slicing el sobre
 * en cuatro tiras. Este rect cierra el hueco con el mismo borde de los paneles
 * (x 7,79 / 200,88 son las líneas interiores de la banda; y 25 / 287,4 sus
 * filetes horizontales), y verificado por relleno por inundacion cubre el 100%
 * del hueco.
 *
 * Se dibuja FUERA de los `<use>` escalados y sin transformar. Escalado, a partir
 * de 1,12 asomaria por la esquina superior izquierda y el halo ganaria un borde
 * recto; fijo, su contorno coincide siempre con el de un panel del cuerpo, que
 * no se escala, asi que no puede verse ni asomar.
 */
const RELLENO_ANILLO = { x: 7.79, y: 25, ancho: 193.09, alto: 262.4 } as const;

/**
 * Cada sobre necesita un `id` distinto para su `<clipPath>` y para su silueta del
 * aura: varias placas en pantalla (un `@for` de la galeria, una grilla de
 * colecciones) no pueden compartirlo, porque el `url(#id)` resolveria siempre al
 * primero. El contador es de modulo, monotono y sin dependencias.
 */
let instancias = 0;

/**
 * Retardo de arranque de cada anillo del aura, en milisegundos.
 *
 * Los tres anillos comparten una sola animacion y se separan en el tiempo: en
 * cualquier instante hay uno recien salido, otro en plenitud y otro apagandose,
 * que es lo que produce el latido del halo en vez de tres anillos que se
 * encienden y apagan a la vez.
 */
const RETARDOS_AURA = [0, 800, 1600] as const;

/** Duracion del ciclo completo de un anillo. */
const DURACION_AURA = 2400;

/**
 * Anillo del aura ya resuelto.
 *
 * Solo el retardo: escala y opacidad viven en los `@keyframes` como
 * `transform` y `opacity`, las dos unicas propiedades que se animan aqui. Nada de
 * `fill`, `filter` ni `stroke` animados.
 */
interface AnilloAura {
  readonly retardo: number;
}

const anillosAura: readonly AnilloAura[] = RETARDOS_AURA.map((retardo) => ({ retardo }));

/**
 * Tamanho de letra del nombre de la marca, en unidades del `viewBox`.
 *
 * Con el ancho del sobre en pixeles, el texto mide `FUENTE_NOMBRE * ancho / 208.67`:
 * ~8 px en `md`, ~12,6 px en `lg` y ~17 px en `xl`.
 */
const FUENTE_NOMBRE = 15;

/**
 * Sobres de cartas con el logo de una marca o el icono de una categoria en el
 * centro.
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
 * Hay tres tipos de contenido y se eligen por prioridad, no por exclusion:
 * el logo de la marca si hay `logoUrl`, el icono de la categoria si hay
 * `categoria`, y las letras "FALTA UNA" originales si no hay ninguna de las dos.
 * Las letras ocupan el frente completo, por eso no conviven con el sello.
 * El logo no lleva ningun `mask` ni gradiente, y el icono tampoco: los unicos
 * `id` del SVG son el del recorte de la placa y el de la silueta del aura, y
 * ambos son unicos por instancia.
 */
@Component({
  selector: 'app-sobre-marca',
  imports: [NgTemplateOutlet],
  templateUrl: './sobre-marca.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.sobre-marca--oscuro]': 'variante() === "oscuro"',
    '[class.sobre-marca--claro]': 'variante() === "claro"',
    '[class.sobre-marca--activo]': 'clickeable()',
  },
  styles: `
    /* El host aporta el layout y la variante: las variables locales bajan
       por cascada hasta las partes del SVG, asi que cada grupo escribe su fill
       una sola vez.

       El host deja ver lo que se sale de su caja: el aura vive detrás del cuerpo
       y se expande mas alla del viewBox, asi que sin esto el borde del halo se
       cortaria justo contra el limite del elemento.

       OJO con el alcance: la variante tiene que usar :host(...). Escrita suelta,
       Angular compila ".sobre-marca--oscuro" como ".sobre-marca--oscuro[
       _ngcontent-xxx]", y el host nunca lleva _ngcontent (lleva _nghost): la
       regla no matchea, las tres variables quedan sin definir y todos los fill
       caen al valor inicial, que es negro. */
    :host {
      display: inline-flex;
      overflow: visible;
    }

    :host(.sobre-marca--oscuro) {
      --sobre-cuerpo-local: var(--sobre-cuerpo-oscuro);
      --sobre-detalle-local: var(--sobre-detalle-oscuro);
      --sobre-sello-local: var(--sobre-sello-oscuro);
      --sobre-icono-local: var(--sobre-icono-oscuro);
      --sobre-aura-local: var(--sobre-aura-oscuro);
      --sobre-placa-borde-local: var(--sobre-placa-borde-oscuro);
      --sobre-nombre-local: var(--sobre-nombre-oscuro);
    }

    :host(.sobre-marca--claro) {
      --sobre-cuerpo-local: var(--sobre-cuerpo-claro);
      --sobre-detalle-local: var(--sobre-detalle-claro);
      --sobre-sello-local: var(--sobre-sello-claro);
      --sobre-icono-local: var(--sobre-icono-claro);
      --sobre-aura-local: var(--sobre-aura-claro);
      --sobre-placa-borde-local: var(--sobre-placa-borde-claro);
      --sobre-nombre-local: var(--sobre-nombre-claro);
    }

    svg {
      overflow: visible;
    }

    .sobre__cuerpo {
      fill: var(--sobre-cuerpo-local);
    }

    .sobre__letras {
      fill: var(--sobre-detalle-local);
    }

    .sobre__nombre {
      fill: var(--sobre-nombre-local);
    }

    .sobre__placa {
      fill: var(--sobre-sello-local);
      /* El borde no es decorativo: sin el, la placa blanca sobre el cuerpo crema
         de la variante clara queda en 1,09:1 y la insignia desaparece. El
         teal del sistema da 16,37:1 contra la placa y 4,68:1 contra el cuerpo
         verde, asi que el borde se lee en las dos variantes. El paint-order deja
         el trazo debajo del relleno para que no se coma el logo. */
      stroke: var(--sobre-placa-borde-local);
      stroke-width: 3;
      paint-order: stroke fill;
    }

    .sobre__icono {
      fill: var(--sobre-icono-local);
    }

    /* ------------------------------------------------------------------
       Aura

       Tres copias de la silueta del sobre completo, no de la placa ni del
       icono, escaladas desde el centro del viewBox y apagadas en loop. Se
       enciende al pasar el puntero o al enfocar el control, y solo entonces:
       en reposo el sobre es una pieza quieta.

       El grupo va antes de .sobre__cuerpo en el markup, asi que el halo queda
       detras del envelope y solo se ve la parte que asoma del contorno.

       Se usa :focus-within y no :focus-visible porque el segundo no matchea
       desde un ancestro (es la misma limitacion que obliga a que el anillo de
       foco del componente viva en el boton). Se acepta que el aura tambien
       aparezca al tabular sobre un control ya enfocado con raton: el
       companion 3:1 del anillo de foco es lo que distingue los dos casos.
    ------------------------------------------------------------------ */
    .sobre__aura {
      opacity: 0;
      transition: opacity 220ms ease-out;
      pointer-events: none;
    }

    :host(.sobre-marca--activo:hover) .sobre__aura,
    :host(.sobre-marca--activo:focus-within) .sobre__aura {
      opacity: 1;
    }

    /* El click achica el sobre y apaga el halo: si el aura siguiera encendida
       durante el :active, el escalado del boton la desalinearia del contorno. */
    :host(.sobre-marca--activo:active) .sobre__aura {
      opacity: 0;
      transition: none;
    }

    /* El color lo hereda el use al arbol de sombra que instancia: los path de
       la silueta no llevan fill propio. */
    .sobre__aura-anillo {
      fill: var(--sobre-aura-local);
      transform-box: view-box;
      transform-origin: 50% 50%;
      animation: sobre-aura ${DURACION_AURA}ms cubic-bezier(0.22, 0.61, 0.36, 1) infinite;
    }

    /* El rect que cierra el hueco entre paneles. Va sin escalar y por debajo del
       tope de los anillos: es un fondo, no un anillo. Con una opacidad propia se
       lee como halo pasando por detras y no como un panel de color. */
    .sobre__aura-cierre {
      fill: var(--sobre-aura-local);
      opacity: 0.45;
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

    /* Cada anillo nace y muere en opacidad 0 para que el reinicio del ciclo no
       se lea como un destello: lo que se ve es un halo que se expande y se
       apaga, nunca un corte. */
    @keyframes sobre-aura {
      0% {
        transform: scale(1);
        opacity: 0;
      }

      15% {
        opacity: 0.55;
      }

      100% {
        transform: scale(1.16);
        opacity: 0;
      }
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

      /* Sin transicion el aura aparece o desaparece de un golpe, que es el
         equivalente de un brillo estatico: el halo sigue estando, solo deja
         de interpolarse. Los anillos, en cambio, se congelan en su estado
         fijo: un loop de expansion es justamente el movimiento que hay que
         quitar. */
      .sobre__aura {
        transition: none;
      }

      .sobre__aura-anillo {
        animation: none;
        transform: scale(1.08);
        opacity: 0.28;
      }
    }

    /* El atributo \`data-movimiento="reducido"\` baja globalmente la duracion de
       toda animacion y la deja correr una sola vez, con lo cual los anillos
       terminarian en su estado final (\`opacity: 0\`) y el hover se quedaria sin
       halo. Por eso el brillo estatico se vuelve a declarar aca: mismo
       resultado que con la media query, pero sin depender de que el filtro
       global cambie de comportamiento. El selector es mas especifico que el
       \`[data-movimiento='reducido'] *\` global, asi que gana sin necesitar
       \`!important\` en las propiedades del brillo. */
    [data-movimiento='reducido'] .sobre__aura-anillo {
      animation: none !important;
      transform: scale(1.08);
      opacity: 0.28;
    }
  `,
})
export class SobreMarca {
  /** Numero de instancia: da la unicidad de los `id` internos del SVG. */
  private readonly numero = ++instancias;

  /** `id` del `<clipPath>` del area util: unico por instancia. */
  protected readonly idPlaca = `sobre-marca-placa-${this.numero}`;

  /** `id` de la silueta que los anillos del aura reutilizan con `<use>`. */
  protected readonly idSilueta = `sobre-marca-silueta-${this.numero}`;

  /** Trazos del cuerpo, expuestos al template para el sobre y su silueta. */
  protected readonly cuerpo = CUERPO_SOBRE;

  /**
   * `viewBox` del SVG, expuesto como atributo.
   *
   * Es lo que fija la proporcion del sobre y el centro desde el que crecen los
   * anillos del aura, asi que no puede quedar escrito a mano en el template
   * ademas de aqui.
   */
  protected readonly viewBox = `0 0 ${VIEWBOX.ancho} ${VIEWBOX.alto}`;

  /** Rect que cierra el hueco entre paneles en la silueta del aura. */
  protected readonly rellenoAnillo = RELLENO_ANILLO;

  /** Geometria de la placa, expuesta al template para el `rect` y el recorte. */
  protected readonly placa = PLACA;

  /** Area util de la placa, con el aire interno ya descontado. */
  protected readonly areaLogo = AREA_LOGO;

  /** Tamano de letra del nombre, en unidades del `viewBox`. */
  protected readonly fuenteNombre = FUENTE_NOMBRE;

  /**
   * Anillos del aura, con su retardo de arranque ya resuelto.
   *
   * Escala y opacidad no viajan por aca: son los `@keyframes` los que las
   * interpolan, para que el motor las ejecute en el hilo de composicion.
   */
  protected readonly anillosAura: readonly AnilloAura[] = anillosAura;

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

  /**
   * Categoria del sobre, de un catalogo cerrado de seis.
   *
   * El padre la resuelve con `categoriaDesdeNombre` cuando lo que tiene es el
   * `Categoria.Nombre` del backend. Un valor desconocido cae al sobre generico:
   * nunca hay un icono "de ultima hora" ni un hueco en la placa.
   */
  readonly categoria = input<CategoriaSobre | null>(null);

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

  /**
   * El logo de la marca le gana al icono de categoria: el logo es un archivo
   * que la marca subio y es la fuente de verdad de su identidad, mientras que la
   * categoria es una clasificacion. Solo cuando no hay logo (o el logo fallo)
   * entra el icono.
   */
  protected readonly conIcono = computed(() => !this.conLogo() && !!this.categoria());

  /** Trazos y escala del icono a dibujar; `null` si todavia no hay icono. */
  protected readonly icono = computed<{
    readonly trazos: readonly string[];
    readonly transform: string;
  } | null>(() => {
    const categoria = this.categoria();
    if (!categoria) {
      return null;
    }

    const datos: IconoCategoria = ICONOS_CATEGORIA[categoria];

    return { trazos: datos.trazos, transform: encajarIcono(datos) };
  });

  /**
   * El nombre accesible usa la marca si la hay, la categoria si no. El nombre
   * completo manda siempre sobre la categoria truncada a una palabra.
   */
  protected readonly etiqueta = computed(() => {
    const nombre = this.nombre()?.trim();
    if (nombre) {
      return `Sobre de ${nombre}`;
    }

    const categoria = this.categoria();

    return categoria ? `Sobre de ${ETIQUETAS_CATEGORIA[categoria]}` : ETIQUETA_SOBRE_POR_DEFECTO;
  });

  /**
   * Nombre tal como se dibuja, o `null` si no se dibuja.
   *
   * `null` cuando no hay nombre, cuando la marca ya esta en el logo, y tambien
   * en `xs` y `sm`, donde el texto seria ilegible. En los tres casos el nombre
   * completo sigue disponible en `etiqueta`, que es lo que lee el `aria-label`.
   */
  protected readonly nombreVisible = computed(() => {
    if (TAMANOS_SIN_NOMBRE.includes(this.tamanio())) {
      return null;
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
}