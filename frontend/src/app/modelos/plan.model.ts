export type PlanId = 'basico' | 'standard' | 'premium';

export interface Plan {
  id: PlanId;
  nombre: string;
  beneficios: string[];
  nivelPrecio: number;
  precio: number;
}

export const PLANES: Plan[] = [
  {
    id: 'basico',
    nombre: 'Básico',
    beneficios: ['Creación de campaña.', 'Más publicidad', '12 cartas máximo'],
    nivelPrecio: 1,
    precio: 100,
  },
  {
    id: 'standard',
    nombre: 'Standard',
    beneficios: ['Creación de campaña.', 'Estadísticas', 'Más publicidad', '20 cartas máximo'],
    nivelPrecio: 2,
    precio: 200,
  },
  {
    id: 'premium',
    nombre: 'Premium',
    beneficios: ['Creación de campaña.', 'Estadísticas avanzadas', 'Publicidad prioritaria', 'Cartas ilimitadas'],
    nivelPrecio: 3,
    precio: 300,
  },
];