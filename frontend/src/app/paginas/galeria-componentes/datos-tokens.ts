/**
 * Datos de la seccion de tokens.
 *
 * Todo se declara aca para que la seccion sea solo presentacion y el agregado
 * de un token sea una linea. Las muestras resuelven el color contra la variable
 * CSS cruda para demostrar que el token existe en los dos modos; la utilidad de
 * Tailwind se muestra aparte porque la capa 3 expone el token con su prefijo.
 *
 * No hay flag de "sin mapeo": la galeria se escribio contra un `@theme inline`
 * al que le faltaban `marca-acento-activo`, `texto-link-hover` y los cinco
 * `-sobre`, y por eso `bg-marca-acento-activo`, `text-texto-link-hover` y
 * `text-atencion-sobre` eran clases muertas. Ya estan mapeadas.
 *
 * Ojo con la diferencia entre estar mapeado y estar emitido: Tailwind v4 solo
 * genera la utilidad si alguna plantilla la usa. Registrar un token lo hace
 * disponible, no lo mete en el bundle.
 */
export interface MuestraColor {
  /** Nombre del token en la capa 2 de `styles.css`. */
  readonly token: string;
  /** Utilidad de Tailwind equivalente. */
  readonly utilidad: string;
  /** Para que se ve el color en contexto. */
  readonly uso: string;
}

const color = (token: string, utilidad: string, uso: string): MuestraColor => ({
  token,
  utilidad,
  uso,
});

export const PALETA_SEMANTICA: readonly MuestraColor[] = [
  color('--fondo-superficie', 'bg-superficie', 'Tarjetas y superficies'),
  color('--fondo-elevado', 'bg-elevado', 'Hover y dropdowns'),
  color('--fondo-hundido', 'bg-hundido', 'Huecos y campos inactivos'),
  color('--marca-primaria', 'bg-marca-primaria', 'Accion principal'),
  color('--marca-primaria-suave', 'bg-marca-primaria-suave', 'Seleccion'),
  color('--marca-acento', 'bg-marca-acento', 'Foco y acentos calidos'),
  color('--marca-acento-activo', 'bg-marca-acento-activo', 'Pulsacion de la marca'),
  color('--marca-sobre-primaria', 'text-marca-sobre-primaria', 'Texto sobre la marca'),
  color('--texto-primario', 'text-texto-primario', 'Cuerpo principal'),
  color('--texto-secundario', 'text-texto-secundario', 'Texto de apoyo'),
  color('--texto-apagado', 'text-texto-apagado', 'Metadatos'),
  color('--texto-link', 'text-texto-link', 'Enlaces'),
  color('--texto-link-hover', 'text-texto-link-hover', 'Enlaces pulsados'),
  color('--borde-default', 'border-borde-default', 'Separadores'),
  color('--borde-fuerte', 'border-borde-fuerte', 'Bordes con presencia'),
  color('--borde-foco', 'outline-borde-foco', 'Anillo de foco'),
] as const;

/**
 * Los seis tokens del sobre de cartas, que consume `app-sobre-marca`.
 *
 * No van en `PALETA_SEMANTICA` porque no son superficies de la app: el sobre es
 * un elemento de marca, con su propio juego de color por variante. La seccion
 * del sobre los muestra junto a los sobres reales, que es donde se verifica que
 * el mapeo de `@theme inline` existe.
 */
export const COLORES_SOBRE_MARCA: readonly MuestraColor[] = [
  color('--sobre-cuerpo-oscuro', 'bg-sobre-cuerpo-oscuro', 'Sobre oscuro: frente verde'),
  color('--sobre-detalle-oscuro', 'bg-sobre-detalle-oscuro', 'Sobre oscuro: grafotipo y anillo'),
  color('--sobre-sello-oscuro', 'bg-sobre-sello-oscuro', 'Sobre oscuro: placa del logo'),
  color('--sobre-cuerpo-claro', 'bg-sobre-cuerpo-claro', 'Sobre claro: frente crema'),
  color('--sobre-detalle-claro', 'bg-sobre-detalle-claro', 'Sobre claro: grafotipo y anillo'),
  color('--sobre-sello-claro', 'bg-sobre-sello-claro', 'Sobre claro: placa del logo'),
] as const;

