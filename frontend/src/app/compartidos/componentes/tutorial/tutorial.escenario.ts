import type { Carta } from '@modelos/carta.model';
import type { SlotsLado } from '@modelos/partida.model';
import { SLOTS_POR_LADO } from '@modelos/partida.model';
import type { EscenarioPartidaTutorial } from '@servicios/servicios-partida/partida-estado.service';
import { ZONAS_MOCK } from '@servicios/servicios-partida/zonas-mock.service';

/**
 * Escenario guionado del tutorial.
 *
 * Es una partida mock aparte de la galería: zonas conocidas, slots propios y
 * rivales vacíos y cartas baratas para que el jugador pueda bajar una sin
 * pelearse con el costo. El costo y el poder de cada carta coinciden para que
 * el ejemplo sea simple de leer.
 */
const vacios = (): SlotsLado =>
  Array.from({ length: SLOTS_POR_LADO }, () => null);

export const CARTAS_TUTORIAL: readonly Carta[] = [
  {
    id: '77',
    nombre: 'Hamburguesa con Queso',
    imagenUrl: 'https://res.cloudinary.com/w0uxy0vd/image/upload/v1792381195/Hamburguesa_con_Queso.png',
    rareza: 'comun',
    categoria: 'gastronomia',
    atributoIzquierdo: 1,
    atributoDerecho: 2,
    poderBase: 2,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: '+1 de poder a todas sus cartas en esta zona.',
    efectosCategoria: [{ tipo: 'sube', categoria: 'gastronomia', valor: 1 }],
    habilidad: {
      tipo: 'AUMENTAR_PODER_ALIADOS_ZONA',
      momento: 'al-jugar',
      valor: 1,
      categoriaObjetivo: 'gastronomia',
      descripcion: 'Hamburguesa con Queso: +1 de poder en Gastronomía.',
    },
  },
  {
    id: '14',
    nombre: 'Golden Run',
    imagenUrl: 'https://res.cloudinary.com/w0uxy0vd/image/upload/v1792789758/Golden_Run_Zapatillas_UrbanasDeportivas.jpg',
    rareza: 'comun',
    categoria: 'indumentaria',
    atributoIzquierdo: 2,
    atributoDerecho: 3,
    poderBase: 3,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Zapatillas urbanas de gran velocidad y tracción.',
  },
  {
    id: '5',
    nombre: 'AURA Cap',
    imagenUrl: 'https://res.cloudinary.com/w0uxy0vd/image/upload/v1792789553/AURA_Cap_Gorra_Urbana.jpg',
    rareza: 'comun',
    categoria: 'indumentaria',
    atributoIzquierdo: 1,
    atributoDerecho: 2,
    poderBase: 2,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Gorra clásica de estilo callejero.',
  },
  {
    id: '26',
    nombre: 'Tarta Blanca de Rosas Florales',
    imagenUrl: 'https://res.cloudinary.com/w0uxy0vd/image/upload/v1792771233/TARTA_BLANCA_DE_ROSAS_FLORALES.jpg',
    rareza: 'rara',
    categoria: 'gastronomia',
    atributoIzquierdo: 2,
    atributoDerecho: 3,
    poderBase: 3,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Otorga dulzura e incrementa el poder gastronómico.',
    efectosCategoria: [{ tipo: 'sube', categoria: 'gastronomia', valor: 1 }],
  },
];

export const CARTA_RIVAL_TUTORIAL: Carta = {
  id: '15',
  nombre: 'Harmony Sound Headphones',
  imagenUrl: 'https://res.cloudinary.com/w0uxy0vd/image/upload/v1792794159/Harmony_Sound_Headphones.jpg',
  rareza: 'rara',
  categoria: 'musica',
  atributoIzquierdo: 2,
  atributoDerecho: 2,
  poderBase: 2,
  obtenida: true,
  jugable: true,
  descripcionHabilidad: 'Auriculares de estudio con sonido envolvente.',
};

export const CARTAS_FINALES_TUTORIAL: readonly Carta[] = [
  {
    id: 'c-006',
    nombre: 'Super Grido',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'epicarta',
    categoria: 'gastronomia',
    atributoIzquierdo: 3,
    atributoDerecho: 6,
    poderBase: 6,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Poder helado: suma +2 si se juega en zona gastronómica.',
    efectosCategoria: [{ tipo: 'sube', categoria: 'gastronomia', valor: 2 }],
  },
  {
    id: 'c-009',
    nombre: 'Coca-Cola Zero',
    imagenUrl: 'imagenes/cocacola.jpg',
    rareza: 'legendaria',
    categoria: 'gastronomia',
    atributoIzquierdo: 2,
    atributoDerecho: 4,
    poderBase: 4,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Suma +2 de poder adicional a tus aliados en la zona.',
    efectosCategoria: [{ tipo: 'sube', categoria: 'gastronomia', valor: 2 }],
  },
  {
    id: 'c-010',
    nombre: 'Zara Noir',
    imagenUrl: 'imagenes/zara.jpg',
    rareza: 'legendaria',
    categoria: 'indumentaria',
    atributoIzquierdo: 2,
    atributoDerecho: 5,
    poderBase: 5,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Elegancia pura: otorga bonificación a toda la mesa.',
    efectosCategoria: [{ tipo: 'sube', categoria: 'indumentaria', valor: 1 }],
  },
  {
    id: 'c-008',
    nombre: 'Pixel Max',
    imagenUrl: 'imagenes/google.jpg',
    rareza: 'epicarta',
    categoria: 'tecnologia',
    atributoIzquierdo: 1,
    atributoDerecho: 3,
    poderBase: 3,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Procesamiento rápido con bajo costo.',
  },
];

export const ESCENARIO_TUTORIAL: EscenarioPartidaTutorial = {
  lugares: {
    izquierda: { zona: ZONAS_MOCK[0], rival: vacios(), propio: vacios() },
    derecha: { zona: ZONAS_MOCK[1], rival: vacios(), propio: vacios() },
  },
  mano: CARTAS_TUTORIAL,
  turno: 1,
  segundos: 60,
  cupones: 3,
  barraPropia: 0,
  barraRival: 0,
};
