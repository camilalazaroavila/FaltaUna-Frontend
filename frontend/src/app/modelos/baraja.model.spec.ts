import type { Carta, RarezaCarta } from './carta.model';
import {
  LIMITES_BARAJA,
  TAMANIO_BARAJA,
  calcularEstadoBaraja,
  contarPorRareza,
  puedeSeleccionar,
} from './baraja.model';

function carta(id: string, rareza: RarezaCarta): Carta {
  return {
    id,
    nombre: id,
    imagenUrl: 'imagenes/grido.jpg',
    rareza,
    categoria: 'gastronomia',
    atributoIzquierdo: 1,
    atributoDerecho: 1,
    obtenida: true,
  };
}

function varias(rareza: RarezaCarta, cantidad: number): Carta[] {
  return Array.from({ length: cantidad }, (_, i) => carta(`${rareza}-${i}`, rareza));
}

describe('modelo de baraja', () => {
  it('define un tamaño de baraja de 12 y topes por rareza flexibles', () => {
    expect(TAMANIO_BARAJA).toBe(12);
    expect(LIMITES_BARAJA).toEqual({ comun: 12, rara: 5, epicarta: 3, legendaria: 2 });
  });

  it('cuenta las cartas por rareza en orden, incluyendo las que están en cero', () => {
    const conteos = contarPorRareza([...varias('comun', 2), ...varias('epicarta', 1)]);

    expect(conteos.map((c) => c.rareza)).toEqual(['comun', 'rara', 'epicarta', 'legendaria']);
    expect(conteos.find((c) => c.rareza === 'comun')?.seleccionadas).toBe(2);
    expect(conteos.find((c) => c.rareza === 'rara')?.seleccionadas).toBe(0);
    expect(conteos.find((c) => c.rareza === 'epicarta')?.seleccionadas).toBe(1);
    expect(conteos.find((c) => c.rareza === 'legendaria')?.seleccionadas).toBe(0);
    expect(conteos.every((c) => c.maximo > 0)).toBe(true);
  });

  it('describe una baraja vacía', () => {
    const estado = calcularEstadoBaraja([]);

    expect(estado.total).toBe(0);
    expect(estado.completa).toBe(false);
    expect(estado.faltantes).toBe(12);
    expect(estado.puedeConfirmar).toBe(false);
    expect(estado.puedeAgregar).toBe(true);
  });

  it('marca la baraja como completa y confirmable al llegar a 12 cartas', () => {
    const estado = calcularEstadoBaraja(varias('comun', 12));

    expect(estado.total).toBe(12);
    expect(estado.completa).toBe(true);
    expect(estado.faltantes).toBe(0);
    expect(estado.puedeConfirmar).toBe(true);
    expect(estado.puedeAgregar).toBe(false);
  });

  it('permite barajas atípicas: 12 comunes sin ninguna otra rareza', () => {
    const comunes = varias('comun', 12);
    const estado = calcularEstadoBaraja(comunes);

    expect(estado.completa).toBe(true);
    expect(estado.conteos.find((c) => c.rareza === 'comun')?.seleccionadas).toBe(12);
    expect(estado.conteos.find((c) => c.rareza === 'legendaria')?.seleccionadas).toBe(0);
  });

  describe('puedeSeleccionar', () => {
    it('permite sumar mientras haya lugar y no se pase del tope de la rareza', () => {
      expect(puedeSeleccionar(carta('nueva', 'rara'), varias('comun', 3)).permitido).toBe(true);
    });

    it('bloquea una legendaria cuando ya hay dos', () => {
      const seleccion = varias('legendaria', LIMITES_BARAJA.legendaria);
      const resultado = puedeSeleccionar(carta('otra', 'legendaria'), seleccion);

      expect(resultado.permitido).toBe(false);
      expect(resultado.motivo).toContain('legendarias');
    });

    it('bloquea cualquier carta cuando la baraja ya tiene 12', () => {
      const resultado = puedeSeleccionar(carta('otra', 'comun'), varias('comun', 12));

      expect(resultado.permitido).toBe(false);
      expect(resultado.motivo).toContain('12');
    });
  });
});
