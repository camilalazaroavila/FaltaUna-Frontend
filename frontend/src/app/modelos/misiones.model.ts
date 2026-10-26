import { categoriaDesdeNombre, type CategoriaSobre } from './categoria.model';

/** Pestañas de la vista: cada misión pertenece a exactamente una. */
export const PERIODICIDADES = ['diaria', 'semanal', 'permanente'] as const;
export type Periodicidad = (typeof PERIODICIDADES)[number];

export const ETIQUETAS_PERIODICIDAD: Record<Periodicidad, string> = {
  diaria: 'Diaria',
  semanal: 'Semanal',
  permanente: 'Permanente',
};

/**
 * Objetivos que hoy expone el backend. `partidas_jugadas` e `inicio_sesion`
 * se conservan en el union para las misiones que todavía no tienen mecánica.
 */
export type TipoMision =
  | 'inicio_sesion'
  | 'sobres_abiertos'
  | 'partidas_jugadas'
  | 'reclamar_sobre_diario'
  | 'obtener_cartas';

/**
 * `completada` = progreso al 100% y recompensa sin reclamar (el sobre se vuelve clickeable).
 * `reclamada` = recompensa ya acreditada (check verde).
 */
export type EstadoMision = 'en_curso' | 'completada' | 'reclamada';

/**
 * Sobre descrito con los mismos datos que consume `app-sobre-marca`.
 * Sirve tanto para la recompensa de una misión como para una fila del PT System.
 *
 * `sobreId` solo está presente en las recompensas reales del backend: permite
 * abrir exactamente el sobre acreditado y nunca confundirlo con el diario.
 */
export type SobreReferencia =
  | {
      readonly tipo: 'generico';
      readonly sobreId?: number;
      readonly nombre?: string;
    }
  | {
      readonly tipo: 'categoria';
      readonly sobreId?: number;
      readonly nombre?: string;
      readonly categoria: CategoriaSobre;
    }
  | {
      readonly tipo: 'marca';
      readonly sobreId?: number;
      readonly nombre: string;
      readonly logoUrl: string | null;
      /** Categoría a la que pertenece la marca: permite filtrar por categoría. */
      readonly categoria?: CategoriaSobre;
    };

export interface Mision {
  readonly id: number;
  readonly titulo: string;
  readonly tipo: TipoMision;
  readonly periodicidad: Periodicidad;
  readonly actual: number;
  readonly objetivo: number;
  readonly estado: EstadoMision;
  /** `null` cuando la misión aún no define recompensa (p. ej. las de partidas). */
  readonly recompensa: SobreReferencia | null;
  /** `false` para mecánicas que todavía no existen (se muestran como "Próximamente"). */
  readonly disponible: boolean;
}

/** Contrato de `GET /api/Misiones`. */
export type PeriodoMisionBackend = 'DIARIA' | 'SEMANAL';
export type ObjetivoMisionBackend =
  | 'ABRIR_SOBRES'
  | 'RECLAMAR_SOBRE_DIARIO'
  | 'OBTENER_CARTAS';
export type TipoSobreBackend = 'GENERAL' | 'CATEGORIA' | 'MARCA';

export interface SobreRecompensaRespuesta {
  readonly id: number;
  readonly nombre: string;
  readonly tipo: TipoSobreBackend;
  readonly categoria: string | null;
  readonly marca: string | null;
  readonly logoUrl: string | null;
}

export interface MisionRespuesta {
  readonly id: number;
  readonly nombre: string;
  readonly periodo: PeriodoMisionBackend;
  readonly objetivo: ObjetivoMisionBackend;
  readonly meta: number;
  readonly progreso: number;
  readonly completada: boolean;
  readonly reclamada: boolean;
  readonly recompensa: SobreRecompensaRespuesta;
  readonly cantidadRecompensa: number;
}

/** Contrato de `POST /api/Misiones/{id}/reclamar`. */
export interface RecompensaMisionRespuesta {
  readonly sobreId: number;
  readonly sobre: string;
  readonly cantidad: number;
}

