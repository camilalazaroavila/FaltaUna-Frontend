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
    id: 'c-001',
    nombre: 'Danonino',
    imagenUrl: 'imagenes/grido.jpg',
    rareza: 'comun',
    categoria: 'gastronomia',
    atributoIzquierdo: 1,
    atributoDerecho: 2,
    poderBase: 2,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Al jugarse en Gastronomía, suma +1 de poder adicional.',
    efectosCategoria: [{ tipo: 'sube', categoria: 'gastronomia', valor: 1 }],
    habilidad: {
      tipo: 'bonus-categoria',
      momento: 'al-jugar',
      valor: 1,
      categoriaObjetivo: 'gastronomia',
      descripcion: 'Suma +1 de poder en Gastronomía.',
    },
  },
  {
    id: 'c-004',
    nombre: 'Auradías',
    imagenUrl: 'imagenes/zara.jpg',
    rareza: 'rara',
    categoria: 'indumentaria',
    atributoIzquierdo: 2,
    atributoDerecho: 3,
    poderBase: 3,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Otorga +1 de poder a todas las cartas de Indumentaria.',
    efectosCategoria: [{ tipo: 'sube', categoria: 'indumentaria', valor: 1 }],
    habilidad: {
      tipo: 'bonus-categoria',
      momento: 'continuo',
      valor: 1,
      categoriaObjetivo: 'indumentaria',
      descripcion: 'Otorga +1 a Indumentaria.',
    },
  },
  {
    id: 'c-003',
    nombre: 'Guacamola',
    imagenUrl: 'imagenes/McDonalds.jpg',
    rareza: 'rara',
    categoria: 'gastronomia',
    atributoIzquierdo: 3,
    atributoDerecho: 4,
    poderBase: 4,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Aumenta el poder total de la zona en +2.',
    efectosCategoria: [{ tipo: 'sube', categoria: 'gastronomia', valor: 2 }],
    habilidad: {
      tipo: 'aumento-zona',
      momento: 'al-jugar',
      valor: 2,
      categoriaObjetivo: null,
      descripcion: 'Aumenta el poder de la zona +2.',
    },
  },
  {
    id: 'c-007',
    nombre: 'Sony Beats',
    imagenUrl: 'imagenes/sony.png',
    rareza: 'epicarta',
    categoria: 'tecnologia',
    atributoIzquierdo: 2,
    atributoDerecho: 3,
    poderBase: 3,
    obtenida: true,
    jugable: true,
    descripcionHabilidad: 'Aplica -1 de poder a las cartas rivales en la zona.',
    efectosCategoria: [{ tipo: 'baja', categoria: 'gastronomia', valor: -1 }],
    habilidad: {
      tipo: 'reduccion-rival',
      momento: 'al-jugar',
      valor: -1,
      categoriaObjetivo: null,
      descripcion: 'Reduce -1 el poder rival.',
    },
  },
];

export const CARTA_RIVAL_TUTORIAL: Carta = {
  id: 'c-002',
  nombre: 'Sprite Fresh',
  imagenUrl: 'imagenes/Sprite.png',
  rareza: 'comun',
  categoria: 'gastronomia',
  atributoIzquierdo: 2,
  atributoDerecho: 2,
  poderBase: 2,
  obtenida: true,
  jugable: true,
  descripcionHabilidad: 'Refresco burbujeante con sabor a lima limón.',
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
