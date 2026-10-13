import type { Carta, CategoriaCarta, RarezaCarta } from './carta.model';
import { ETIQUETA_CATEGORIA, ETIQUETA_RAREZA } from './carta.model';

/**
 * Datos mock del área de empresa.
 *
 * El área de empresa no es el panel interno de Falta Una: es el panel de las
 * marcas que se suscriben y crean álbumes. Para que todo el contenido sea
 * coherente, la empresa demo es una única marca real (Grido) que publica
 * varios álbumes dentro de su única categoría comercial (Gastronomía).
 *
 * Todo es dato de prueba para ver el look de las vistas: cuando el backend esté
 * listo, este archivo se reemplaza por la respuesta HTTP sin tocar los
 * componentes (misma forma de datos).
 */

/** Empresa (marca) que tiene la sesión iniciada. */
export interface EmpresaActual {
  readonly id: string;
  readonly nombre: string;
  /** Única categoría comercial de la empresa. */
  readonly categoria: CategoriaCarta;
  readonly categoriaEtiqueta: string;
}

export const EMPRESA_ACTUAL: EmpresaActual = {
  id: 'grido',
  nombre: 'Grido',
  categoria: 'gastronomia',
  categoriaEtiqueta: ETIQUETA_CATEGORIA.gastronomia,
};

/** Cantidad total de jugadores que participan de los álbumes de la empresa. */
export const TOTAL_USUARIOS_EMPRESA = 4580;

/** Estado de vigencia de un álbum: activo (se puede completar) o finalizado. */
export type EstadoAlbum = 'activo' | 'finalizado';

/** Tinte de acento que usa la tarjeta de un álbum (banda, cupón y CTA). */
export type TonoAlbum = 'violeta' | 'azul' | 'acento';

/** Colores de un tono, resueltos a los tokens semánticos del modo empresa. */
export interface TonoEmpresa {
  /** Color pleno: bandas, CTA y bordes de acento. */
  readonly fuerte: string;
  /** Velo del color: fondos suaves de chips e íconos. */
  readonly suave: string;
  /** Texto legible sobre `fuerte`. */
  readonly sobre: string;
}

export const TONO_EMPRESA: Record<TonoAlbum, TonoEmpresa> = {
  violeta: {
    fuerte: 'var(--marca-primaria)',
    suave: 'var(--marca-primaria-suave)',
    sobre: 'var(--marca-sobre-primaria)',
  },
  azul: {
    fuerte: 'var(--marca-secundaria)',
    suave: 'var(--marca-secundaria-suave)',
    sobre: 'var(--marca-sobre-secundaria)',
  },
  acento: {
    fuerte: 'var(--marca-acento)',
    suave: 'var(--marca-acento-suave)',
    sobre: 'var(--marca-sobre-acento)',
  },
};

/** Álbum (colección) creado por la empresa dentro de su única categoría. */
export interface AlbumEmpresa {
  readonly id: string;
  readonly nombre: string;
  readonly temporada: string;
  readonly estado: EstadoAlbum;
  /** Acento visual de la tarjeta del álbum. */
  readonly tono: TonoAlbum;
  /** De qué trata la colección (se muestra en la grilla y en el detalle). */
  readonly descripcion: string;
  /** Qué gana el jugador cuando completa todas las cartas del álbum. */
  readonly recompensa: string;
  readonly imagenPortada: string;
  readonly cartasIds: readonly string[];
  /** Jugadores que ya completaron la colección (para la tasa de completado). */
  readonly jugadoresCompletaron: number;
}

/** Reparto de cartas de un álbum según su rareza (medidor + leyenda). */
export interface RepartoRareza {
  readonly rareza: RarezaCarta;
  readonly etiqueta: string;
  readonly cantidad: number;
  readonly porcentaje: number;
  readonly color: string;
}

/** Métricas agregadas de un álbum (tarjeta de la grilla y encabezado del detalle). */
export interface ResumenAlbum {
  readonly totalCartas: number;
  readonly reparto: readonly RepartoRareza[];
  readonly favoritos: number;
  readonly intercambios: number;
  readonly porcentajeCompletado: number;
}

const IMAGEN_PRODUCTO = 'imagenes/grido.jpg';

/**
 * Atajo para declarar cartas de la marca sin repetir los campos fijos
 * (imagen, categoría y "obtenida"): la empresa posee todas sus cartas.
 */
