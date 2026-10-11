import { Carta } from './carta.model';

/**
 * Datos mock de cartas coleccionables.
 *
 * Cubren las 4 rarezas, las 7 categorías, y mezclan obtenidas/no-obtenidas.
 * Las imágenes apuntan a placeholders en `public/imagenes/` que ya existen.
 * Cuando el backend esté disponible, este archivo se reemplaza por la
 * respuesta HTTP y el componente no necesita cambios.
 */
export const CARTAS_MOCK: Carta[] = [
  // ── Comunes (1 estrella) ──────────────────────────────────────────────
  {
    id: 'c-001',
    nombre: 'Danonino',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'comun',
    categoria: 'gastronomia',
    atributoIzquierdo: 12,
    atributoDerecho: 8,
    obtenida: true,
  },
  {
    id: 'c-002',
    nombre: 'Sprite Fresh',
    imagenUrl: 'imagenes/Sprite.png',
    rareza: 'comun',
    categoria: 'gastronomia',
    atributoIzquierdo: 10,
    atributoDerecho: 10,
    obtenida: false,
  },

  // ── Raras (2 estrellas) ───────────────────────────────────────────────
  {
    id: 'c-003',
    nombre: 'Guacamola',
    imagenUrl: 'imagenes/McDonalds.jpg',
    rareza: 'rara',
    categoria: 'cosmeticos',
    atributoIzquierdo: 18,
    atributoDerecho: 14,
    obtenida: true,
  },
  {
    id: 'c-004',
    nombre: 'Auradías',
    imagenUrl: 'imagenes/zara.png',
    rareza: 'rara',
    categoria: 'indumentaria',
    atributoIzquierdo: 15,
    atributoDerecho: 20,
    obtenida: true,
  },
  {
    id: 'c-005',
    nombre: 'Casa Limón',
    imagenUrl: 'imagenes/lego.png',
    rareza: 'rara',
    categoria: 'decoracion',
    atributoIzquierdo: 16,
    atributoDerecho: 13,
    obtenida: false,
  },

  // ── Epicartas (3 estrellas) ───────────────────────────────────────────
  {
    id: 'c-006',
    nombre: 'Super Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'epicarta',
    categoria: 'gastronomia',
    atributoIzquierdo: 24,
    atributoDerecho: 22,
    obtenida: true,
  },
  {
    id: 'c-007',
    nombre: 'Sony Beats',
    imagenUrl: 'imagenes/sony.png',
    rareza: 'epicarta',
    categoria: 'musica',
    atributoIzquierdo: 20,
    atributoDerecho: 28,
    obtenida: false,
  },
  {
    id: 'c-008',
    nombre: 'Pixel Max',
    imagenUrl: 'imagenes/google.jpg',
    rareza: 'epicarta',
    categoria: 'tecnologia',
    atributoIzquierdo: 26,
    atributoDerecho: 25,
    obtenida: true,
  },

  // ── Legendarias (4 estrellas) ─────────────────────────────────────────
  {
    id: 'c-009',
    nombre: 'Coca-Cola Zero',
    imagenUrl: 'imagenes/cocacola.jpg',
    rareza: 'legendaria',
    categoria: 'gastronomia',
    atributoIzquierdo: 30,
    atributoDerecho: 32,
    obtenida: true,
  },
  {
    id: 'c-010',
    nombre: 'Zara Noir',
    imagenUrl: 'imagenes/zara.jpg',
    rareza: 'legendaria',
    categoria: 'indumentaria',
    atributoIzquierdo: 35,
    atributoDerecho: 30,
    obtenida: false,
  },

  // ── Extra: cubrir las categorías que faltan ───────────────────────────
  {
    id: 'c-011',
    nombre: 'Cine Royal',
    imagenUrl: 'imagenes/lego.png',
    rareza: 'comun',
    categoria: 'entretenimiento',
    atributoIzquierdo: 11,
    atributoDerecho: 9,
    obtenida: true,
  },
  {
    id: 'c-012',
    nombre: 'Lego Creator',
    imagenUrl: 'imagenes/lego.png',
    rareza: 'rara',
    categoria: 'decoracion',
    atributoIzquierdo: 19,
    atributoDerecho: 17,
    obtenida: true,
  },
  {
    id: 'c-013',
    nombre: 'McFlurry Deluxe',
    imagenUrl: 'imagenes/McDonalds.jpg',
    rareza: 'epicarta',
    categoria: 'cosmeticos',
    atributoIzquierdo: 22,
    atributoDerecho: 21,
    obtenida: false,
  },
  {
    id: 'c-014',
    nombre: 'Google Stadia',
    imagenUrl: 'imagenes/google.jpg',
    rareza: 'legendaria',
    categoria: 'tecnologia',
    atributoIzquierdo: 33,
    atributoDerecho: 34,
    obtenida: true,
  },
];
