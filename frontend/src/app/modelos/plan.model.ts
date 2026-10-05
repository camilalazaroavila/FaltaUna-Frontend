export type PlanId = 'basico' | 'standard' | 'premium';

export interface Plan {
  id: PlanId;
  backendId: number;
  nombre: string;
  beneficios: string[];
  nivelPrecio: number;
  precio: number;
}

export const PLANES: Plan[] = [
  {
    id: 'basico',
    backendId: 1,
    nombre: 'Básico',
    beneficios: ['Creación de campaña.', 'Más publicidad', '12 cartas máximo'],
    nivelPrecio: 1,
    precio: 15000,
  },
  {
    id: 'standard',
    backendId: 2,
    nombre: 'Standard',
    beneficios: ['Creación de campaña.', 'Estadísticas', 'Más publicidad', '20 cartas máximo'],
    nivelPrecio: 2,
    precio: 35000,
  },
  {
    id: 'premium',
    backendId: 3,
    nombre: 'Premium',
    beneficios: ['Creación de campaña.', 'Estadísticas avanzadas', 'Publicidad prioritaria', 'Cartas ilimitadas'],
    nivelPrecio: 3,
    precio: 60000,
  },
];