function carta(
  id: string,
  nombre: string,
  rareza: RarezaCarta,
  ataque: number,
  defensa: number,
  imagenUrl: string = IMAGEN_PRODUCTO,
): Carta {
  return {
    id,
    nombre,
    imagenUrl,
    rareza,
    categoria: EMPRESA_ACTUAL.categoria,
    atributoIzquierdo: ataque,
    atributoDerecho: defensa,
    obtenida: true,
  };
}

/**
 * Cartas que la empresa incluye en sus álbumes. Todas pertenecen a la única
 * categoría de la empresa (`EMPRESA_ACTUAL.categoria`) y son productos de la
 * marca. Las imágenes son placeholders de `public/imagenes/`.
 */
export const CARTAS_EMPRESA: readonly Carta[] = [
  // ── Sabores de siempre ────────────────────────────────────────────────
  carta('g-001', 'Vainilla', 'comun', 11, 10),
  carta('g-002', 'Frutilla', 'comun', 12, 9),
  carta('g-003', 'Chocolate', 'comun', 12, 11),
  carta('g-004', 'Limón', 'comun', 10, 10),
  carta('g-005', 'Dulce de Leche', 'comun', 13, 11),
  carta('g-006', 'Durazno', 'comun', 11, 9),
  carta('g-007', 'Ananá', 'comun', 10, 11),
  carta('g-008', 'Crema del Cielo', 'rara', 16, 14),
  carta('g-009', 'Sambayón', 'rara', 15, 15),
  carta('g-010', 'Banana Split', 'rara', 17, 13),
  carta('g-011', 'Coco', 'rara', 15, 14),
  carta('g-012', 'Super Dulce de Leche', 'epicarta', 24, 22),
  carta('g-013', 'Tramontana', 'epicarta', 23, 25),
  carta('g-014', 'Dulce de Leche Granizado', 'legendaria', 32, 34),

  // ── Palitos y bombones ────────────────────────────────────────────────
  carta('g-015', 'Palito de Crema', 'comun', 11, 10),
  carta('g-016', 'Palito de Frutilla', 'comun', 10, 11),
  carta('g-017', 'Palito de Chocolate', 'comun', 12, 10),
  carta('g-018', 'Vasito Clásico', 'comun', 11, 11),
  carta('g-019', 'Cucurucho Simple', 'comun', 10, 12),
  carta('g-020', 'Cucurucho Doble', 'comun', 12, 11),
  carta('g-021', 'Palito Bombón', 'rara', 16, 15),
  carta('g-022', 'Bombón Escocés', 'rara', 17, 14),
  carta('g-023', 'Bombón Suizo', 'rara', 16, 16),
  carta('g-024', 'Bombón de Helado', 'rara', 15, 17),
  carta('g-025', 'Palito Almendrado', 'epicarta', 24, 23),
  carta('g-026', 'Bombón Crocante', 'epicarta', 25, 24),
  carta('g-027', 'Palito Doble Bombón', 'legendaria', 33, 35),

  // ── Postres y cafetería ───────────────────────────────────────────────
  carta('g-028', 'Café Expreso', 'comun', 10, 10),
  carta('g-029', 'Café con Leche', 'comun', 11, 10),
  carta('g-030', 'Capuchino', 'comun', 12, 11),
  carta('g-031', 'Milkshake de Vainilla', 'comun', 11, 12),
  carta('g-032', 'Milkshake de Frutilla', 'comun', 12, 12),
  carta('g-033', 'Alfajor Simple', 'comun', 13, 10),
  carta('g-034', 'Submarino', 'rara', 15, 14),
  carta('g-035', 'Capuchino Grand', 'rara', 16, 15),
  carta('g-036', 'Milkshake de Chocolate', 'rara', 17, 15),
  carta('g-037', 'Alfajor Grido', 'rara', 16, 16),
  carta('g-038', 'Milkshake de Dulce de Leche', 'epicarta', 23, 22),
  carta('g-039', 'Torta Helada', 'epicarta', 24, 22),
  carta('g-040', 'Copa Grido', 'legendaria', 34, 32),

  // ── Tentaciones premium ───────────────────────────────────────────────
  carta('g-041', 'Mascarpone', 'comun', 12, 11),
  carta('g-042', 'Almendrado', 'comun', 11, 12),
  carta('g-043', 'Marroc', 'comun', 13, 11),
  carta('g-044', 'Tiramisú', 'comun', 12, 12),
  carta('g-045', 'Chocotorta', 'comun', 13, 12),
  carta('g-046', 'Menta Granizada', 'comun', 11, 11),
  carta('g-047', 'Granizado', 'comun', 12, 10),
  carta('g-048', 'Americana', 'rara', 16, 15),
  carta('g-049', 'Red Velvet', 'rara', 17, 14),
  carta('g-050', 'Cheesecake', 'rara', 15, 16),
  carta('g-051', 'Brownie', 'rara', 16, 15),
  carta('g-052', 'Creme Brûlée', 'epicarta', 24, 23),
  carta('g-053', 'Balde Familiar', 'epicarta', 22, 26),
  carta('g-054', 'Copa Premium', 'epicarta', 25, 24),
  carta('g-055', 'Super Tramontana', 'legendaria', 35, 33),
];

