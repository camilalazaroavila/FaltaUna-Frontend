import type { Carta } from '@modelos/carta.model';
import type { SlotsLado } from '@modelos/partida.model';
import {
  SLOTS_POR_LADO,
  type EscenarioPartidaTutorial,
} from '@servicios/servicios-partida/partida-estado.service';
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

const cartaTutorial = (
  id: string,
  nombre: string,
  categoria: Carta['categoria'],
  costo: number,
  imagenUrl: string,
): Carta => ({
  id,
  nombre,
  imagenUrl,
  rareza: 'comun',
  categoria,
  atributoIzquierdo: costo,
  atributoDerecho: costo,
  obtenida: true,
  jugable: true,
  descripcionHabilidad: 'Carta de práctica del tutorial.',
});

export const CARTAS_TUTORIAL: readonly Carta[] = [
  cartaTutorial('t-001', 'Refresco', 'gastronomia', 1, 'imagenes/Sprite.png'),
  cartaTutorial('t-002', 'Hamburguesa', 'gastronomia', 2, 'imagenes/McDonalds.jpg'),
  cartaTutorial('t-003', 'Gorra', 'indumentaria', 3, 'imagenes/LEGO.jpg.webp'),
  cartaTutorial('t-004', 'Zapatilla', 'indumentaria', 1, 'imagenes/zara.jpg'),
];

export const CARTA_RIVAL_TUTORIAL: Carta = cartaTutorial(
  't-rival',
  'Café del bot',
  'gastronomia',
  2,
  'imagenes/cocacola.jpg',
);

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
