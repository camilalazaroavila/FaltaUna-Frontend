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
  | 'obtener_cartas'
  | 'completar_album'
  | 'completar_tutorial';

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
export type PeriodoMisionBackend = 'DIARIA' | 'SEMANAL' | 'PERMANENTE';
export type ObjetivoMisionBackend =
  | 'ABRIR_SOBRES'
  | 'RECLAMAR_SOBRE_DIARIO'
  | 'OBTENER_CARTAS'
  | 'INICIAR_SESION'
  | 'JUGAR_PARTIDAS'
  | 'COMPLETAR_ALBUM'
  | 'COMPLETAR_TUTORIAL';
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

/** Contrato de `GET /api/Misiones/resumen`. */
export interface ResumenPeriodoMisiones {
  readonly proximoReinicioUtc: string;
}

export interface BonoDiarioMisiones {
  readonly totalRequeridas: number;
  readonly completadas: number;
  readonly disponible: boolean;
  readonly reclamado: boolean;
  readonly recompensa: SobreRecompensaRespuesta;
  readonly cantidadRecompensa: number;
}

export interface ResumenMisionesRespuesta {
  readonly fechaServidorUtc: string;
  readonly diaria: ResumenPeriodoMisiones | null;
  readonly semanal: ResumenPeriodoMisiones | null;
  readonly bonoDiario: BonoDiarioMisiones | null;
}

/** Contrato de `POST /api/Misiones/bono-diario/reclamar`. */
export interface ReclamarBonoRespuesta {
  readonly sobreId: number;
  readonly nombre: string;
  readonly cantidad: number;
}

/** Contrato de `POST /api/Misiones/reclamar-todas`. */
export interface ReclamarTodasRespuesta {
  readonly sobresAcreditados: readonly ReclamarBonoRespuesta[];
  readonly misionesReclamadasIds: readonly number[];
  readonly bonoReclamado: boolean;
}

const PERIODICIDAD_POR_PERIODO: Record<PeriodoMisionBackend, Periodicidad> = {
  DIARIA: 'diaria',
  SEMANAL: 'semanal',
  PERMANENTE: 'permanente',
};

const TIPO_POR_OBJETIVO: Record<ObjetivoMisionBackend, TipoMision> = {
  ABRIR_SOBRES: 'sobres_abiertos',
  RECLAMAR_SOBRE_DIARIO: 'reclamar_sobre_diario',
  OBTENER_CARTAS: 'obtener_cartas',
  INICIAR_SESION: 'inicio_sesion',
  JUGAR_PARTIDAS: 'partidas_jugadas',
  COMPLETAR_ALBUM: 'completar_album',
  COMPLETAR_TUTORIAL: 'completar_tutorial',
};

export const mapearObjetivo = (
  objetivo: string,
): { readonly tipo: TipoMision; readonly disponible: boolean } => {
  if (objetivo in TIPO_POR_OBJETIVO) {
    return { tipo: TIPO_POR_OBJETIVO[objetivo as ObjetivoMisionBackend], disponible: true };
  }
  return { tipo: 'obtener_cartas', disponible: false };
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

export const mapearMision = (respuesta: MisionRespuesta): Mision => {
  const { tipo, disponible } = mapearObjetivo(respuesta.objetivo);
  return {
    id: respuesta.id,
    titulo: respuesta.nombre,
    tipo,
    periodicidad: mapearPeriodicidad(respuesta.periodo),
    actual: respuesta.progreso,
    objetivo: respuesta.meta,
    estado: mapearEstado(respuesta.completada, respuesta.reclamada),
    recompensa: mapearRecompensa(respuesta.recompensa),
    disponible,
  };
};

/** Tipos de contadores de pity soportados por el backend. */
export const TIPOS_PITY_ORDEN = ['GENERAL', 'CATEGORIA', 'MARCA'] as const;
export type TipoPity = (typeof TIPOS_PITY_ORDEN)[number];

/** Contrato de `GET /api/Sobres/pity`. */
export interface PityBackendRespuesta {
  readonly tipo: string;
  readonly contador: number;
  readonly umbral: number;
  readonly sobresRestantes: number;
  readonly porcentaje: number;
  readonly garantizada: boolean;
}

/** Una fila del PT System: sobres abiertos de un tipo desde la última legendaria. */
export interface ProgresoPity {
  readonly tipo: TipoPity;
  readonly contador: number;
  readonly umbral: number;
  readonly sobresRestantes: number;
  readonly garantizada: boolean;
}

export const esTipoPityValido = (tipo: string): tipo is TipoPity =>
  tipo === 'GENERAL' || tipo === 'CATEGORIA' || tipo === 'MARCA';

export const faltantesPity = (p: Pick<ProgresoPity, 'contador' | 'umbral'>): number =>
  Math.max(0, p.umbral - p.contador);

/**
 * Fila cercana a la garantía: al menos 75% completada pero aún no garantizada.
 */
export const estaCercaPity = (p: ProgresoPity): boolean =>
  !p.garantizada && p.contador >= Math.ceil(p.umbral * 0.75);

/**
 * Mapea la respuesta del backend al modelo del frontend, filtrando tipos desconocidos
 * y ordenando fijamente: GENERAL, CATEGORIA, MARCA.
 */
export const mapearPity = (respuestas: readonly PityBackendRespuesta[]): readonly ProgresoPity[] => {
  const mapeados = respuestas
    .filter((r) => esTipoPityValido(r.tipo))
    .map((r) => ({
      tipo: r.tipo as TipoPity,
      contador: r.contador,
      umbral: r.umbral,
      sobresRestantes: r.sobresRestantes,
      garantizada: r.garantizada,
    }));

  return mapeados.sort(
    (a, b) => TIPOS_PITY_ORDEN.indexOf(a.tipo) - TIPOS_PITY_ORDEN.indexOf(b.tipo),
  );
};

/**
 * Umbral de "¡Casi!" del PT System: una fila se destaca cuando le faltan estos
 * sobres o menos para la legendaria.
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