/**
 * Álbumes de la empresa (todos de la misma categoría). Cada colección tiene 12
 * cartas o más, con más comunes que legendarias, y describe su recompensa.
 */
export const ALBUMES_EMPRESA: readonly AlbumEmpresa[] = [
  {
    id: 'sabores-de-siempre',
    nombre: 'Sabores de siempre',
    temporada: '2026',
    estado: 'activo',
    tono: 'violeta',
    descripcion: 'La colección fundacional: los sabores clásicos que nunca faltan en el mostrador.',
    recompensa: '20% de descuento en tu próximo kilo de helado',
    imagenPortada: IMAGEN_PRODUCTO,
    cartasIds: [
      'g-001',
      'g-002',
      'g-003',
      'g-004',
      'g-005',
      'g-006',
      'g-007',
      'g-008',
      'g-009',
      'g-010',
      'g-011',
      'g-012',
      'g-013',
      'g-014',
    ],
    jugadoresCompletaron: 1640,
  },
  {
    id: 'palitos-y-bombones',
    nombre: 'Palitos y bombones',
    temporada: '2025',
    estado: 'activo',
    tono: 'azul',
    descripcion: 'Palitos, bombones y cucuruchos para todos los gustos, del kiosco a la mesa.',
    recompensa: '2x1 en palitos durante toda la semana',
    imagenPortada: IMAGEN_PRODUCTO,
    cartasIds: [
      'g-015',
      'g-016',
      'g-017',
      'g-018',
      'g-019',
      'g-020',
      'g-021',
      'g-022',
      'g-023',
      'g-024',
      'g-025',
      'g-026',
      'g-027',
    ],
    jugadoresCompletaron: 1180,
  },
  {
    id: 'postres-y-cafeteria',
    nombre: 'Postres y cafetería',
    temporada: '2025',
    estado: 'finalizado',
    tono: 'acento',
    descripcion: 'Lo dulce de la cafetería: cafés, postres, tortas heladas y milkshakes.',
    recompensa: 'Un café con leche de regalo',
    imagenPortada: IMAGEN_PRODUCTO,
    cartasIds: [
      'g-028',
      'g-029',
      'g-030',
      'g-031',
      'g-032',
      'g-033',
      'g-034',
      'g-035',
      'g-036',
      'g-037',
      'g-038',
      'g-039',
      'g-040',
    ],
    jugadoresCompletaron: 890,
  },
  {
    id: 'tentaciones-premium',
    nombre: 'Tentaciones premium',
    temporada: '2024',
    estado: 'finalizado',
    tono: 'azul',
    descripcion: 'Sabores de autor y ediciones limitadas para los más golosos.',
    recompensa: 'Bombón escocés de edición limitada',
    imagenPortada: IMAGEN_PRODUCTO,
    cartasIds: [
      'g-041',
      'g-042',
      'g-043',
      'g-044',
      'g-045',
      'g-046',
      'g-047',
      'g-048',
      'g-049',
      'g-050',
      'g-051',
      'g-052',
      'g-053',
      'g-054',
      'g-055',
    ],
    jugadoresCompletaron: 520,
  },
];

/** Métricas de participación de una carta dentro de los álbumes. */
export interface EstadisticasCartaEmpresa {
  readonly usuariosQueLaTienen: number;
  readonly porcentajeUsuarios: number;
  readonly favoritos: number;
  readonly intercambios: number;
  readonly partidas: number;
}

/**
 * Peso de cada rareza sobre el total de jugadores: a mayor rareza, menos
 * jugadores poseen la carta (por eso abundan las comunes).
 */
const PESO_RAREZA: Record<RarezaCarta, number> = {
  comun: 0.94,
  rara: 0.62,
  epicarta: 0.4,
  legendaria: 0.24,
};

/** Cuánto se marca como favorita una carta según su rareza (las raras lucen más). */
const INTERES_RAREZA: Record<RarezaCarta, number> = {
  comun: 0.16,
  rara: 0.26,
  epicarta: 0.38,
  legendaria: 0.52,
};

