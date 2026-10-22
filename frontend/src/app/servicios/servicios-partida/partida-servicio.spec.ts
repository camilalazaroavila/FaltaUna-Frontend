import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import type { Carta } from '@modelos/carta.model';
import type {
  ConfirmarFinDeRondaRespuestaApi,
  JugarCartaRespuestaApi,
  PartidaEstadoApi,
  ZonaEstadoApi,
} from '@modelos/partida.model';
import { BarajaService } from '@servicios/baraja.service';
import { PartidaApiService } from './partida-api.service';
import { PartidaServicio } from './partida-servicio';

const ZONA_IZQUIERDA: ZonaEstadoApi = {
  zonaPartidaId: 10,
  zonaId: 1,
  nombre: 'Grido',
  posicionInicial: 'ZONA_1',
  poderPropio: 10,
  poderRival: 4,
  bonusPorCategoria: { '1': 2 },
};

const ZONA_DERECHA: ZonaEstadoApi = {
  zonaPartidaId: 11,
  zonaId: 2,
  nombre: 'Lego',
  posicionInicial: 'ZONA_2',
  poderPropio: 0,
  poderRival: 0,
  bonusPorCategoria: {},
};

const estadoBase = () => ({
  partidaId: 7,
  estado: 'EN_CURSO',
  puntosObjetivo: 100,
  rondaActual: {
    numero: 1,
    fechaInicio: '2026-10-21T00:00:00Z',
    fechaFin: '2026-10-21T00:00:40Z',
    segundosRestantes: 40,
  },
  miJugador: {
    usuarioId: 1,
    manaActual: 3,
    puntosAcumulados: 10,
    confirmoRonda: false,
    mano: [
      {
        cartaId: 100,
        nombre: 'Super Grido',
        costoMana: 2,
        poder: 9,
        categoriaId: 1,
        estado: 'EN_MANO',
      },
      { cartaId: 101, nombre: 'Auradías', costoMana: 1, poder: 7, categoriaId: 1, estado: 'EN_MANO' },
    ],
  },
  rival: { usuarioId: 2, esBot: true, manaActual: 3, puntosAcumulados: 4 },
  zonas: [ZONA_IZQUIERDA, ZONA_DERECHA],
  ganadorId: null,
  fechaFin: null,
});

const estadoApi = (overrides: Partial<PartidaEstadoApi> = {}): PartidaEstadoApi => ({
  ...estadoBase(),
  ...overrides,
});

/** Doble de `PartidaApiService` con sus métodos como mocks de Jest. */
type PartidaApiDouble = {
  [K in keyof PartidaApiService]: jest.Mock;
};

