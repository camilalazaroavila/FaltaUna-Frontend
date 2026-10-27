export interface ConfiguracionExpo {
  sobreRegaloId: number | null;
  activo: boolean;
}

/** Ajustalo a lo que devuelva tu GET /api/Sobres */
export interface SobreResumen {
  id: number;
  nombre?: string;
  marcaNombre?: string;
}