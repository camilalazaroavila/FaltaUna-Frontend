/**
 * Datos mock de la vista de estadísticas generales del panel de empresa.
 *
 * La empresa maneja una sola categoría y varios álbumes, así que las métricas
 * se desglosan por álbum (no por categoría). Los favoritos por álbum, el
 * reparto por rareza y las cartas más queridas se derivan de `empresa.mock.ts`
 * en el componente, para que todo quede coherente con el catálogo vigente.
 */

/** Tarjeta de métrica general (una cifra destacada + contexto). */
export interface KpiEmpresa {
  readonly id: string;
  readonly etiqueta: string;
  readonly valor: string;
  readonly detalle: string;
  readonly icono: string;
  readonly tendencia: string;
  readonly tendenciaPositiva: boolean;
}

/** Punto de la mini evolución temporal de favoritos. */
export interface PuntoEvolucion {
  readonly etiqueta: string;
  readonly valor: number;
}

export const KPIS_EMPRESA: readonly KpiEmpresa[] = [
  {
    id: 'completaron',
    etiqueta: 'Completaron tus álbumes',
    valor: '1.284',
    detalle: '28% de los jugadores',
    icono: 'phosphorTrophyFill',
    tendencia: '+12%',
    tendenciaPositiva: true,
  },
  {
    id: 'intercambios',
    etiqueta: 'Cartas intercambiadas',
    valor: '9.742',
    detalle: 'Entre tus álbumes',
    icono: 'phosphorArrowsLeftRightFill',
    tendencia: '+8%',
    tendenciaPositiva: true,
  },
  {
    id: 'favoritas',
    etiqueta: 'Jugadores con favoritas',
    valor: '3.126',
    detalle: 'Marcaron alguna carta',
    icono: 'phosphorHeartFill',
    tendencia: '+5%',
    tendenciaPositiva: true,
  },
  {
    id: 'partidas',
    etiqueta: 'Partidas con tus cartas',
    valor: '21.508',
    detalle: 'Usaron una carta de tu marca',
    icono: 'phosphorPlayFill',
    tendencia: '-2%',
    tendenciaPositiva: false,
  },
];

export const EVOLUCION_FAVORITOS: readonly PuntoEvolucion[] = [
  { etiqueta: 'Ene', valor: 820 },
  { etiqueta: 'Feb', valor: 940 },
  { etiqueta: 'Mar', valor: 1180 },
  { etiqueta: 'Abr', valor: 1320 },
  { etiqueta: 'May', valor: 1510 },
  { etiqueta: 'Jun', valor: 1680 },
];