describe('PartidaServicio', () => {
  let servicio: PartidaServicio;
  let partidaApi: PartidaApiDouble;
  let http: HttpTestingController;

  const cartaDeMano = (): Carta => ({
    id: '100',
    nombre: 'Super Grido',
    imagenUrl: '',
    rareza: 'comun',
    categoria: 'gastronomia',
    atributoIzquierdo: 9,
    atributoDerecho: 2,
    obtenida: true,
  });

  beforeEach(() => {
    partidaApi = {
      iniciarContraBot: jest.fn(),
      obtenerEstado: jest.fn(),
      jugarCarta: jest.fn(),
      confirmarFinDeRonda: jest.fn(),
      cerrarRondaVencida: jest.fn(),
    } as unknown as PartidaApiDouble;

    const baraja = {
      obtenerMazoActual: jest.fn().mockReturnValue(
        of({ id: 3, nombre: 'Mi mazo', completo: true, cartas: [] }),
      ),
      obtenerCartasDisponibles: jest.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PartidaApiService, useValue: partidaApi },
        { provide: BarajaService, useValue: baraja },
      ],
    });

    servicio = TestBed.inject(PartidaServicio);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('modo mock', () => {
    it('arranca en modo mock y delega en el servicio de estado', () => {
      expect(servicio.modoReal()).toBe(false);
      expect(servicio.lugares().izquierda.zona.nombre).toBe('Grido');
    });

    it('jugarCarta delega en el mock', () => {
      const carta = servicio.manoPropia()[0];
      const jugada = servicio.jugarCarta(carta, 'izquierda', 3);

      expect(jugada).toBe(true);
      expect(servicio.lugares().izquierda.propio[3]?.id).toBe(carta.id);
      expect(partidaApi.jugarCarta).not.toHaveBeenCalled();
    });
  });

  describe('modo real', () => {
    /** Crea la partida contra el bot y deja la fachada en modo real. */
    const activarModoReal = (estado: PartidaEstadoApi = estadoApi()): void => {
      partidaApi.iniciarContraBot.mockReturnValue(
        of({
          partidaId: estado.partidaId,
          estado: estado.estado,
          zonasReveladas: [],
          manoPropia: { usuarioId: 1, mazoId: 3, manaActual: 3, cartas: [] },
          rival: { usuarioId: 2, mazoId: 4 },
        }),
      );
      partidaApi.obtenerEstado.mockReturnValue(of(estado));

      servicio.iniciarContraBot().subscribe();

      // Las categorías del catálogo se piden aparte: se responden vacías.
      http.expectOne((req) => req.url.endsWith('/Categorias')).flush([]);
    };

    beforeEach(() => {
      // El servidor ya saca la carta jugada de la mano y suma su poder a la zona.
      partidaApi.jugarCarta.mockReturnValue(
        of({
          manaRestante: 1,
          estado: estadoApi({
            miJugador: {
              ...estadoBase().miJugador,
              manaActual: 1,
              mano: [estadoBase().miJugador.mano[1]],
            },
            zonas: [{ ...ZONA_IZQUIERDA, poderPropio: 19 }, ZONA_DERECHA],
          }),
        } satisfies JugarCartaRespuestaApi),
      );
    });

    it('crea la partida y pasa a modo real', () => {
      activarModoReal();

      expect(servicio.modoReal()).toBe(true);
      expect(servicio.partidaId()).toBe(7);
    });

    it('mapea el estado del servidor a los lugares del tablero', () => {
      activarModoReal();

      const lugares = servicio.lugares();

      expect(lugares.izquierda.zona.nombre).toBe('Grido');
      expect(lugares.izquierda.zona.zonaPartidaId).toBe(10);
      expect(lugares.derecha.zona.nombre).toBe('Lego');
      expect(lugares.izquierda.propio).toHaveLength(6);
    });

    it('usa el poder del servidor sin intercambiar los lados', () => {
      activarModoReal();

      const puntajes = servicio.puntajes();

      // `poderPropio` y `poderRival` ya vienen desde la perspectiva del jugador.
      expect(puntajes.izquierda.propio).toBe(10);
      expect(puntajes.izquierda.rival).toBe(4);
      expect(puntajes.izquierda.estadoPropio).toBe('ganando');
    });

    it('baja la carta con eco optimista y la saca de la mano', () => {
      activarModoReal();

      const carta = cartaDeMano();
      const jugada = servicio.jugarCarta(carta, 'izquierda', 2);

      expect(jugada).toBe(true);
      expect(servicio.lugares().izquierda.propio[2]?.id).toBe('100');
      expect(servicio.manoPropia().some((enMano) => enMano.id === '100')).toBe(false);
      expect(partidaApi.jugarCarta).toHaveBeenCalledWith(7, 100, 10, 1);
    });

    it('no baja dos cartas al mismo slot', () => {
      activarModoReal();

      expect(servicio.jugarCarta(cartaDeMano(), 'izquierda', 2)).toBe(true);

      const otra: Carta = { ...cartaDeMano(), id: '101', nombre: 'Auradías' };

      expect(servicio.jugarCarta(otra, 'izquierda', 2)).toBe(false);
    });

    it('revierte el eco optimista si el servidor rechaza la carta', () => {
      activarModoReal();
      partidaApi.jugarCarta.mockReturnValue(
        throwError(() => ({ error: { mensaje: 'No tenés maná suficiente.' } })),
      );

      const carta = cartaDeMano();

      expect(servicio.jugarCarta(carta, 'izquierda', 2)).toBe(true);
      expect(servicio.lugares().izquierda.propio[2]).toBeNull();
      expect(servicio.manoPropia().some((enMano) => enMano.id === '100')).toBe(true);
      expect(servicio.error()).toBe('No tenés maná suficiente.');
    });

    it('traduce el resultado de ronda al jugador que consulta', () => {
      activarModoReal();
      partidaApi.confirmarFinDeRonda.mockReturnValue(
        of({
          esperandoRival: false,
          resultado: {
            numeroRonda: 1,
            partidaTerminada: false,
            ganadorId: null,
            zonas: [
              { zonaPartidaId: 10, poderJugador1: 12, poderJugador2: 5 },
              { zonaPartidaId: 11, poderJugador1: 4, poderJugador2: 9 },
            ],
          },
          estado: estadoApi(),
        } satisfies ConfirmarFinDeRondaRespuestaApi),
      );

      servicio.marcarListo();

      const resultado = servicio.resultadoRonda();

      // El jugador que consulta es el de `UsuarioId` menor, o sea el "jugador 1".
      expect(resultado?.zonas[0].propio).toBe(12);
      expect(resultado?.zonas[0].rival).toBe(5);
      expect(resultado?.zonas[1].propio).toBe(4);
      expect(resultado?.zonas[1].rival).toBe(9);
    });

    it('marca la partida como terminada cuando el servidor manda el ganador', () => {
      activarModoReal(
        estadoApi({
          estado: 'FINALIZADA',
          ganadorId: 1,
          fechaFin: '2026-10-21T00:05:00Z',
          miJugador: { ...estadoBase().miJugador, puntosAcumulados: 80 },
          rival: { ...estadoBase().rival, puntosAcumulados: 40 },
        }),
      );

      expect(servicio.terminada()).toBe(true);
      expect(servicio.gane()).toBe(true);
    });

    it('no deja jugar cuando la partida ya terminó', () => {
      activarModoReal(
        estadoApi({ estado: 'FINALIZADA', ganadorId: 2, fechaFin: '2026-10-21T00:05:00Z' }),
      );

      expect(servicio.jugarCarta(cartaDeMano(), 'izquierda', 2)).toBe(false);
    });
  });
});
