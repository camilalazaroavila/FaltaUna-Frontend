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

  // ── Grido: álbum completo (12 cartas obtenidas) ───────────────────────
  // Deja un álbum al 100% para poder probar el flujo "Canjear cupón".
  {
    id: 'c-015',
    nombre: 'Grido Frutilla',
    marca: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'comun',
    categoria: 'gastronomia',
    atributoIzquierdo: 13,
    atributoDerecho: 9,
    obtenida: true,
  },
  {
    id: 'c-016',
    nombre: 'Grido Bombón',
    marca: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'comun',
    categoria: 'gastronomia',
    atributoIzquierdo: 11,
    atributoDerecho: 7,
    obtenida: true,
  },
  {
    id: 'c-017',
    nombre: 'Cucurucho Clásico',
    marca: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'comun',
    categoria: 'gastronomia',
    atributoIzquierdo: 14,
    atributoDerecho: 10,
    obtenida: true,
  },
  {
    id: 'c-018',
    nombre: 'Súper Dulce de Leche',
    marca: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'rara',
    categoria: 'gastronomia',
    atributoIzquierdo: 17,
    atributoDerecho: 15,
    obtenida: true,
  },
  {
    id: 'c-019',
    nombre: 'Grido Deluxe',
    marca: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'rara',
    categoria: 'gastronomia',
    atributoIzquierdo: 19,
    atributoDerecho: 16,
    obtenida: true,
  },
  {
    id: 'c-020',
    nombre: 'Crocante Grido',
    marca: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'rara',
    categoria: 'gastronomia',
    atributoIzquierdo: 18,
    atributoDerecho: 18,
    obtenida: true,
  },
  {
    id: 'c-021',
    nombre: 'Mega Grido',
    marca: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'epicarta',
    categoria: 'gastronomia',
    atributoIzquierdo: 25,
    atributoDerecho: 23,
    obtenida: true,
  },
  {
    id: 'c-022',
    nombre: 'Grido Premium',
    marca: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'epicarta',
    categoria: 'gastronomia',
    atributoIzquierdo: 27,
    atributoDerecho: 24,
    obtenida: true,
  },
  {
    id: 'c-023',
    nombre: 'Leyenda Grido',
    marca: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'legendaria',
    categoria: 'gastronomia',
    atributoIzquierdo: 34,
    atributoDerecho: 31,
    obtenida: true,
  },
  {
    id: 'c-024',
    nombre: 'Grido Infinito',
    marca: 'Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'legendaria',
    categoria: 'gastronomia',
    atributoIzquierdo: 36,
    atributoDerecho: 33,
    obtenida: true,
  },
];
