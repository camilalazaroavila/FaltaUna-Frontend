import type { Carta } from '@modelos/carta.model';
import type { NombreLugar, ResultadoRonda } from '@modelos/partida.model';
import {
  construirColaPasos,
  PasoBurbuja,
  PasoZona,
  PasoBarra,
  type ContextoCartasLugar,
} from './secuencia-conteo-ronda';

const crearCartaMock = (id: string, poder = 5, oculta = false): Carta => ({
  id,
  nombre: `Carta ${id}`,
  rareza: 'comun',
  categoria: 'gastronomia',
  atributoIzquierdo: 2,
  atributoDerecho: poder,
  oculta,
  obtenida: true,
});

describe('SecuenciaConteoRonda (Cola única de animación)', () => {
  const lugares: readonly NombreLugar[] = ['izquierda', 'derecha'];

  const resultadoRondaMock: ResultadoRonda = {
    numero: 1,
    puntosPropio: 15,
    puntosRival: 10,
    ganador: 'propio',
    motivo: null,
    gane: true,
    terminada: false,
    zonas: [
      {
        zonaPartidaId: 10,
        nombreZona: 'Obelisco',
        propio: 14,
        rival: 8,
        puntosGanadosPropio: 15,
        puntosGanadosRival: 0,
        ganador: 'propio',
      },
      {
        zonaPartidaId: 20,
        nombreZona: 'Caminito',
        propio: 10,
        rival: 10,
        puntosGanadosPropio: 0,
        puntosGanadosRival: 0,
        ganador: 'empate',
      },
    ],
    cartasReveladasRival: [],
  };

  it('debe respetar el orden exacto: zona 1 propias -> zona 1 rival -> total zona 1 -> zona 2 propias -> zona 2 rival -> total zona 2 -> cambio de zonas -> barra puntos', () => {
    const cartasPorLugar: Record<NombreLugar, ContextoCartasLugar> = {
      izquierda: {
        propio: [crearCartaMock('izq-p1', 4), crearCartaMock('izq-p2', 6)],
        rival: [crearCartaMock('izq-r1', 8)],
      },
      derecha: {
        propio: [crearCartaMock('der-p1', 3)],
        rival: [crearCartaMock('der-r1', 5)],
      },
    };

    const cola = construirColaPasos(lugares, cartasPorLugar, resultadoRondaMock);

    // Pasos esperados:
    // 0: burbuja izquierda propio izq-p1
    // 1: burbuja izquierda propio izq-p2
    // 2: burbuja izquierda rival izq-r1
    // 3: zona izquierda resolución
    // 4: burbuja derecha propio der-p1
    // 5: burbuja derecha rival der-r1
    // 6: zona derecha resolución
    // 7: cambio de zonas (rotación)
    // 8: barra puntos
    expect(cola).toHaveLength(9);

    const p0 = cola[0] as PasoBurbuja;
    expect(p0.tipo).toBe('burbuja');
    expect(p0.lugar).toBe('izquierda');
    expect(p0.lado).toBe('propio');
    expect(p0.poder).toBe(4);

    const p1 = cola[1] as PasoBurbuja;
    expect(p1.tipo).toBe('burbuja');
    expect(p1.lado).toBe('propio');
    expect(p1.poder).toBe(6);

    const p2 = cola[2] as PasoBurbuja;
    expect(p2.tipo).toBe('burbuja');
    expect(p2.lado).toBe('rival');
    expect(p2.poder).toBe(8);

    const p3 = cola[3] as PasoZona;
    expect(p3.tipo).toBe('zona');
    expect(p3.lugar).toBe('izquierda');

    const p4 = cola[4] as PasoBurbuja;
    expect(p4.tipo).toBe('burbuja');
    expect(p4.lugar).toBe('derecha');
    expect(p4.lado).toBe('propio');
    expect(p4.poder).toBe(3);

    const p5 = cola[5] as PasoBurbuja;
    expect(p5.tipo).toBe('burbuja');
    expect(p5.lugar).toBe('derecha');
    expect(p5.lado).toBe('rival');
    expect(p5.poder).toBe(5);

    const p6 = cola[6] as PasoZona;
    expect(p6.tipo).toBe('zona');
    expect(p6.lugar).toBe('derecha');

    expect(cola[7].tipo).toBe('cambio-zonas');

    const p8 = cola[8] as PasoBarra;
    expect(p8.tipo).toBe('barra');
    expect(p8.puntosPropio).toBe(15);
    expect(p8.puntosRival).toBe(10);
  });

  it('no debe generar burbujas para cartas ocultas o sin poder definido', () => {
    const cartaOculta = crearCartaMock('oculta', 7, true);
    const cartasPorLugar: Record<NombreLugar, ContextoCartasLugar> = {
      izquierda: {
        propio: [cartaOculta, null],
        rival: [null],
      },
      derecha: {
        propio: [],
        rival: [],
      },
    };

    const cola = construirColaPasos(lugares, cartasPorLugar, resultadoRondaMock);
    const burbujas = cola.filter((p) => p.tipo === 'burbuja');

    expect(burbujas).toHaveLength(0);
  });

  it('funciona correctamente con zonas sin cartas (salta directamente a resolucion de zona, cambio y barra)', () => {
    const cartasPorLugar: Record<NombreLugar, ContextoCartasLugar> = {
      izquierda: { propio: [], rival: [] },
      derecha: { propio: [], rival: [] },
    };

    const cola = construirColaPasos(lugares, cartasPorLugar, resultadoRondaMock);

    expect(cola).toHaveLength(4); // zona izquierda, zona derecha, cambio-zonas, barra puntos
    expect(cola[0].tipo).toBe('zona');
    expect(cola[1].tipo).toBe('zona');
    expect(cola[2].tipo).toBe('cambio-zonas');
    expect(cola[3].tipo).toBe('barra');
  });

  it('detecta aumento y reducción de poder en cartas con efecto y genera el paso inicial efectos-cartas', () => {
    const cartaBuff: Carta = { ...crearCartaMock('buff', 8), poderBase: 5 };
    const cartaDebuff: Carta = { ...crearCartaMock('debuff', 3), poderBase: 6 };
    const cartasPorLugar: Record<NombreLugar, ContextoCartasLugar> = {
      izquierda: { propio: [cartaBuff, cartaDebuff], rival: [] },
      derecha: { propio: [], rival: [] },
    };

    const cola = construirColaPasos(lugares, cartasPorLugar, resultadoRondaMock);
    expect(cola[0].tipo).toBe('efectos-cartas');
    if (cola[0].tipo === 'efectos-cartas') {
      expect(cola[0].modificaciones).toHaveLength(2);
      expect(cola[0].modificaciones[0].tipo).toBe('aumento');
      expect(cola[0].modificaciones[0].delta).toBe(3);
      expect(cola[0].modificaciones[1].tipo).toBe('reduccion');
      expect(cola[0].modificaciones[1].delta).toBe(-3);
    }

    const b0 = cola[1] as PasoBurbuja;
    expect(b0.tipo).toBe('burbuja');
    expect(b0.modificador).toBe('aumento');
    expect(b0.deltaPoder).toBe(3);

    const b1 = cola[2] as PasoBurbuja;
    expect(b1.tipo).toBe('burbuja');
    expect(b1.modificador).toBe('reduccion');
    expect(b1.deltaPoder).toBe(-3);
  });

  it('soporta 6 cartas por lado en una misma zona sin errores', () => {
    const seisPropias = Array.from({ length: 6 }, (_, i) => crearCartaMock(`p${i}`, i + 1));
    const seisRivales = Array.from({ length: 6 }, (_, i) => crearCartaMock(`r${i}`, i + 2));

    const cartasPorLugar: Record<NombreLugar, ContextoCartasLugar> = {
      izquierda: { propio: seisPropias, rival: seisRivales },
      derecha: { propio: [], rival: [] },
    };

    const cola = construirColaPasos(lugares, cartasPorLugar, resultadoRondaMock);
    const burbujas = cola.filter((p) => p.tipo === 'burbuja');

    expect(burbujas).toHaveLength(12);
  });
});