/**
 * Construye las métricas de cada carta de forma determinística a partir de su
 * rareza y su posición, para no escribir a mano decenas de registros. Se
 * mantiene la misma forma de datos que devolvería el backend.
 */
function construirEstadisticas(cartas: readonly Carta[]): Record<string, EstadisticasCartaEmpresa> {
  const registro: Record<string, EstadisticasCartaEmpresa> = {};

  cartas.forEach((carta, indice) => {
    const variacion = 0.9 + ((indice * 37) % 21) / 100;
    const usuariosQueLaTienen = Math.min(
      Math.round(TOTAL_USUARIOS_EMPRESA * PESO_RAREZA[carta.rareza] * variacion),
      TOTAL_USUARIOS_EMPRESA,
    );
    const porcentajeUsuarios = Math.round((usuariosQueLaTienen / TOTAL_USUARIOS_EMPRESA) * 100);
    const interes = INTERES_RAREZA[carta.rareza];
    const favoritos = Math.round(
      usuariosQueLaTienen * interes * (0.85 + ((indice * 13) % 16) / 100),
    );
    const intercambios = Math.round(
      usuariosQueLaTienen * interes * (0.55 + ((indice * 7) % 14) / 100),
    );
    const partidas = Math.round(usuariosQueLaTienen * (1.1 + ((indice * 11) % 20) / 10));

    registro[carta.id] = {
      usuariosQueLaTienen,
      porcentajeUsuarios,
      favoritos,
      intercambios,
      partidas,
    };
  });

  return registro;
}

export const ESTADISTICAS_CARTA: Record<string, EstadisticasCartaEmpresa> =
  construirEstadisticas(CARTAS_EMPRESA);

/** Estadísticas en cero para una carta que todavía no tiene datos. */
export const SIN_ESTADISTICAS: EstadisticasCartaEmpresa = {
  usuariosQueLaTienen: 0,
  porcentajeUsuarios: 0,
  favoritos: 0,
  intercambios: 0,
  partidas: 0,
};

/** Orden ascendente de rareza (de común a legendaria). */
export const ORDEN_RAREZA: Record<RarezaCarta, number> = {
  comun: 0,
  rara: 1,
  epicarta: 2,
  legendaria: 3,
};

/** Rarezas de menor a mayor, para recorrer de forma estable. */
export const RAREZAS_ORDENADAS: readonly RarezaCarta[] = [
  'comun',
  'rara',
  'epicarta',
  'legendaria',
];

/**
 * Color de cada rareza: referencia a los tokens `--rareza-*` que ya usa el
 * tablero de estadísticas (barras de reparto, donut, leyendas).
 */
export const COLOR_RAREZA: Record<RarezaCarta, string> = {
  comun: 'var(--rareza-1)',
  rara: 'var(--rareza-2)',
  epicarta: 'var(--rareza-3)',
  legendaria: 'var(--rareza-4)',
};

/**
 * Calcula las métricas agregadas de un álbum (cartas, reparto por rareza,
 * favoritos, intercambios y tasa de completado). Función pura de los datos
 * mock, compartida por la grilla de empresa y la galería de componentes.
 */
export function calcularResumenAlbum(album: AlbumEmpresa): ResumenAlbum {
  const cartas = album.cartasIds
    .map((id) => CARTAS_EMPRESA.find((carta) => carta.id === id))
    .filter((carta): carta is Carta => carta !== undefined);

  const reparto = RAREZAS_ORDENADAS.map((rareza) => {
    const cantidad = cartas.filter((carta) => carta.rareza === rareza).length;
    return {
      rareza,
      etiqueta: ETIQUETA_RAREZA[rareza],
      cantidad,
      porcentaje: cartas.length === 0 ? 0 : Math.round((cantidad / cartas.length) * 100),
      color: COLOR_RAREZA[rareza],
    };
  }).filter((tramo) => tramo.cantidad > 0);

  const sumarEstadistica = (campo: 'favoritos' | 'intercambios'): number =>
    album.cartasIds.reduce((total, id) => total + (ESTADISTICAS_CARTA[id]?.[campo] ?? 0), 0);

  return {
    totalCartas: cartas.length,
    reparto,
    favoritos: sumarEstadistica('favoritos'),
    intercambios: sumarEstadistica('intercambios'),
    porcentajeCompletado: Math.round((album.jugadoresCompletaron / TOTAL_USUARIOS_EMPRESA) * 100),
  };
}
