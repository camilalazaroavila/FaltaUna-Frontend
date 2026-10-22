import type { ZonaTablero } from '@modelos/partida.model';

/**
 * Zonas de ejemplo para la galería y el tablero mock.
 *
 * Los efectos reales los define el equipo (context.md, sección 11) y llegan
 * del backend con el bonus por categoría.
 */
export const ZONAS_MOCK: readonly ZonaTablero[] = [
  {
    id: 1,
    zonaPartidaId: 1,
    nombre: 'Grido',
    imagenUrl: 'imagenes/grido-local.jpg',
    efecto: { categoria: 'gastronomia', bonus: 1 },
    poderPropio: 0,
    poderRival: 0,
    bonusPorCategoria: {},
  },
  {
    id: 2,
    zonaPartidaId: 2,
    nombre: 'Lego',
    imagenUrl: 'imagenes/LEGO.jpg.webp',
    efecto: { categoria: 'indumentaria', bonus: 1 },
    poderPropio: 0,
    poderRival: 0,
    bonusPorCategoria: {},
  },
  {
    id: 3,
    zonaPartidaId: 3,
    nombre: 'McDonald\'s',
    imagenUrl: 'imagenes/McDonalds.jpg',
    efecto: { categoria: 'gastronomia', bonus: 1 },
    poderPropio: 0,
    poderRival: 0,
    bonusPorCategoria: {},
  },
  {
    id: 4,
    zonaPartidaId: 4,
    nombre: 'Sony',
    imagenUrl: 'imagenes/sony.png',
    efecto: { categoria: 'tecnologia', bonus: 1 },
    poderPropio: 0,
    poderRival: 0,
    bonusPorCategoria: {},
  },
];

/** Avatares de jugador de ejemplo (carpeta `public/imagenes/iconos-jugador/`). */
export const JUGADORES_MOCK = {
  propio: { nombre: 'Gonzamirko', avatarUrl: 'imagenes/iconos-jugador/batman.png' },
  rival: { nombre: 'Pedrope', avatarUrl: 'imagenes/iconos-jugador/ps5.jpg' },
} as const;
