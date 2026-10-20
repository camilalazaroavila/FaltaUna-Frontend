import type { EfectoZona } from '@compartidos/componentes/partida/zona-popup/zona-popup';

/** MOCK: zonas de ejemplo. Los efectos reales los define el equipo (context.md, sección 11). */
export interface ZonaMock {
  readonly id: string;
  readonly nombre: string;
  readonly imagenUrl: string;
  readonly efecto: EfectoZona;
}

export const ZONAS_MOCK: readonly ZonaMock[] = [
  {
    id: 'z-grido',
    nombre: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    efecto: { categoria: 'gastronomia', bonus: 1 },
  },
  {
    id: 'z-zara',
    nombre: 'Zara',
    imagenUrl: 'imagenes/zara.jpg',
    efecto: { categoria: 'indumentaria', bonus: 1 },
  },
  {
    id: 'z-mcdonalds',
    nombre: 'McDonald\'s',
    imagenUrl: 'imagenes/McDonalds.jpg',
    efecto: { categoria: 'gastronomia', bonus: 1 },
  },
  {
    id: 'z-sony',
    nombre: 'Sony',
    imagenUrl: 'imagenes/sony.png',
    efecto: { categoria: 'tecnologia', bonus: 1 },
  },
];

/** MOCK: avatares de jugador (carpeta `public/imagenes/iconos-jugador/`). */
export const JUGADORES_MOCK = {
  propio: { nombre: 'Gonzamirko', avatarUrl: 'imagenes/iconos-jugador/batman.png' },
  rival: { nombre: 'Pedrope', avatarUrl: 'imagenes/iconos-jugador/ps5.jpg' },
} as const;