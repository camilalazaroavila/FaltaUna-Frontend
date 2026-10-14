import { Carta } from './carta.model';

/**
 * Carta del mock con la marca a la que pertenece.
 *
 * El modelo `Carta` no expone la marca (el backend la relaciona aparte), pero
 * "Mis cartas" y "Álbumes" necesitan agruparlas por marca para mostrar el mismo
 * dato en las dos vistas. Se agrega acá, sin tocar `Carta`, para que el mock sea
 * la única fuente de verdad de las cartas de la demo.
 */
export interface CartaConMarca extends Carta {
  readonly marca: string;
}

/**
 * Datos mock de cartas coleccionables.
 *
 * Cubren las 4 rarezas, las 7 categorías, y mezclan obtenidas/no-obtenidas.
 * Las imágenes apuntan a placeholders en `public/imagenes/` que ya existen.
 * Cuando el backend esté disponible, este archivo se reemplaza por la
 * respuesta HTTP y el componente no necesita cambios.
 */
export const CARTAS_MOCK: CartaConMarca[] = [
  // ── Comunes (1 estrella) ──────────────────────────────────────────────
  {
    id: 'c-001',
    nombre: 'Danonino',
    marca: 'Grido',
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
    marca: 'Coca-Cola',
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
    marca: 'McDonald\'s',
    imagenUrl: 'imagenes/McDonalds.jpg',
    rareza: 'rara',
    categoria: 'gastronomia',
    atributoIzquierdo: 18,
    atributoDerecho: 14,
    obtenida: true,
  },
  {
    id: 'c-004',
    nombre: 'Auradías',
    marca: 'Zara',
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
    marca: 'Casa Limón',
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
    marca: 'Grido',
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
    marca: 'Sony',
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
    marca: 'Google',
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
    marca: 'Coca-Cola',
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
    marca: 'Zara',
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
    marca: 'Lego',
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
    marca: 'Lego',
    imagenUrl: 'imagenes/lego.png',
    rareza: 'rara',
    categoria: 'entretenimiento',
    atributoIzquierdo: 19,
    atributoDerecho: 17,
    obtenida: true,
  },
  {
    id: 'c-013',
    nombre: 'McFlurry Deluxe',
    marca: 'McDonald\'s',
    imagenUrl: 'imagenes/McDonalds.jpg',
    rareza: 'epicarta',
    categoria: 'gastronomia',
    atributoIzquierdo: 22,
    atributoDerecho: 21,
    obtenida: false,
  },
  {
    id: 'c-014',
    nombre: 'Google Stadia',
    marca: 'Google',
    imagenUrl: 'imagenes/google.jpg',
    rareza: 'legendaria',
    categoria: 'tecnologia',
    atributoIzquierdo: 33,
    atributoDerecho: 34,
    obtenida: true,
  },
];