const PERIODICIDAD_POR_PERIODO: Record<PeriodoMisionBackend, Periodicidad> = {
  DIARIA: 'diaria',
  SEMANAL: 'semanal',
};

const TIPO_POR_OBJETIVO: Record<ObjetivoMisionBackend, TipoMision> = {
  ABRIR_SOBRES: 'sobres_abiertos',
  RECLAMAR_SOBRE_DIARIO: 'reclamar_sobre_diario',
  OBTENER_CARTAS: 'obtener_cartas',
};

export const mapearPeriodicidad = (periodo: string): Periodicidad =>
  PERIODICIDAD_POR_PERIODO[periodo as PeriodoMisionBackend] ?? 'diaria';

export const mapearEstado = (completada: boolean, reclamada: boolean): EstadoMision => {
  if (reclamada) return 'reclamada';
  if (completada) return 'completada';
  return 'en_curso';
};

/**
 * Traduce el sobre que devuelve el backend al modelo que dibuja la tarjeta.
 * Si la categoría no se reconoce, cae a genérico en vez de romper el render.
 */
export const mapearRecompensa = (
  recompensa: SobreRecompensaRespuesta | null | undefined,
): SobreReferencia | null => {
  if (!recompensa) return null;

  const categoria = categoriaDesdeNombre(recompensa.categoria);

  if (recompensa.tipo === 'CATEGORIA' && categoria) {
    return {
      tipo: 'categoria',
      sobreId: recompensa.id,
      nombre: recompensa.nombre,
      categoria,
    };
  }

  if (recompensa.tipo === 'MARCA' && recompensa.marca) {
    return {
      tipo: 'marca',
      sobreId: recompensa.id,
      nombre: recompensa.marca,
      logoUrl: recompensa.logoUrl,
      categoria: categoria ?? undefined,
    };
  }

  return {
    tipo: 'generico',
    sobreId: recompensa.id,
    nombre: recompensa.nombre,
  };
};

export const mapearMision = (respuesta: MisionRespuesta): Mision => ({
  id: respuesta.id,
  titulo: respuesta.nombre,
  tipo: TIPO_POR_OBJETIVO[respuesta.objetivo] ?? 'obtener_cartas',
  periodicidad: mapearPeriodicidad(respuesta.periodo),
  actual: respuesta.progreso,
  objetivo: respuesta.meta,
  estado: mapearEstado(respuesta.completada, respuesta.reclamada),
  recompensa: mapearRecompensa(respuesta.recompensa),
  disponible: true,
});

/** Una fila del PT System: sobres abiertos de un tipo desde la última legendaria. */
export interface ProgresoPity {
  readonly id: string;
  readonly sobre: SobreReferencia;
  readonly abiertos: number;
  readonly umbral: number;
  readonly imagenSvg?: string;
}

export const faltantesPity = (p: Pick<ProgresoPity, 'abiertos' | 'umbral'>): number =>
  Math.max(0, p.umbral - p.abiertos);

/**
 * Umbral de "¡Casi!" del PT System: una fila se destaca cuando le faltan estos
 * sobres o menos para la legendaria. Vive en una constante para no hardcodearlo
 * en la plantilla y para poder ajustarlo en un solo lugar.
 */
export const UMBRAL_CASI_PITY = 2;

/**
 * Categoría a la que pertenece un sobre: la propia (tipo `categoria`) o la de su
 * marca. Los sobres genéricos no tienen categoría (`null`).
 */
export const categoriaDeSobre = (sobre: SobreReferencia): CategoriaSobre | null => {
  if (sobre.tipo === 'categoria') return sobre.categoria;
  if (sobre.tipo === 'marca') return sobre.categoria ?? null;
  return null;
};

/** Porcentaje entero acotado a 0..100. Objetivo inválido (<= 0) devuelve 0. */
export const porcentaje = (actual: number, objetivo: number): number =>
  objetivo > 0 ? Math.round(Math.min(100, Math.max(0, (actual / objetivo) * 100))) : 0;
