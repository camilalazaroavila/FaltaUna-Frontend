import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SobreMarca } from '../../../../compartidos/componentes/sobre-marca/sobre-marca';
import type { TamanioSobreMarca, VarianteSobreMarca } from '../../../../compartidos/componentes/sobre-marca/sobre-marca';
import { CATEGORIAS_SOBRE, ETIQUETAS_CATEGORIA } from '../../../../modelos/categoria.model';
import type { CategoriaSobre } from '../../../../modelos/categoria.model';
import { ICONOS_CATEGORIA } from '../../../../compartidos/componentes/sobre-marca/iconos-categoria';
import type { IconoCategoria } from '../../../../compartidos/componentes/sobre-marca/iconos-categoria';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import { RegistroEventos } from '../../registro-eventos/registro-eventos';
import { crearRegistroEventos } from '../../registro-eventos';
import { COLORES_SOBRE_MARCA } from '../../datos-tokens';

/**
 * Logo vertical de muestra.
 *
 * Ninguna foto de `public/imagenes` es vertical (la mas apaisada es 1,66:1) y
 * la placa es casi cuadrada, asi que hace falta un caso real de contencion:
 * es el escenario donde un logo alto se reduce y deja aire a los lados. Es una
 * imagen, no una superficie de la app, asi que lleva su propio color en vez de
 * un token.
 */
const LOGO_VERTICAL_MUESTRA = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 200">' +
    '<rect x="2" y="2" width="36" height="196" rx="10" fill="#71717A"/>' +
    '<rect x="11" y="26" width="18" height="148" rx="6" fill="#FAFAFA"/>' +
    '</svg>',
)}`;

interface VarianteDeMuestra {
  readonly id: VarianteSobreMarca;
  /** Nombre del SVG de referencia del que sale la variante. */
  readonly origen: string;
  readonly detalle: string;
}

interface LogoDeMuestra {
  readonly marca: string;
  readonly logoUrl: string;
  /** Proporcion y medidas reales del archivo, para comparar de un vistazo. */
  readonly medidas: string;
}

/** Candidatos de color del icono, con su contraste medido sobre el blanco. */
interface CandidatoColorIcono {
  readonly id: string;
  /** Token que se pinta. El hex queda solo como texto de documentacion. */
  readonly token: string;
  /** Utilidad de Tailwind para el swatch. */
  readonly utilidad: string;
  readonly hex: string;
  readonly contraste: string;
  readonly nota: string;
}

/**
 * Geometria de la placa, replicada aqui para poder pintar el icono en un color
 * candidato sin tocar el componente.
 *
 * La comparacion de color NO puedehacerse overrumiendole una clase al
 * `app-sobre-marca`: la regla `:host(.sobre-marca--oscuro)` gana por
 * especificidad a cualquier herencia, asi que el override tendria que meter un
 * `@Input` de solo galeria en un componente compartido. Es peor duplicar 5
 * numeros que ensuciar la API: la placa es estable y esta copia es de lectura.
 */
const PLACA_COMPARACION = { x: 26, y: 82, ancho: 157, alto: 150, radio: 16 } as const;
const LADO_ICONO_COMPARACION = 104;

const centro = {
  x: PLACA_COMPARACION.x + PLACA_COMPARACION.ancho / 2,
  y: PLACA_COMPARACION.y + PLACA_COMPARACION.alto / 2,
} as const;

/** Mismo encuadre que `encajarIcono`, sobre la geometria de arriba. */
const transformarIcono = (icono: IconoCategoria): string => {
  const escala = Math.min(LADO_ICONO_COMPARACION / icono.ancho, LADO_ICONO_COMPARACION / icono.alto);

  return (
    `translate(${centro.x} ${centro.y}) ` +
    `scale(${escala.toFixed(4)}) ` +
    `translate(${-icono.ancho / 2} ${-icono.alto / 2})`
  );
};

/**
 * Cada celda de la comparacion es una categoria con su `transform` ya resuelto,
 * para que el template no tenga que hacer aritmetica de viewBox.
 */
interface MuestraIcono {
  readonly categoria: CategoriaSobre;
  readonly etiqueta: string;
  readonly viewBox: string;
  readonly transform: string;
  readonly trazos: readonly string[];
}

@Component({
  selector: 'app-seccion-sobre-marca',
  imports: [SobreMarca, TarjetaMuestra, RegistroEventos],
  templateUrl: './seccion-sobre-marca.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionSobreMarca {
  private readonly eventos = crearRegistroEventos();

  protected readonly registros = this.eventos.registros;
  protected readonly registrar = (evento: string): void => this.eventos.registrar(evento);

  protected readonly tokens = COLORES_SOBRE_MARCA;

  /** La verde va primera porque es la variante por defecto del componente. */
  protected readonly variantes: readonly VarianteDeMuestra[] = [
    { id: 'oscuro', origen: 'Paquete1 (por defecto)', detalle: 'cuerpo verde, letras crema' },
    { id: 'claro', origen: 'Paquete2', detalle: 'cuerpo crema, letras tinta' },
  ];

  /**
   * Los seis tamaños, del mas chico al mas grande. `fluid` cede el ancho al
   * padre, asi que conviene que sea el ultimo de la fila: se ve distinto al
   * resto y no tiene un ancho fijo que comparar.
   */
  protected readonly tamanios = ['xs', 'sm', 'md', 'lg', 'xl', 'fluid'] as const;

  /**
   * Ancho de cada tamaño en pixels, solo para el rotulo de la galeria. No es
   * una verdad del componente: el ancho real sale de la clase Tailwind de cada
   * `tamanio` y el texto va en unidades del `viewBox`.
   */
  protected readonly anchoDeTamanio: Record<TamanioSobreMarca, string> = {
    xs: '56 px',
    sm: '80 px',
    md: '112 px',
    lg: '176 px',
    xl: '240 px',
    fluid: '100% del padre',
  };

  /**
   * Logos reales de `public/imagenes` con sus medidas exactas: la placa es casi
   * cuadrada y el logo entra con `meet`, asi que cada proporción queda
   * centerpieceada y recortada con las esquinas de la placa.
   */
  protected readonly logos: readonly LogoDeMuestra[] = [
    { marca: 'Sprite', logoUrl: 'imagenes/Sprite.png', medidas: '1,66:1 · 713×429' },
    { marca: 'Coca-Cola', logoUrl: 'imagenes/cocacola.jpg', medidas: '1,43:1 · 500×350' },
    { marca: 'Zara', logoUrl: 'imagenes/zara.jpg', medidas: '1,43:1 · 1000×700' },
    { marca: 'Zara', logoUrl: 'imagenes/zara.png', medidas: '1,43:1 · 662×463' },
    { marca: 'McDonalds', logoUrl: 'imagenes/McDonalds.jpg', medidas: '1:1 · 447×447' },
    { marca: 'Sony', logoUrl: 'imagenes/sony.png', medidas: '1:1 · 447×447' },
    { marca: 'Lego', logoUrl: 'imagenes/lego.png', medidas: '1:1 · 225×225 · PNG con alfa' },
    { marca: 'Google', logoUrl: 'imagenes/google.jpg', medidas: '1:1 · 900×900' },
    { marca: 'Vertical (muestra)', logoUrl: LOGO_VERTICAL_MUESTRA, medidas: '0,2:1 · SVG' },
  ];

  /** Las seis categorias del catalogo, en el orden en que se quieren ver. */
  protected readonly categorias: readonly CategoriaSobre[] = CATEGORIAS_SOBRE;

  protected readonly etiquetas = ETIQUETAS_CATEGORIA;

  /**
   * Los dos candidatos de color del icono.
   *
   * Los ratios estan medidos contra el blanco de la placa (`#FFFFFF`), que es el
   * fondo real del icono. Para un grafico la WCAG 1.4.11 pide 3:1 y no 4,5:1
   * como el texto, asi que los dos candidatos pasan: la eleccion es de
   * jerarquia visual, no de accesibilidad.
   */
