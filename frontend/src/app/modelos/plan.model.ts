export type PlanId = 'basico' | 'standard' | 'premium';

export interface Plan {
  id: PlanId;
  backendId: number;
  nombre: string;
  beneficios: string[];
  nivelPrecio: number;
  precio: number;
  /** Cantidad máxima de cartas (imágenes) del álbum según el plan. Coincide con `Plan.MaxCartas` del back. */
  maxCartas: number;
  /** Cantidad máxima de álbumes permitidos según el plan (1 Básico, 5 Standard, 10 Premium). */
  maxAlbumes: number;
}

export const PLANES: Plan[] = [
  {
    id: 'basico',
    backendId: 1,
    nombre: 'Básico',
    beneficios: ['1 álbum activo.', 'Mas publicidad', '12 cartas máximo'],
    nivelPrecio: 1,
    precio: 15000,
    maxCartas: 12,
    maxAlbumes: 1,
  },
  {
    id: 'standard',
    backendId: 2,
    nombre: 'Standard',
    beneficios: ['Hasta 5 álbumes.', 'Estadisticas', 'Mas publicidad', '20 cartas máximo'],
    nivelPrecio: 2,
    precio: 35000,
    maxCartas: 20,
    maxAlbumes: 5,
  },
  {
    id: 'premium',
    backendId: 3,
    nombre: 'Premium',
    beneficios: [
      'Hasta 10 álbumes.',
      'Estadisticas',
      'Mas publicidad',
      'Diseño personalizado de marca',
      '30 cartas máximo',
    ],
    nivelPrecio: 3,
    precio: 60000,
    maxCartas: 30,
    maxAlbumes: 10,
  },
];