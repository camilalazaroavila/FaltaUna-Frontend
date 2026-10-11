import type { CategoriaSobre } from './categoria.model';

/** Pestañas de la vista: cada misión pertenece a exactamente una. */
export const PERIODICIDADES = ['diaria', 'semanal', 'permanente'] as const;
export type Periodicidad = (typeof PERIODICIDADES)[number];

export const ETIQUETAS_PERIODICIDAD: Record<Periodicidad, string> = {
  diaria: 'Diaria',
  semanal: 'Semanal',
  permanente: 'Permanente',
};

/** `partidas_jugadas` todavía no tiene mecánica: se muestra como "Próximamente". */
export type TipoMision = 'inicio_sesion' | 'sobres_abiertos' | 'partidas_jugadas';

/**
 * `completada` = progreso al 100% y recompensa sin reclamar (el sobre se vuelve clickeable).
 * `reclamada` = recompensa ya acreditada (check verde).
 */
export type EstadoMision = 'en_curso' | 'completada' | 'reclamada';

/**
 * Sobre descrito con los mismos datos que consume `app-sobre-marca`.
 * Sirve tanto para la recompensa de una misión como para una fila del PT System.
 */
export type SobreReferencia =
  | { readonly tipo: 'generico' }
  | { readonly tipo: 'categoria'; readonly categoria: CategoriaSobre }
  | {
      readonly tipo: 'marca';
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

/** Una fila del PT System: sobres abiertos de un tipo desde la última legendaria. */
export interface ProgresoPity {
  readonly id: string;
  readonly sobre: SobreReferencia;
  readonly abiertos: number;
  readonly umbral: number;
}

export const faltantesPity = (p: Pick<ProgresoPity, 'abiertos' | 'umbral'>): number =>
  Math.max(0, p.umbral - p.abiertos);

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