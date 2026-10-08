/** Iconos de beneficio disponibles en la landing empresarial. */
export type IconoBeneficio =
  | 'megafono'
  | 'estadisticas'
  | 'ojo'
  | 'paleta'
  | 'cartas';

export interface BeneficioPlan {
  texto: string;
  icono: IconoBeneficio;
}

export type VariantePlan = 'azul' | 'violeta' | 'degradado';

export interface PlanEmpresa {
  id: 'basico' | 'standard' | 'premium';
  nombre: string;
  variante: VariantePlan;
  alineacion: 'izquierda' | 'derecha';
  beneficios: BeneficioPlan[];
}

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

export interface IntegranteEquipo {
  nombre: string;
  avatarUrl?: string;
}