export interface VarianteFeedback {
  readonly nombre: string;
  /** Sufijo del token: `exito`, `exito-fondo`, `exito-sobre`… */
  readonly sufijo: string;
  /** Utilidad de Tailwind equivalente. */
  readonly utilidad: string;
  /**
   * Sufijo del token con el que la capa 2 combina este color como texto.
   * Es lo que hace visible la escala: cada token base tiene un `-sobre`, y cada
   * tinte tiene un `-texto`.
   */
  readonly contraste: string;
  readonly uso: string;
}

export interface EstadoFeedback {
  readonly id: string;
  readonly nombre: string;
  readonly variantes: readonly VarianteFeedback[];
}

/**
 * Los cinco tokens por estado que define la capa 2, y la utilidad que expone
 * cada uno en la capa 3.
 *
 * `contraste` es el token con el que la propia escala se combina, asi que la
 * muestra resuelve el color con `var()` crudo en vez de con la utilidad: si
 * faltara el mapeo, la muestra igual seria veraz.
 */
const VARIANTES_ESTADO = [
  { nombre: 'base', sufijo: '', utilidad: 'bg-{id}', contraste: '-sobre', uso: 'Iconos y badges de alto impacto' },
  { nombre: 'fondo', sufijo: '-fondo', utilidad: 'bg-{id}-fondo', contraste: '-texto', uso: 'Tinte suave en tarjetas' },
  { nombre: 'borde', sufijo: '-borde', utilidad: 'border-{id}-borde', contraste: '-texto', uso: 'Contorno de la superficie' },
  { nombre: 'texto', sufijo: '-texto', utilidad: 'text-{id}-texto', contraste: '-fondo', uso: 'Texto sobre el tinte suave' },
  { nombre: 'sobre', sufijo: '-sobre', utilidad: 'text-{id}-sobre', contraste: '', uso: 'Texto sobre el color base' },
] as const;

const estado = (id: string, nombre: string): EstadoFeedback => ({
  id,
  nombre,
  variantes: VARIANTES_ESTADO.map((variante) => ({
    ...variante,
    sufijo: `${id}${variante.sufijo}`,
    contraste: `${id}${variante.contraste}`,
    utilidad: variante.utilidad.replace('{id}', id),
  })),
});

export const ESCALA_FEEDBACK: readonly EstadoFeedback[] = [
  estado('exito', 'Exito'),
  estado('error', 'Error'),
  estado('advertencia', 'Advertencia'),
  estado('atencion', 'Atencion'),
  estado('info', 'Informacion'),
] as const;

export interface MuestraTipografia {
  readonly token: string;
  readonly utilidad: string;
  readonly familia: string;
  readonly ejemplo: string;
}

export const TIPOGRAFIAS: readonly MuestraTipografia[] = [
  {
    token: '--fuente-titulo',
    utilidad: 'font-titulo',
    familia: 'Russo One',
    ejemplo: 'COLECCIONA Y JUGA',
  },
  {
    token: '--fuente-cuerpo',
    utilidad: 'font-cuerpo',
    familia: 'Merriweather',
    ejemplo: 'Texto de lectura para parrafos y descripciones largas de la app.',
  },
  {
    token: '--fuente-interfaz',
    utilidad: 'font-interfaz',
    familia: 'system-ui',
    ejemplo: 'Botones, formularios y tablas',
  },
] as const;

export interface MuestraRadio {
  readonly token: string;
  readonly utilidad: string;
  readonly valor: string;
}

export const RADIOS: readonly MuestraRadio[] = [
  { token: '--radio-sm', utilidad: 'rounded-sm', valor: '0.375rem' },
  { token: '--radio-md', utilidad: 'rounded-md', valor: '0.75rem' },
  { token: '--radio-lg', utilidad: 'rounded-lg', valor: '1.25rem' },
  { token: '--radio-pildora', utilidad: 'rounded-pildora', valor: '9999px' },
  { token: '--radio-circulo', utilidad: 'rounded-circulo', valor: '50%' },
] as const;

export interface MuestraSombra {
  readonly token: string;
  readonly utilidad: string;
}

export const SOMBRAS: readonly MuestraSombra[] = [
  { token: '--sombra-baja', utilidad: 'shadow-baja' },
  { token: '--sombra-media', utilidad: 'shadow-media' },
  { token: '--sombra-alta', utilidad: 'shadow-alta' },
  { token: '--sombra-brillo-verde', utilidad: 'shadow-brillo-verde' },
] as const;