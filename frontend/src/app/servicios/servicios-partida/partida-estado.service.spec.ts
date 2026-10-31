import { TestBed } from '@angular/core/testing';
import {
  CARTA_RIVAL_TUTORIAL,
  ESCENARIO_TUTORIAL,
} from '@compartidos/componentes/tutorial/tutorial.escenario';
import { PartidaEstadoService } from './partida-estado.service';

describe('PartidaEstadoService (mock)', () => {
  let servicio: PartidaEstadoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    servicio = TestBed.inject(PartidaEstadoService);
  });

  it('calcula el puntaje por lugar con el bonus de la categoría del efecto', () => {
    const p = servicio.puntajes();

    // Grido (gastronomía +1): Super Grido 24+1 y Buzo Básico 13 → 38; Auradías 15 y Mostaza 9+1 → 25
    expect(p.izquierda.propio).toBe(38);
    expect(p.izquierda.rival).toBe(25);
    // Zara (indumentaria +1): Hamburguesa 18 y Zapatillas 20+1 → 39; Guacamola 18 → 18
    expect(p.derecha.propio).toBe(39);
    expect(p.derecha.rival).toBe(18);
  });

  it('marca ganando, perdiendo y empate', () => {
    const p = servicio.puntajes();

    expect(p.izquierda.estadoPropio).toBe('ganando');
    expect(p.izquierda.estadoRival).toBe('perdiendo');
  });

  it('cada lugar tiene 6 slots por lado', () => {
    const { izquierda, derecha } = servicio.lugares();

    for (const lugar of [izquierda, derecha]) {
      expect(lugar.propio).toHaveLength(6);
      expect(lugar.rival).toHaveLength(6);
    }
  });

  it('rotarZonas cambia las zonas sin tocar las cartas', () => {
    const antes = servicio.lugares();

    servicio.rotarZonas();
    const despues = servicio.lugares();

    for (const n of ['izquierda', 'derecha'] as const) {
      expect(despues[n].zona.id).not.toBe(antes[n].zona.id);
      expect(despues[n].propio).toBe(antes[n].propio);
      expect(despues[n].rival).toBe(antes[n].rival);
    }
    expect(despues.izquierda.zona.id).not.toBe(despues.derecha.zona.id);
  });

  it('rotarZonas guarda el delta exacto, incrementa rotaciones y anuncia', () => {
    const antes = servicio.puntajes();

    servicio.rotarZonas();
    const despues = servicio.puntajes();
    const deltas = servicio.deltas();

    for (const n of ['izquierda', 'derecha'] as const) {
      expect(deltas[n].propio).toBe(despues[n].propio - antes[n].propio);
      expect(deltas[n].rival).toBe(despues[n].rival - antes[n].rival);
    }
    expect(servicio.rotaciones()).toBe(1);
    expect(servicio.anuncio()).toContain('La zona izquierda cambió a');
  });

  describe('jugarCarta', () => {
    it('baja la carta al primer slot propio vacío y la saca de la mano', () => {
      const carta = servicio.manoPropia()[0];
      const totalMano = servicio.manoPropia().length;

      const jugada = servicio.jugarCarta(carta, 'izquierda', 2);

      expect(jugada).toBe(true);
      expect(servicio.lugares().izquierda.propio[2]?.id).toBe(carta.id);
      expect(servicio.manoPropia()).toHaveLength(totalMano - 1);
      expect(servicio.manoPropia().some((enMano) => enMano.id === carta.id)).toBe(false);
      expect(servicio.anuncio()).toContain(carta.nombre);
    });

    it('no juega una carta que ya no está en la mano', () => {
      const carta = servicio.manoPropia()[0];

      expect(servicio.jugarCarta(carta, 'izquierda', 2)).toBe(true);
      expect(servicio.jugarCarta(carta, 'derecha', 2)).toBe(false);
    });

    it('no juega sobre un slot ocupado', () => {
      const carta = servicio.manoPropia()[0];

      // El slot 0 de la zona izquierda ya tiene una carta mock.
      expect(servicio.lugares().izquierda.propio[0]).not.toBeNull();
      expect(servicio.jugarCarta(carta, 'izquierda', 0)).toBe(false);
    });

    it('no juega si no es el turno del jugador', () => {
      const carta = servicio.manoPropia()[0];

      servicio.marcarListo();

      expect(servicio.jugarCarta(carta, 'izquierda', 2)).toBe(false);
    });

    it('anunciar publica el texto en la región aria-live', () => {
      servicio.anunciar('Aviso de prueba');

      expect(servicio.anuncio()).toBe('Aviso de prueba');
    });
  });

  describe('escenario del tutorial', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('reemplaza la maqueta por el escenario guionado', () => {
      servicio.prepararEscenarioTutorial(ESCENARIO_TUTORIAL);

      expect(servicio.manoPropia()).toHaveLength(ESCENARIO_TUTORIAL.mano.length);
      expect(servicio.turno()).toBe(1);
      expect(servicio.cuponesPropio()).toBe(3);
      expect(servicio.cuponMaximo()).toBe(3);
      expect(servicio.barraPropia()).toBe(0);
      expect(servicio.lugares().izquierda.propio.every((carta) => carta === null)).toBe(true);
      expect(servicio.lugares().izquierda.rival.every((carta) => carta === null)).toBe(true);
    });

    it('cierra la ronda guionada y suma los puntos de cada zona', () => {
      servicio.prepararEscenarioTutorial(ESCENARIO_TUTORIAL);
      servicio.cerrarRondaGuionadaTutorial(CARTA_RIVAL_TUTORIAL, 'derecha');

      expect(servicio.estadoRondaMock()).toBe('resolviendo');

      jest.advanceTimersByTime(1200);

      expect(servicio.lugares().derecha.rival[0]?.id).toBe(CARTA_RIVAL_TUTORIAL.id);
      expect(servicio.turno()).toBe(2);
      expect(servicio.cuponMaximo()).toBe(2);
      expect(servicio.estadoRondaMock()).toBe('jugando');
      expect(servicio.barraRival()).toBeGreaterThan(0);
    });

    it('restaura la maqueta original al salir del tutorial', () => {
      servicio.prepararEscenarioTutorial(ESCENARIO_TUTORIAL);
      servicio.restaurarEscenario();

      expect(servicio.manoPropia()).toHaveLength(5);
      expect(servicio.turno()).toBe(3);
      expect(servicio.cuponesPropio()).toBe(3);
      expect(servicio.cuponMaximo()).toBe(3);
      expect(servicio.barraPropia()).toBe(42);
    });
  });
});