/**
 * Candidatos de color del icono, con su contraste medido sobre el blanco.
 *
 * Los ratios estan medidos contra el blanco de la placa (`--sobre-sello-*`), que
 * es el fondo real del icono. Para un grafico la WCAG 1.4.11 pide 3:1 y no 4,5:1
 * como el texto, asi que los dos candidatos pasan: la eleccion es de jerarquia
 * visual, no de accesibilidad.
 *
 * El teal entra por `--texto-sobre-claro` y no por `--color-teal-profundo`
 * porque los primitivos de la capa 1 no estan mapeados en `@theme inline`: no
 * existe `bg-teal-profundo`, y un swatch con esa clase se veria transparente sin
 * avisar. El valor al que resuelve es el mismo en las dos variantes.
 */
protected readonly candidatosColor: readonly CandidatoColorIcono[] = [
  {
    id: 'verde',
    token: '--sobre-icono-oscuro',
    utilidad: 'bg-sobre-icono-oscuro',
    hex: '#709176',
    contraste: '3,5:1',
    nota: 'Verde del sobre. Es el tono de familia y el que acompaña al grafotipo.',
  },
  {
    id: 'teal',
    token: '--texto-sobre-claro',
    utilidad: 'bg-texto-sobre-claro',
    hex: '#0A2E36',
    contraste: '12,9:1',
    nota: 'Teal de la marca. Maximo contraste, pero se separa del grafotipo.',
  },
];

  /** Iconos con su `transform` resuelto, para la comparacion de color. */
  protected readonly iconos: readonly MuestraIcono[] = CATEGORIAS_SOBRE.map((categoria) => {
    const datos = ICONOS_CATEGORIA[categoria];

    return {
      categoria,
      etiqueta: ETIQUETAS_CATEGORIA[categoria],
      viewBox: `0 0 ${datos.ancho} ${datos.alto}`,
      transform: transformarIcono(datos),
      trazos: datos.trazos,
    };
  });

  /** Geometria de la placa para la comparacion de color. */
  protected readonly placaComparacion = PLACA_COMPARACION;

  /**
   * Margen interno vigente, con las tres alternativas que se midieron.
   *
   * El valor vivo es el que usa el componente; los otros dos quedan documentados
   * porque la eleccion se tomo por captura y volver a derivarla seria volver a
   * medir. Los porcentajes son sobre el ancho de la placa.
   */
  protected readonly margenes: readonly { readonly u: number; readonly pct: string; readonly nota: string }[] = [
    { u: 12, pct: '7,6%', nota: 'Vigente. Recorta al 5% de los archivos ya ajustados.' },
    { u: 8, pct: '5,1%', nota: 'Logo visiblemente mas grande; las esquinas ya rozan el corte.' },
    { u: 6, pct: '3,8%', nota: 'Maximo tamano, pero el logo toca el borde de la placa.' },
  ];
}