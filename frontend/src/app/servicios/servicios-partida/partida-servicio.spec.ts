import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import type { Carta } from '@modelos/carta.model';
import type {
  CartaApi,
  EstadoPartidaApi,
  GanadorPartida,
  JugadorPartidaApi,
  ResultadoRondaApi,
  ZonaPartidaApi,
} from '@modelos/partida.model';
import { PartidaApiService } from './partida-api.service';
import { PartidaServicio } from './partida-servicio';

jest.mock('ngx-sonner', () => ({
  toast: { error: jest.fn(), info: jest.fn() },
}));

const cartaApi = (overrides: Partial<CartaApi> = {}): CartaApi => ({
  cartaId: 100,
  nombre: 'Super Grido',
  descripcion: null,
  poder: 9,
  costoCupon: 2,
  rareza: 'Común',
  categoria: 'Comida',
  imagenUrl: null,
  habilidad: null,
  ...overrides,
});

const jugadorApi = (overrides: Partial<JugadorPartidaApi> = {}): JugadorPartidaApi => ({
  jugadorPartidaId: 1,
  usuarioId: 1,
  nombre: 'Gonzamirko',
  avatarUrl: null,
  esBot: false,
  puntosTotales: 10,
  cuponActual: 3,
  cuponMaximo: 1,
  listo: false,
  cartasEnMano: 2,
  cartasEnMazo: 10,
  ...overrides,
});

const zonaApi = (
  zonaPartidaId: number,
  lugar: string,
  nombre: string,
  puntajePropio: number,
  puntajeRival: number,
  ganador: GanadorPartida = 'propio',
): ZonaPartidaApi => ({
  zonaPartidaId,
  nombre,
  lugar,
  imagenUrl: null,
  efecto: null,
  tipoEfecto: 'NINGUNO',
  puntajePropio,
  puntajeRival,
  diferencia: puntajePropio - puntajeRival,
  ganador,
  cartas: [],
});

const estadoApi = (overrides: Partial<EstadoPartidaApi> = {}): EstadoPartidaApi => ({
  partidaId: 7,
  estado: 'en-curso',
  modo: 'bot',
  ronda: 1,
  rondasTotales: 6,
  fase: 'jugando',
  finDeRonda: null,
  puntosMaximos: 100,
  jugadorPropio: jugadorApi(),
  rival: jugadorApi({
    jugadorPartidaId: 2,
    usuarioId: null,
    nombre: 'Bot',
    esBot: true,
    puntosTotales: 4,
    cartasEnMano: 3,
  }),
  zonas: [zonaApi(10, 'izquierda', 'Grido', 10, 4), zonaApi(11, 'derecha', 'Lego', 0, 0, 'empate')],
  cartasEnMesa: [],
  manoPropia: [
    { cartaPartidaId: 11, carta: cartaApi(), jugable: true },
    { cartaPartidaId: 12, carta: cartaApi({ cartaId: 101, nombre: 'Auradías' }), jugable: true },
  ],
  ultimoResultado: null,
  segundosRestantes: 40,
  ...overrides,
});

const resultadoApi = (overrides: Partial<ResultadoRondaApi> = {}): ResultadoRondaApi => ({
  ronda: 1,
  cartasReveladas: [],
  efectos: [],
  zonas: [
    {
      zonaPartidaId: 10,
      puntajePropio: 12,
      puntajeRival: 5,
      diferencia: 7,
      puntosGanadosPropio: 7,
      puntosGanadosRival: 0,
      ganador: 'propio',
    },
    {
      zonaPartidaId: 11,
      puntajePropio: 4,
      puntajeRival: 9,
      diferencia: -5,
      puntosGanadosPropio: 0,
      puntosGanadosRival: 5,
      ganador: 'rival',
    },
  ],
  puntosTotalesPropio: 17,
  puntosTotalesRival: 14,
  zonasNuevas: [zonaApi(20, 'izquierda', 'Sony', 0, 0, 'empate')],
  cartaRobada: null,
  cuponNuevoPropio: 2,
  cuponNuevoRival: 2,
  fin: null,
  ...overrides,
});

/** Doble de `PartidaApiService` con todos sus métodos como mocks de Jest. */
type PartidaApiDouble = {
  [K in keyof PartidaApiService]: jest.Mock;
};

describe('PartidaServicio', () => {
  let servicio: PartidaServicio;
  let partidaApi: PartidaApiDouble;

  const crearApi = (): PartidaApiDouble =>
    ({
      iniciarContraBot: jest.fn(),
      obtenerEstado: jest.fn().mockImplementation(() => of(estadoApi())),
      enviarLatido: jest.fn().mockReturnValue(of({ ahora: '2026-10-22T00:00:00Z' })),
      jugarCarta: jest.fn(),
      retirarCarta: jest.fn(),
      finalizar: jest.fn(),
      rendirse: jest.fn(),
      abandonar: jest.fn(),
      obtenerResultado: jest.fn(),
    }) as unknown as PartidaApiDouble;

  const iniciar = (estado: EstadoPartidaApi = estadoApi()): void => {
    partidaApi.iniciarContraBot.mockReturnValue(of(estado));
    partidaApi.obtenerEstado.mockReturnValue(of(estado));
    servicio.iniciarContraBot(3).subscribe();
  };

  const cartaDeMano = (): Carta => ({
    id: 'cp-11',
    cartaId: 100,
    cartaPartidaId: 11,
    nombre: 'Super Grido',
    imagenUrl: '',
    rareza: 'comun',
    categoria: 'gastronomia',
    atributoIzquierdo: 9,
    atributoDerecho: 2,
    obtenida: true,
    jugable: true,
  });

  beforeEach(() => {
    localStorage.clear();
    partidaApi = crearApi();

    TestBed.configureTestingModule({
      providers: [{ provide: PartidaApiService, useValue: partidaApi }],
    });

    servicio = TestBed.inject(PartidaServicio);
  });

  afterEach(() => {
    servicio.detenerSincronizacion();
    TestBed.resetTestingModule();
    localStorage.clear();
    jest.useRealTimers();
  });

  describe('modo mock', () => {
    it('arranca en modo mock y delega en el servicio de estado', () => {
      expect(servicio.modoReal()).toBe(false);
      expect(servicio.lugares().izquierda.zona.nombre).toBe('Grido');
    });

    it('jugarCarta delega en el mock sin llamar a la API', () => {
      const carta = servicio.manoPropia()[0];
      const jugada = servicio.jugarCarta(carta, 'izquierda', 3);

      expect(jugada).toBe(true);
      expect(servicio.lugares().izquierda.propio[3]?.id).toBe(carta.id);
      expect(partidaApi.jugarCarta).not.toHaveBeenCalled();
    });
  });

  describe('modo real', () => {
    it('crea la partida con el mazo elegido y pasa a modo real', () => {
      iniciar();

      expect(partidaApi.iniciarContraBot).toHaveBeenCalledWith(3);
      expect(servicio.modoReal()).toBe(true);
      expect(servicio.partidaId()).toBe(7);
      expect(localStorage.getItem('faltauna_partida_activa')).toBe('7');
    });

    it('ignora la creación si se abandonó antes de que llegue la respuesta', () => {
      const respuesta = new Subject<EstadoPartidaApi>();
      partidaApi.iniciarContraBot.mockReturnValue(respuesta.asObservable());

      servicio.iniciarContraBot(3).subscribe();
      servicio.abandonarPartida();

      respuesta.next(estadoApi());
      respuesta.complete();

      expect(servicio.modoReal()).toBe(false);
      expect(servicio.partidaId()).toBeNull();
      expect(localStorage.getItem('faltauna_partida_activa')).toBeNull();
    });

    it('mapea zonas, puntajes y mano con los valores del servidor', () => {
      iniciar();

      const lugares = servicio.lugares();
      const puntajes = servicio.puntajes();

      expect(lugares.izquierda.zona.nombre).toBe('Grido');
      expect(lugares.izquierda.zona.zonaPartidaId).toBe(10);
      expect(lugares.izquierda.propio).toHaveLength(6);
      expect(puntajes.izquierda.propio).toBe(10);
      expect(puntajes.izquierda.rival).toBe(4);
      expect(puntajes.izquierda.estadoPropio).toBe('ganando');
      expect(servicio.manoPropia()).toHaveLength(2);
      expect(servicio.manoPropia()[0].id).toBe('cp-11');
      expect(servicio.deltaPuntosPropio()).toBeNull();
      expect(servicio.deltaPuntosRival()).toBeNull();
    });

    it('muestra como reverso las cartas ocultas del rival', () => {
      iniciar(
        estadoApi({
          cartasEnMesa: [
            {
              cartaPartidaId: 50,
              zonaPartidaId: 10,
              indice: 0,
              lado: 'rival',
              oculta: true,
              carta: null,
              poderActual: null,
            },
          ],
        }),
      );

      const carta = servicio.lugares().izquierda.rival[0];

      expect(carta?.oculta).toBe(true);
      expect(carta?.nombre).toBe('Carta oculta');
      expect(carta?.atributoIzquierdo).toBe(0);
    });

    it('aplica la jugada de forma optimista y la confirma con el estado del servidor', () => {
      iniciar();

      const respuesta = new Subject<EstadoPartidaApi>();
      partidaApi.jugarCarta.mockReturnValue(respuesta);

      expect(servicio.jugarCarta(cartaDeMano(), 'izquierda', 2)).toBe(true);
      expect(servicio.lugares().izquierda.propio[2]?.cartaId).toBe(100);
      expect(servicio.manoPropia()).toHaveLength(1);
      expect(servicio.cuponesPropio()).toBe(1);

      respuesta.next(
        estadoApi({
          cartasEnMesa: [
            {
              cartaPartidaId: 11,
              zonaPartidaId: 10,
              indice: 2,
              lado: 'propio',
              oculta: false,
              carta: cartaApi(),
              poderActual: 9,
            },
          ],
          manoPropia: [estadoApi().manoPropia[1]],
          jugadorPropio: jugadorApi({ cuponActual: 1 }),
        }),
      );
      respuesta.complete();

      expect(servicio.lugares().izquierda.propio[2]?.cartaId).toBe(100);
      expect(servicio.manoPropia()).toHaveLength(1);
      expect(servicio.cuponesPropio()).toBe(1);
      expect(servicio.enviandoCarta()).toBe(false);
    });

    it('permite retirar una carta provisional antes de finalizar', () => {
      iniciar();
      const respuesta = new Subject<EstadoPartidaApi>();
      partidaApi.jugarCarta.mockReturnValue(respuesta);
      partidaApi.retirarCarta.mockReturnValue(of(estadoApi()));

      servicio.jugarCarta(cartaDeMano(), 'izquierda', 2);
      expect(servicio.lugares().izquierda.propio[2]?.cartaId).toBe(100);

      const cartaEnMesa = servicio.lugares().izquierda.propio[2]!;
      expect(servicio.esCartaProvisional(cartaEnMesa)).toBe(true);

      const res = servicio.retirarCarta(cartaEnMesa);
      expect(res).toBe(true);
      expect(partidaApi.retirarCarta).toHaveBeenCalledWith(
        7,
        11,
        expect.stringMatching(/^retirar-/),
      );
    });

    it('no permite retirar una carta del rival o confirmada', () => {
      iniciar();
      const cartaRival = {
        id: 999,
        cartaPartidaId: 999,
        nombre: 'Rival Card',
        descripcion: '',
        imagenUrl: '',
        costoCupon: 1,
        poderBase: 3,
        jugable: false,
        lado: 'rival' as const,
        oculta: false,
      };

      expect(servicio.esCartaProvisional(cartaRival as any)).toBe(false);
      expect(servicio.retirarCarta(cartaRival as any)).toBe(false);
      expect(partidaApi.retirarCarta).not.toHaveBeenCalled();
    });

    it('envía la jugada con ids, zona, slot, ronda e idempotencia', () => {
      iniciar();
      partidaApi.jugarCarta.mockReturnValue(of(estadoApi()));

      servicio.jugarCarta(cartaDeMano(), 'izquierda', 2);

      expect(partidaApi.jugarCarta).toHaveBeenCalledWith(
        7,
        {
          cartaId: 100,
          cartaPartidaId: 11,
          zonaPartidaId: 10,
          indice: 2,
          numeroRonda: 1,
        },
        expect.stringMatching(/^jugar-/),
      );
    });

    it('rechaza cartas no jugables, zonas sin id y slots ocupados', () => {
      iniciar(
        estadoApi({
          cartasEnMesa: [
            {
              cartaPartidaId: 90,
              zonaPartidaId: 10,
              indice: 2,
              lado: 'propio',
              oculta: false,
              carta: cartaApi(),
              poderActual: 9,
            },
          ],
          manoPropia: [{ cartaPartidaId: 11, carta: cartaApi(), jugable: false }],
        }),
      );

      expect(servicio.jugarCarta(cartaDeMano(), 'izquierda', 2)).toBe(false);
      expect(partidaApi.jugarCarta).not.toHaveBeenCalled();
    });

    it('muestra el error del servidor sin dejar cambios locales', () => {
      iniciar();
      partidaApi.jugarCarta.mockReturnValue(
        throwError(() => ({ status: 400, error: { mensaje: 'No tenés cupones suficientes.' } })),
      );

      expect(servicio.jugarCarta(cartaDeMano(), 'izquierda', 2)).toBe(true);

      expect(servicio.lugares().izquierda.propio[2]).toBeNull();
      expect(servicio.manoPropia()).toHaveLength(2);
      expect(servicio.error()).toBe('No tenés cupones suficientes.');
      expect(servicio.enviandoCarta()).toBe(false);
    });

    it('cierra la ronda y adapta el resultado sin recalcular puntajes', () => {
      iniciar();
      partidaApi.finalizar.mockReturnValue(of(resultadoApi()));
      partidaApi.obtenerEstado.mockReturnValue(
        of(
          estadoApi({
            ronda: 2,
            ultimoResultado: resultadoApi(),
            jugadorPropio: jugadorApi({ cuponActual: 2, cuponMaximo: 2 }),
          }),
        ),
      );

      servicio.marcarListo();

      expect(partidaApi.finalizar).toHaveBeenCalledWith(7, 1, expect.stringMatching(/^finalizar-/));

      const resultado = servicio.resultadoRonda();

      expect(resultado?.numero).toBe(1);
      expect(resultado?.zonas[0].propio).toBe(12);
      expect(resultado?.zonas[0].rival).toBe(5);
      expect(resultado?.zonas[1].propio).toBe(4);
      expect(resultado?.zonas[1].rival).toBe(9);
      expect(resultado?.puntosPropio).toBe(17);
      expect(resultado?.puntosRival).toBe(14);
      expect(servicio.deltas().izquierda).toEqual({ propio: 7, rival: 0 });
      expect(servicio.deltas().derecha).toEqual({ propio: 0, rival: 5 });
      expect(servicio.deltaPuntosPropio()).toBe(7);
      expect(servicio.deltaPuntosRival()).toBe(5);
      expect(servicio.turno()).toBe(2);
    });

    it('jugar carta y finalizar: la carta sigue en su slot', () => {
      iniciar();
      const respuestaJugar = new Subject<EstadoPartidaApi>();
      partidaApi.jugarCarta.mockReturnValue(respuestaJugar);

      servicio.jugarCarta(cartaDeMano(), 'izquierda', 2);
      respuestaJugar.next(
        estadoApi({
          cartasEnMesa: [
            {
              cartaPartidaId: 11,
              zonaPartidaId: 10,
              indice: 2,
              lado: 'propio',
              oculta: false,
              carta: cartaApi(),
              poderActual: 9,
            },
          ],
          manoPropia: [estadoApi().manoPropia[1]],
        }),
      );
      respuestaJugar.complete();

      expect(servicio.lugares().izquierda.propio[2]?.cartaId).toBe(100);

      partidaApi.finalizar.mockReturnValue(of(resultadoApi()));
      partidaApi.obtenerEstado.mockReturnValue(
        of(
          estadoApi({
            ronda: 2,
            cartasEnMesa: [
              {
                cartaPartidaId: 11,
                zonaPartidaId: 10,
                indice: 2,
                lado: 'propio',
                oculta: false,
                carta: cartaApi(),
                poderActual: 9,
              },
            ],
            ultimoResultado: resultadoApi(),
          }),
        ),
      );

      servicio.marcarListo();
      expect(servicio.lugares().izquierda.propio[2]?.cartaId).toBe(100);
    });

    it('los puntos totales se acumulan entre rondas', () => {
      iniciar();
      partidaApi.finalizar.mockReturnValue(of(resultadoApi()));
      partidaApi.obtenerEstado.mockReturnValue(
        of(
          estadoApi({
            ronda: 2,
            jugadorPropio: jugadorApi({ puntosTotales: 17 }),
            rival: jugadorApi({ puntosTotales: 14, esBot: true }),
            ultimoResultado: resultadoApi(),
          }),
        ),
      );

      servicio.marcarListo();
      expect(servicio.barraPropia()).toBe(17);
      expect(servicio.barraRival()).toBe(14);

      partidaApi.finalizar.mockReturnValue(
        of(
          resultadoApi({
            ronda: 2,
            puntosTotalesPropio: 24,
            puntosTotalesRival: 19,
            zonas: [
              {
                zonaPartidaId: 20,
                puntajePropio: 7,
                puntajeRival: 5,
                diferencia: 2,
                puntosGanadosPropio: 7,
                puntosGanadosRival: 0,
                ganador: 'propio',
              },
            ],
            zonasNuevas: [zonaApi(30, 'izquierda', 'Nike', 0, 0, 'empate')],
          }),
        ),
      );
      partidaApi.obtenerEstado.mockReturnValue(
        of(
          estadoApi({
            ronda: 3,
            jugadorPropio: jugadorApi({ puntosTotales: 24 }),
            rival: jugadorApi({ puntosTotales: 19, esBot: true }),
            zonas: [zonaApi(30, 'izquierda', 'Nike', 0, 0, 'empate'), zonaApi(31, 'derecha', 'Adidas', 0, 0, 'empate')],
            ultimoResultado: resultadoApi({
              ronda: 2,
              puntosTotalesPropio: 24,
              puntosTotalesRival: 19,
              zonas: [
                {
                  zonaPartidaId: 20,
                  puntajePropio: 7,
                  puntajeRival: 5,
                  diferencia: 2,
                  puntosGanadosPropio: 7,
                  puntosGanadosRival: 0,
                  ganador: 'propio',
                },
              ],
              zonasNuevas: [zonaApi(30, 'izquierda', 'Nike', 0, 0, 'empate')],
            }),
          }),
        ),
      );

      servicio.marcarListo();
      expect(servicio.barraPropia()).toBe(24);
      expect(servicio.barraRival()).toBe(19);
    });

    it('cartas reveladas del rival aparecen en su lugar real', () => {
      iniciar();
      partidaApi.finalizar.mockReturnValue(
        of(
          resultadoApi({
            ronda: 1,
            cartasReveladas: [
              {
                cartaPartidaId: 77,
                zonaPartidaId: 11,
                indice: 1,
                lado: 'rival',
                oculta: false,
                carta: cartaApi({ cartaId: 200, nombre: 'Bot Card' }),
                poderActual: 6,
              },
            ],
          }),
        ),
      );
      partidaApi.obtenerEstado.mockReturnValue(
        of(
          estadoApi({
            ronda: 2,
            cartasEnMesa: [
              {
                cartaPartidaId: 77,
                zonaPartidaId: 11,
                indice: 1,
                lado: 'rival',
                oculta: true,
                carta: null,
                poderActual: null,
              },
            ],
            ultimoResultado: resultadoApi({
              ronda: 1,
              cartasReveladas: [
                {
                  cartaPartidaId: 77,
                  zonaPartidaId: 11,
                  indice: 1,
                  lado: 'rival',
                  oculta: false,
                  carta: cartaApi({ cartaId: 200, nombre: 'Bot Card' }),
                  poderActual: 6,
                },
              ],
            }),
          }),
        ),
      );

      servicio.marcarListo();
      const cartaRival = servicio.lugares().derecha.rival[1];
      expect(cartaRival?.oculta).toBeFalsy();
      expect(cartaRival?.nombre).toBe('Bot Card');
    });

    it('rotación de zonas: documentado el comportamiento de las cartas (se mantiene ubicación por lugar)', () => {
      iniciar();
      partidaApi.finalizar.mockReturnValue(
        of(
          resultadoApi({
            ronda: 1,
            zonasNuevas: [zonaApi(20, 'izquierda', 'Sony', 0, 0, 'empate'), zonaApi(21, 'derecha', 'Nintendo', 0, 0, 'empate')],
          }),
        ),
      );
      partidaApi.obtenerEstado.mockReturnValue(
        of(
          estadoApi({
            ronda: 2,
            zonas: [zonaApi(20, 'izquierda', 'Sony', 0, 0, 'empate'), zonaApi(21, 'derecha', 'Nintendo', 0, 0, 'empate')],
            cartasEnMesa: [
              {
                cartaPartidaId: 11,
                zonaPartidaId: 10,
                indice: 0,
                lado: 'propio',
                oculta: false,
                carta: cartaApi(),
                poderActual: 9,
              },
            ],
            ultimoResultado: resultadoApi({
              ronda: 1,
              zonasNuevas: [zonaApi(20, 'izquierda', 'Sony', 0, 0, 'empate'), zonaApi(21, 'derecha', 'Nintendo', 0, 0, 'empate')],
            }),
          }),
        ),
      );

      servicio.marcarListo();
      // Carta jugada en zonaPartidaId 10 (ronda anterior) debe seguir ubicada por mapa acumulado
      expect(servicio.lugares().izquierda.propio[0]?.cartaId).toBe(100);
    });

    it('respuesta de polling vieja no pisa un estado más nuevo', () => {
      jest.useFakeTimers();
      iniciar(estadoApi({ ronda: 2 }));
      partidaApi.obtenerEstado.mockReturnValue(of(estadoApi({ ronda: 1 })));

      jest.advanceTimersByTime(5000);
      expect(servicio.turno()).toBe(2);
    });

    it('marca la partida como terminada con el ganador del servidor', () => {
      const fin = {
        partidaId: 7,
        ganador: 'propio' as const,
        motivo: 'cien-puntos',
        puntosPropio: 100,
        puntosRival: 80,
        fechaFin: '2026-10-22T00:05:00Z',
      };

      iniciar(
        estadoApi({
          estado: 'finalizada',
          jugadorPropio: jugadorApi({ puntosTotales: 100 }),
          rival: jugadorApi({ puntosTotales: 80 }),
          ultimoResultado: resultadoApi({ fin }),
        }),
      );

      expect(servicio.terminada()).toBe(true);
      expect(servicio.gane()).toBe(true);
      expect(servicio.resultadoRonda()?.motivo).toBe('cien-puntos');
    });

    it('no deja jugar cuando la partida ya terminó', () => {
      iniciar(estadoApi({ estado: 'finalizada' }));

      expect(servicio.jugarCarta(cartaDeMano(), 'izquierda', 2)).toBe(false);
      expect(partidaApi.jugarCarta).not.toHaveBeenCalled();
    });

    it('reconecta la partida guardada', () => {
      localStorage.setItem('faltauna_partida_activa', '7');
      partidaApi.obtenerEstado.mockReturnValue(of(estadoApi()));

      servicio.reconectar().subscribe();

      expect(partidaApi.obtenerEstado).toHaveBeenCalledWith(7);
      expect(servicio.modoReal()).toBe(true);
      expect(servicio.partidaId()).toBe(7);
    });

    it('borra la partida guardada si el servidor ya no la encuentra', () => {
      localStorage.setItem('faltauna_partida_activa', '7');
      partidaApi.obtenerEstado.mockReturnValue(throwError(() => ({ status: 404 })));

      servicio.reconectar().subscribe();

      expect(servicio.modoReal()).toBe(false);
      expect(localStorage.getItem('faltauna_partida_activa')).toBeNull();
    });

    it('late cada 20 s y consulta el estado cada 5 s', () => {
      jest.useFakeTimers();
      const estado = estadoApi({ segundosRestantes: 100 });

      iniciar(estado);
      partidaApi.obtenerEstado.mockReturnValue(of(estado));

      jest.advanceTimersByTime(5000);
      expect(partidaApi.obtenerEstado).toHaveBeenCalledTimes(1);
      expect(partidaApi.enviarLatido).not.toHaveBeenCalled();

      jest.advanceTimersByTime(15000);
      expect(partidaApi.enviarLatido).toHaveBeenCalledTimes(1);
      expect(partidaApi.obtenerEstado).toHaveBeenCalledTimes(4);

      servicio.detenerSincronizacion();
      jest.advanceTimersByTime(20000);

      expect(partidaApi.enviarLatido).toHaveBeenCalledTimes(1);
    });

    it('limpia el estado local al abandonar', () => {
      iniciar();
      partidaApi.abandonar.mockReturnValue(of({}));

      servicio.abandonarPartida();

      expect(partidaApi.abandonar).toHaveBeenCalledWith(7, expect.stringMatching(/^abandonar-/));
      expect(servicio.modoReal()).toBe(false);
      expect(servicio.partidaId()).toBeNull();
      expect(localStorage.getItem('faltauna_partida_activa')).toBeNull();
    });

    it('abandonar() limpia el estado local y localStorage para permitir una nueva partida', () => {
      iniciar();
      partidaApi.abandonar.mockReturnValue(of({}));

      servicio.abandonar();

      expect(partidaApi.abandonar).toHaveBeenCalledWith(7, expect.stringMatching(/^abandonar-/));
      expect(servicio.modoReal()).toBe(false);
      expect(servicio.partidaId()).toBeNull();
      expect(localStorage.getItem('faltauna_partida_activa')).toBeNull();
    });

    it('reconectar() no reconecta a una partida ya finalizada y limpia localStorage', () => {
      localStorage.setItem('faltauna_partida_activa', '7');
      partidaApi.obtenerEstado.mockReturnValue(of(estadoApi({ estado: 'finalizada' })));

      let reconectado = true;
      servicio.reconectar().subscribe((resultado) => {
        reconectado = resultado;
      });

      expect(reconectado).toBe(false);
      expect(servicio.modoReal()).toBe(false);
      expect(servicio.partidaId()).toBeNull();
      expect(localStorage.getItem('faltauna_partida_activa')).toBeNull();
    });

    describe('Fusión y revelado de cartas (fixtures no verificados contra el backend real)', () => {
      it('1. revelada que solo viene en cartasReveladas aparece en el slot correcto', () => {
        const estado = estadoApi({
          cartasEnMesa: [], // no viene en cartasEnMesa
          ultimoResultado: resultadoApi({
            cartasReveladas: [
              {
                cartaPartidaId: 88,
                zonaPartidaId: 10, // zona 10 es 'izquierda'
                indice: 2,
                lado: 'rival',
                oculta: false,
                carta: cartaApi({ cartaId: 301, nombre: 'Carta Solo Revelada' }),
                poderActual: 8,
              },
            ],
          }),
        });

        iniciar(estado);

        const cartaRival = servicio.lugares().izquierda.rival[2];
        expect(cartaRival).toBeTruthy();
        expect(cartaRival?.nombre).toBe('Carta Solo Revelada');
        expect(cartaRival?.oculta).toBeFalsy();
        expect(cartaRival?.atributoDerecho).toBe(8);
      });

      it('2. revelada que reemplaza una oculta existente', () => {
        const estado = estadoApi({
          cartasEnMesa: [
            {
              cartaPartidaId: 99,
              zonaPartidaId: 10,
              indice: 1,
              lado: 'rival',
              oculta: true,
              carta: null,
              poderActual: null,
            },
          ],
          ultimoResultado: resultadoApi({
            cartasReveladas: [
              {
                cartaPartidaId: 99,
                zonaPartidaId: 10,
                indice: 1,
                lado: 'rival',
                oculta: false,
                carta: cartaApi({ cartaId: 302, nombre: 'Carta Revelada Reemplazo' }),
                poderActual: 7,
              },
            ],
          }),
        });

        iniciar(estado);

        const slot = servicio.lugares().izquierda.rival[1];
        expect(slot).toBeTruthy();
        expect(slot?.oculta).toBeFalsy();
        expect(slot?.nombre).toBe('Carta Revelada Reemplazo');
        expect(slot?.atributoDerecho).toBe(7);
      });

      it('3. carta con zonaPartidaId desconocido no rompe y registra warn', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const estado = estadoApi({
          cartasEnMesa: [
            {
              cartaPartidaId: 105,
              zonaPartidaId: 9999, // zona desconocida, no existe en zonas ni en resultado
              indice: 0,
              lado: 'rival',
              oculta: false,
              carta: cartaApi({ cartaId: 303, nombre: 'Zona Fantasma' }),
              poderActual: 5,
            },
          ],
        });

        expect(() => {
          iniciar(estado);
          servicio.lugares();
        }).not.toThrow();

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[PartidaServicio] Carta con zonaPartidaId desconocido'),
          expect.objectContaining({ zonaPartidaId: 9999 }),
        );
        const izqSlots = servicio.lugares().izquierda.rival;
        const derSlots = servicio.lugares().derecha.rival;
        expect(izqSlots.some((c) => c?.nombre === 'Zona Fantasma')).toBe(false);
        expect(derSlots.some((c) => c?.nombre === 'Zona Fantasma')).toBe(false);
        warnSpy.mockRestore();
      });

      it('4. carta con indice: null cae al primer slot libre y registra warn', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        const estado = estadoApi({
          cartasEnMesa: [
            {
              cartaPartidaId: 106,
              zonaPartidaId: 10,
              indice: null as unknown as number,
              lado: 'rival',
              oculta: false,
              carta: cartaApi({ cartaId: 304, nombre: 'Carta Indice Null' }),
              poderActual: 4,
            },
          ],
        });

        iniciar(estado);
        const lugares = servicio.lugares();

        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('[PartidaServicio] Carta con índice null u ocupado, asignando primer slot libre'),
          expect.objectContaining({ cartaPartidaId: 106, slotAsignado: 0 }),
        );
        expect(lugares.izquierda.rival[0]?.nombre).toBe('Carta Indice Null');
        warnSpy.mockRestore();
      });

      it('5. no duplica cartas ni modifica las propias', () => {
        const cartaPropiaOriginal = {
          cartaPartidaId: 11,
          zonaPartidaId: 10,
          indice: 0,
          lado: 'propio' as const,
          oculta: false,
          carta: cartaApi({ cartaId: 100, nombre: 'Mi Carta Intacta' }),
          poderActual: 9,
        };
        const estado = estadoApi({
          cartasEnMesa: [
            cartaPropiaOriginal,
            {
              cartaPartidaId: 55,
              zonaPartidaId: 10,
              indice: 1,
              lado: 'rival',
              oculta: false,
              carta: cartaApi({ cartaId: 305, nombre: 'Rival Original' }),
              poderActual: 3,
            },
          ],
          ultimoResultado: resultadoApi({
            cartasReveladas: [
              {
                cartaPartidaId: 11,
                zonaPartidaId: 10,
                indice: 0,
                lado: 'rival',
                oculta: false,
                carta: cartaApi({ cartaId: 999, nombre: 'Impostor' }),
                poderActual: 1,
              },
              {
                cartaPartidaId: 55,
                zonaPartidaId: 10,
                indice: 1,
                lado: 'rival',
                oculta: false,
                carta: cartaApi({ cartaId: 305, nombre: 'Rival Duplicado' }),
                poderActual: 3,
              },
            ],
          }),
        });

        iniciar(estado);

        const propia = servicio.lugares().izquierda.propio[0];
        expect(propia?.nombre).toBe('Mi Carta Intacta');
        expect(propia?.cartaPartidaId).toBe(11);

        const rivalesEnZona = servicio.lugares().izquierda.rival.filter((c) => c !== null);
        expect(rivalesEnZona.filter((c) => c.cartaPartidaId === 55).length).toBe(1);
      });

      it('6. ResultadoRonda.cartasReveladasRival contiene nombre, poder y zona', () => {
        const estado = estadoApi({
          ultimoResultado: resultadoApi({
            ronda: 1,
            cartasReveladas: [
              {
                cartaPartidaId: 201,
                zonaPartidaId: 10, // zona 10 tiene nombre 'Grido'
                indice: 0,
                lado: 'rival',
                oculta: false,
                carta: cartaApi({ cartaId: 501, nombre: 'Messi Bot', poder: 10 }),
                poderActual: 12,
              },
            ],
          }),
        });

        iniciar(estado);

        const res = servicio.resultadoRonda();
        expect(res).not.toBeNull();
        expect(res?.cartasReveladasRival).toHaveLength(1);
        expect(res?.cartasReveladasRival[0]).toEqual({
          nombre: 'Messi Bot',
          poder: 12,
          nombreZona: 'Grido',
        });
      });
    });
  });

  describe('Cola secuencial de jugadas y resincronización de polling', () => {
    it('envía las jugadas en orden secuencial sin llamadas concurrentes', () => {
      const estadoInicial = estadoApi({
        jugadorPropio: jugadorApi({ cuponActual: 10 }),
        manoPropia: [
          { cartaPartidaId: 11, carta: cartaApi({ cartaId: 100, costoCupon: 2 }), jugable: true },
          { cartaPartidaId: 12, carta: cartaApi({ cartaId: 101, costoCupon: 2 }), jugable: true },
        ],
      });
      iniciar(estadoInicial);

      const subject1 = new Subject<EstadoPartidaApi>();
      const subject2 = new Subject<EstadoPartidaApi>();
      partidaApi.jugarCarta
        .mockReturnValueOnce(subject1.asObservable())
        .mockReturnValueOnce(subject2.asObservable());

      const carta1 = servicio.manoPropia()[0];
      const carta2 = servicio.manoPropia()[1];

      // Jugar dos cartas seguidas
      expect(servicio.jugarCarta(carta1, 'izquierda', 0)).toBe(true);
      expect(servicio.jugarCarta(carta2, 'izquierda', 1)).toBe(true);

      // La API solo debe haber recibido la primera jugada hasta que se complete
      expect(partidaApi.jugarCarta).toHaveBeenCalledTimes(1);
      expect(partidaApi.jugarCarta).toHaveBeenLastCalledWith(
        7,
        expect.objectContaining({ cartaId: 100, indice: 0 }),
        expect.any(String),
      );

      // Completar la primera jugada
      subject1.next(estadoInicial);
      subject1.complete();

      // Ahora debe haberse enviado la segunda jugada secuencialmente
      expect(partidaApi.jugarCarta).toHaveBeenCalledTimes(2);
      expect(partidaApi.jugarCarta).toHaveBeenLastCalledWith(
        7,
        expect.objectContaining({ cartaId: 101, indice: 1 }),
        expect.any(String),
      );
    });

    it('finalizar el turno espera a que la cola de jugadas esté vacía antes de enviarse', () => {
      const estadoInicial = estadoApi({
        jugadorPropio: jugadorApi({ cuponActual: 10 }),
        manoPropia: [
          { cartaPartidaId: 11, carta: cartaApi({ cartaId: 100, costoCupon: 2 }), jugable: true },
          { cartaPartidaId: 12, carta: cartaApi({ cartaId: 101, costoCupon: 2 }), jugable: true },
        ],
      });
      iniciar(estadoInicial);

      const subject1 = new Subject<EstadoPartidaApi>();
      const subject2 = new Subject<EstadoPartidaApi>();
      partidaApi.jugarCarta
        .mockReturnValueOnce(subject1.asObservable())
        .mockReturnValueOnce(subject2.asObservable());
      partidaApi.finalizar.mockReturnValue(of({ tipo: 'resultado', ronda: 1 }));
      partidaApi.obtenerEstado.mockReturnValue(of(estadoInicial));

      const carta1 = servicio.manoPropia()[0];
      const carta2 = servicio.manoPropia()[1];

      servicio.jugarCarta(carta1, 'izquierda', 0);
      servicio.jugarCarta(carta2, 'izquierda', 1);

      // Finalizar turno de inmediato
      servicio.marcarListo();

      // Finalizar NO debe haberse llamado todavía
      expect(partidaApi.finalizar).not.toHaveBeenCalled();

      // Completar la primera jugada
      subject1.next(estadoInicial);
      subject1.complete();
      expect(partidaApi.finalizar).not.toHaveBeenCalled();

      // Completar la segunda jugada
      subject2.next(estadoInicial);
      subject2.complete();

      // Una vez vaciada la cola, finalizar se dispara automáticamente
      expect(partidaApi.finalizar).toHaveBeenCalledWith(7, 1, expect.any(String));
    });

    it('el rechazo de una jugada revierte solo esa carta y no afecta a las demás', () => {
      const estadoInicial = estadoApi({
        jugadorPropio: jugadorApi({ cuponActual: 10 }),
        manoPropia: [
          { cartaPartidaId: 11, carta: cartaApi({ cartaId: 100, costoCupon: 2, poder: 5 }), jugable: true },
          { cartaPartidaId: 12, carta: cartaApi({ cartaId: 101, costoCupon: 3, poder: 7 }), jugable: true },
        ],
      });
      iniciar(estadoInicial);

      const subject1 = new Subject<EstadoPartidaApi>();
      const subject2 = new Subject<EstadoPartidaApi>();
      partidaApi.jugarCarta
        .mockReturnValueOnce(subject1.asObservable())
        .mockReturnValueOnce(subject2.asObservable());

      const carta1 = servicio.manoPropia()[0];
      const carta2 = servicio.manoPropia()[1];

      servicio.jugarCarta(carta1, 'izquierda', 0);
      servicio.jugarCarta(carta2, 'izquierda', 1);

      // Simular que la primera carta es rechazada por el servidor con error 400
      subject1.error({ status: 400, error: { mensaje: 'Jugada inválida' } });

      // La carta 1 vuelve a la mano, pero la carta 2 se conserva en la mesa
      const cartasMesa = servicio.lugares().izquierda.propio;
      expect(cartasMesa.some((c) => c?.cartaPartidaId === 11)).toBe(false);
      expect(cartasMesa.some((c) => c?.cartaPartidaId === 12)).toBe(true);

      // La segunda jugada se procesa
      expect(partidaApi.jugarCarta).toHaveBeenCalledTimes(2);
    });

    it('descarta respuestas de polling que se originaron antes de una jugada', () => {
      const estadoInicial = estadoApi({
        jugadorPropio: jugadorApi({ cuponActual: 10 }),
        manoPropia: [
          { cartaPartidaId: 11, carta: cartaApi({ cartaId: 100, costoCupon: 2 }), jugable: true },
        ],
      });
      iniciar(estadoInicial);

      const subjectPolling = new Subject<EstadoPartidaApi>();
      partidaApi.obtenerEstado.mockReturnValue(subjectPolling.asObservable());

      // Disparar sincronización (polling)
      (servicio as any).sincronizarEstado(false);

      // Entre el envío de la consulta y su respuesta, el jugador baja una carta
      const subjectJugar = new Subject<EstadoPartidaApi>();
      partidaApi.jugarCarta.mockReturnValue(subjectJugar.asObservable());
      const carta = servicio.manoPropia()[0];
      servicio.jugarCarta(carta, 'izquierda', 0);

      expect(servicio.lugares().izquierda.propio[0]?.cartaPartidaId).toBe(11);

      // Ahora responde el polling obsoleto previo que contenía la mano anterior
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      subjectPolling.next(estadoInicial);
      subjectPolling.complete();

      // La carta bajada debe seguir en la mesa (el polling obsoleto fue descartado)
      const propia = servicio.lugares().izquierda.propio[0];
      expect(propia?.cartaPartidaId).toBe(11);
      expect(warnSpy).toHaveBeenCalledWith(
        '[PartidaServicio] Se descartó respuesta de polling originada antes de una jugada',
        expect.anything(),
      );
      warnSpy.mockRestore();
    });

    it('segunda jugada idéntica ignorada sin llamar dos veces a la API', () => {
      const estadoInicial = estadoApi({
        jugadorPropio: jugadorApi({ cuponActual: 10 }),
        manoPropia: [
          { cartaPartidaId: 11, carta: cartaApi({ cartaId: 100, costoCupon: 2 }), jugable: true },
        ],
      });
      iniciar(estadoInicial);

      const subjectJugar = new Subject<EstadoPartidaApi>();
      partidaApi.jugarCarta.mockReturnValue(subjectJugar.asObservable());

      const carta = servicio.manoPropia()[0];
      const res1 = servicio.jugarCarta(carta, 'izquierda', 0);
      const res2 = servicio.jugarCarta(carta, 'izquierda', 0);

      expect(res1).toBe(true);
      expect(res2).toBe(false);
      expect(partidaApi.jugarCarta).toHaveBeenCalledTimes(1);
    });

    it('rechazo por carta que no está en la mano dispara resincronización y mantiene la carta en mesa si el servidor ya la tenía', () => {
      const estadoInicial = estadoApi({
        jugadorPropio: jugadorApi({ cuponActual: 10 }),
        manoPropia: [
          { cartaPartidaId: 11, carta: cartaApi({ cartaId: 100, costoCupon: 2 }), jugable: true },
        ],
      });
      iniciar(estadoInicial);

      partidaApi.jugarCarta.mockReturnValue(
        throwError(() => ({
          status: 400,
          error: { mensaje: 'Esta carta ya no está en tu mano' },
        })),
      );

      const estadoConfirmadoEnMesa = estadoApi({
        cartasEnMesa: [
          {
            cartaPartidaId: 11,
            zonaPartidaId: 10,
            indice: 0,
            lado: 'propio',
            oculta: false,
            carta: cartaApi({ cartaId: 100 }),
          },
        ],
        manoPropia: [],
      });
      partidaApi.obtenerEstado.mockReturnValue(of(estadoConfirmadoEnMesa));

      const carta = servicio.manoPropia()[0];
      servicio.jugarCarta(carta, 'izquierda', 0);

      expect(partidaApi.obtenerEstado).toHaveBeenCalledWith(7);
      expect(servicio.lugares().izquierda.propio[0]?.cartaPartidaId).toBe(11);
      expect(servicio.manoPropia().some((c) => c.cartaPartidaId === 11)).toBe(false);
      expect(servicio.error()).toBeNull();
    });

    it('carta solo vuelve a la mano si el servidor confirma tras resincronizar que sigue en la mano', () => {
      const estadoInicial = estadoApi({
        jugadorPropio: jugadorApi({ cuponActual: 10 }),
        manoPropia: [
          { cartaPartidaId: 11, carta: cartaApi({ cartaId: 100, costoCupon: 2 }), jugable: true },
        ],
      });
      iniciar(estadoInicial);

      partidaApi.jugarCarta.mockReturnValue(
        throwError(() => ({
          status: 400,
          error: { mensaje: 'No tenés cupones suficientes.' },
        })),
      );

      partidaApi.obtenerEstado.mockReturnValue(of(estadoInicial));

      const carta = servicio.manoPropia()[0];
      servicio.jugarCarta(carta, 'izquierda', 0);

      expect(partidaApi.obtenerEstado).toHaveBeenCalledWith(7);
      expect(servicio.lugares().izquierda.propio[0]).toBeNull();
      expect(servicio.manoPropia().some((c) => c.cartaPartidaId === 11)).toBe(true);
      expect(servicio.error()).toBe('No tenés cupones suficientes.');
    });

    it('traduce los efectos de categoría de la zona a partir del contrato', () => {
      const zonaConEfecto = {
        ...zonaApi(10, 'izquierda', 'Paseo San Martín', 0, 0),
        efecto: 'Gastronomía +2 · Indumentaria -1',
      };
      const estadoConZona = estadoApi({
        zonas: [zonaConEfecto, zonaApi(11, 'derecha', 'Sony', 0, 0)],
      });
      iniciar(estadoConZona);

      const zonaIzq = servicio.lugares().izquierda.zona;
      expect(zonaIzq.efectosCategoria).toBeDefined();
      expect(zonaIzq.efectosCategoria?.length).toBe(2);
      expect(zonaIzq.efectosCategoria?.[0]).toEqual({
        tipo: 'sube',
        categoria: 'gastronomia',
        valor: 2,
      });
      expect(zonaIzq.efectosCategoria?.[1]).toEqual({
        tipo: 'baja',
        categoria: 'indumentaria',
        valor: -1,
      });
    });

    it('al rendirse marca derrota y expone el resultado final', () => {
      iniciar();
      partidaApi.rendirse.mockReturnValue(
        of({
          partidaId: 7,
          ganador: 'rival',
          motivo: 'rendicion',
          puntosPropio: 15,
          puntosRival: 30,
          fechaFin: '2026-10-25T14:30:00Z',
        }),
      );
      partidaApi.obtenerEstado.mockReturnValue(
        of(
          estadoApi({
            estado: 'finalizada',
          }),
        ),
      );

      servicio.rendirse();

      expect(partidaApi.rendirse).toHaveBeenCalled();
      expect(servicio.terminada()).toBe(true);
      expect(servicio.gane()).toBe(false);
      expect(servicio.resultadoFinal()?.ganador).toBe('rival');
      expect(servicio.resultadoFinal()?.motivo).toBe('rendicion');
    });

    it('al recibir estado finalizado por abandono expone derrota y resultado final', () => {
      partidaApi.obtenerResultado.mockReturnValue(
        of({
          partidaId: 7,
          ganador: 'rival',
          motivo: 'desconexion',
          puntosPropio: 10,
          puntosRival: 25,
          fechaFin: '2026-10-25T14:30:00Z',
        }),
      );

      const estadoFinal = estadoApi({
        estado: 'finalizada',
        ultimoResultado: null,
      });
      iniciar(estadoFinal);

      expect(servicio.terminada()).toBe(true);
      expect(servicio.gane()).toBe(false);
      expect(servicio.resultadoFinal()?.ganador).toBe('rival');
      expect(servicio.resultadoFinal()?.motivo).toBe('desconexion');
    });

    it('consulta el resultado final si la partida finaliza y no vino en ultimoResultado', () => {
      partidaApi.obtenerResultado.mockReturnValue(
        of({
          partidaId: 7,
          ganador: 'propio',
          motivo: 'seis-rondas',
          puntosPropio: 45,
          puntosRival: 32,
          fechaFin: '2026-10-25T14:35:00Z',
        }),
      );

      const estadoFinal = estadoApi({
        estado: 'finalizada',
        ultimoResultado: null,
      });
      iniciar(estadoFinal);

      expect(partidaApi.obtenerResultado).toHaveBeenCalledWith(7);
      expect(servicio.resultadoFinal()?.ganador).toBe('propio');
      expect(servicio.gane()).toBe(true);
    });
  });

  describe('Sincronización front-back: rotación de zonas, acumulación, reloj y retiro', () => {
    it('las cartas en mesa conservan su lugar físico (izquierda/derecha) y slot cuando las zonas rotan', () => {
      // Ronda 1: Carta en izquierda, slot 0 (zona 10)
      const cartaMesa = {
        cartaPartidaId: 50,
        zonaPartidaId: 10,
        indice: 0,
        lado: 'propio' as const,
        oculta: false,
        carta: {
          cartaId: 500,
          nombre: 'Dibu Martinez',
          descripcion: null,
          poder: 8,
          costoCupon: 2,
          rareza: 'oro',
          categoria: 'Deportes',
          imagenUrl: null,
          habilidad: null,
        },
        poderActual: 8,
      };

      const estadoRonda1 = estadoApi({
        ronda: 1,
        zonas: [
          zonaApi(10, 'izquierda', 'Grido', 8, 0, 'propio'),
          zonaApi(11, 'derecha', 'Sony', 0, 0, 'empate'),
        ],
        cartasEnMesa: [cartaMesa],
      });

      iniciar(estadoRonda1);

      // Verificamos que esté en izquierda slot 0
      expect(servicio.lugares().izquierda.propio[0]?.nombre).toBe('Dibu Martinez');
      expect(servicio.lugares().derecha.propio[0]).toBeNull();

      // Ronda 2: Las zonas rotan (zona 10 pasa a la derecha o entra zona 20 en la izquierda)
      const estadoRonda2 = estadoApi({
        ronda: 2,
        zonas: [
          zonaApi(20, 'izquierda', 'Havanna', 8, 0, 'propio'),
          zonaApi(10, 'derecha', 'Grido', 0, 0, 'empate'),
        ],
        // El servidor envía las cartas existentes en mesa
        cartasEnMesa: [cartaMesa],
      });

      partidaApi.obtenerEstado.mockReturnValue(of(estadoRonda2));
      servicio['aplicarEstado'](estadoRonda2);

      // La carta DEBE PERMANECER en izquierda slot 0 (lugar físico), aunque la zona que ahora está en la izquierda sea Havanna
      expect(servicio.lugares().izquierda.propio[0]?.nombre).toBe('Dibu Martinez');
      expect(servicio.lugares().derecha.propio[0]).toBeNull();
      // Y la zona en la izquierda debe ser Havanna
      expect(servicio.lugares().izquierda.zona.nombre).toBe('Havanna');
    });

    it('las cartas en mesa no desaparecen aunque el backend omita cartasEnMesa al rotar la zona (Hipótesis A)', () => {
      const cartaMesa: CartaEnMesaApi = {
        cartaPartidaId: 10,
        zonaPartidaId: 10,
        indice: 0,
        lado: 'propio',
        oculta: false,
        carta: {
          cartaId: 1,
          nombre: 'Dibu Martinez',
          descripcion: null,
          poder: 8,
          costoCupon: 2,
          rareza: 'oro',
          categoria: 'Deportes',
          imagenUrl: null,
          habilidad: null,
        },
        poderActual: 8,
      };

      const estadoRonda1 = estadoApi({
        ronda: 1,
        zonas: [
          zonaApi(10, 'izquierda', 'Grido', 8, 0, 'propio'),
          zonaApi(11, 'derecha', 'Sony', 0, 0, 'empate'),
        ],
        cartasEnMesa: [cartaMesa],
      });

      iniciar(estadoRonda1);
      expect(servicio.lugares().izquierda.propio[0]?.nombre).toBe('Dibu Martinez');

      // Ronda 2: la zona 10 sale y entra la zona 20. El backend OMITIÓ la carta en cartasEnMesa (lista vacía)
      const estadoRonda2ConOmisionBackend = estadoApi({
        ronda: 2,
        zonas: [
          zonaApi(20, 'izquierda', 'Havanna', 8, 0, 'propio'),
          zonaApi(11, 'derecha', 'Sony', 0, 0, 'empate'),
        ],
        cartasEnMesa: [], // El backend no envió la carta porque su zona salió
      });

      servicio['aplicarEstado'](estadoRonda2ConOmisionBackend);

      // La carta DEBE SEGUIR en la mesa en su lugar y slot físico
      expect(servicio.lugares().izquierda.propio[0]?.nombre).toBe('Dibu Martinez');
    });

    it('el reloj arranca con el total de ronda del servidor cuando viene y no da saltos al aplicar estados de la misma ronda', () => {
      const ahora = Date.now();
      const finRonda = new Date(ahora + 45000).toISOString();

      const estadoInicial = estadoApi({
        ronda: 1,
        segundosRestantes: 45,
        segundosTotales: 60,
        finDeRonda: finRonda,
      });

      iniciar(estadoInicial);

      expect(servicio.segundosTotales()).toBe(60);
      expect(servicio.segundosRestantes()).toBe(45);

      // Estado intermedio en la misma ronda
      const estadoIntermedio = estadoApi({
        ronda: 1,
        segundosRestantes: 43,
        segundosTotales: 60,
        finDeRonda: finRonda,
      });

      servicio['aplicarEstado'](estadoIntermedio);

      // El total de ronda se mantiene constante (60s, informado por el servidor)
      expect(servicio.segundosTotales()).toBe(60);
      // El valor restante se mantiene continuo sin saltos abruptos
      expect(servicio.segundosRestantes()).toBeGreaterThanOrEqual(42);
      expect(servicio.segundosRestantes()).toBeLessThanOrEqual(45);
    });

    it('cuando el servidor no informa segundosTotales, no inventa un número fijo y queda undefined registrando advertencia', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const estadoSinTotal = estadoApi({
        ronda: 1,
        segundosRestantes: 40,
        finDeRonda: null,
      });

      iniciar(estadoSinTotal);

      expect(servicio.segundosTotales()).toBeUndefined();
      expect(servicio.segundosRestantes()).toBe(40);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PartidaServicio] El servidor no informó el total de la ronda.'),
      );

      warnSpy.mockRestore();
    });

    it('permite retirar una carta provisional y luego jugarla en otro slot sin error de idempotencia', () => {
      iniciar();
      const carta = cartaDeMano();

      // 1. Jugar carta en izquierda slot 1
      partidaApi.jugarCarta.mockReturnValue(
        of(
          estadoApi({
            manoPropia: [],
            cartasEnMesa: [
              {
                cartaPartidaId: 11,
                zonaPartidaId: 10,
                indice: 1,
                lado: 'propio',
                oculta: false,
                carta: {
                  cartaId: 100,
                  nombre: 'Messi',
                  descripcion: null,
                  poder: 10,
                  costoCupon: 1,
                  rareza: 'oro',
                  categoria: 'Deportes',
                  imagenUrl: null,
                  habilidad: null,
                },
                poderActual: 10,
              },
            ],
          }),
        ),
      );

      const jugo = servicio.jugarCarta(carta, 'izquierda', 1);
      expect(jugo).toBe(true);

      const cartaEnMesa = servicio.lugares().izquierda.propio[1]!;
      expect(cartaEnMesa).toBeTruthy();

      // 2. Retirar carta de la mesa
      const estadoTrasRetiro = estadoApi({
        manoPropia: [
          {
            cartaPartidaId: 11,
            jugable: true,
            carta: {
              cartaId: 100,
              nombre: 'Messi',
              descripcion: null,
              poder: 10,
              costoCupon: 1,
              rareza: 'oro',
              categoria: 'Deportes',
              imagenUrl: null,
              habilidad: null,
            },
          },
        ],
        cartasEnMesa: [],
      });
      partidaApi.retirarCarta.mockReturnValue(of(estadoTrasRetiro));

      const retiro = servicio.retirarCarta(cartaEnMesa);
      expect(retiro).toBe(true);
      expect(servicio.lugares().izquierda.propio[1]).toBeNull();
      expect(servicio.manoPropia().length).toBeGreaterThan(0);

      // 3. Volver a jugar en OTRO slot (derecha slot 3)
      const cartaEnManoNueva = servicio.manoPropia().find((c) => c.cartaPartidaId === 11)!;
      expect(cartaEnManoNueva).toBeTruthy();

      partidaApi.jugarCarta.mockReturnValue(
        of(
          estadoApi({
            manoPropia: [],
            cartasEnMesa: [
              {
                cartaPartidaId: 11,
                zonaPartidaId: 11,
                indice: 3,
                lado: 'propio',
                oculta: false,
                carta: {
                  cartaId: 100,
                  nombre: 'Messi',
                  descripcion: null,
                  poder: 10,
                  costoCupon: 1,
                  rareza: 'oro',
                  categoria: 'Deportes',
                  imagenUrl: null,
                  habilidad: null,
                },
                poderActual: 10,
              },
            ],
          }),
        ),
      );

      const jugoEnOtroSlot = servicio.jugarCarta(cartaEnManoNueva, 'derecha', 3);
      expect(jugoEnOtroSlot).toBe(true);
      expect(servicio.lugares().derecha.propio[3]?.nombre).toBe('Messi');
    });

    it('descarta respuestas de polling que lleguen con menos cartas durante una jugada o acción mutante', () => {
      iniciar();
      const carta = cartaDeMano();

      // Simular jugada con respuesta pendiente
      const respuestaJugar$ = new Subject<EstadoPartidaApi>();
      partidaApi.jugarCarta.mockReturnValue(respuestaJugar$);

      servicio.jugarCarta(carta, 'izquierda', 0);
      expect(servicio.enviandoCarta()).toBe(true);

      // Polling que sale con foto vieja del servidor (sin la carta bajada)
      const estadoPollingViejo = estadoApi({
        ronda: 1,
        cartasEnMesa: [],
      });

      // Se procesa la respuesta de polling mientras enviandoCarta es true
      partidaApi.obtenerEstado.mockReturnValue(of(estadoPollingViejo));
      servicio['consultarEstado']();

      // La carta optimista DEBE PERMANECER en la mesa y NO ser sobreescrita por el polling viejo
      expect(servicio.lugares().izquierda.propio[0]?.nombre).toBe('Super Grido');

      // Completar la jugada real
      respuestaJugar$.next(
        estadoApi({
          ronda: 1,
          cartasEnMesa: [
            {
              cartaPartidaId: 11,
              zonaPartidaId: 10,
              indice: 0,
              lado: 'propio',
              oculta: false,
              carta: {
                cartaId: 100,
                nombre: 'Super Grido',
                descripcion: null,
                poder: 10,
                costoCupon: 1,
                rareza: 'oro',
                categoria: 'Deportes',
                imagenUrl: null,
                habilidad: null,
              },
              poderActual: 10,
            },
          ],
        }),
      );
      respuestaJugar$.complete();

      expect(servicio.lugares().izquierda.propio[0]?.nombre).toBe('Super Grido');
    });
  });

  describe('Zonas y cartas del rival (imágenes, lugares y rotación)', () => {
    it('resuelve zonas distintas para izquierda y derecha aunque el backend omita el campo lugar', () => {
      iniciar(
        estadoApi({
          zonas: [
            {
              zonaPartidaId: 163,
              nombre: 'Ritmo Urbano',
              lugar: '' as any,
              imagenUrl: null,
              efecto: null,
              tipoEfecto: 'bonus-categoria',
              puntajePropio: 0,
              puntajeRival: 0,
              diferencia: 0,
              ganador: 'empate',
              modificadores: [],
              cartas: [],
            },
            {
              zonaPartidaId: 164,
              nombre: 'Barrio',
              lugar: '' as any,
              imagenUrl: null,
              efecto: null,
              tipoEfecto: 'bonus-categoria',
              puntajePropio: 0,
              puntajeRival: 0,
              diferencia: 0,
              ganador: 'empate',
              modificadores: [],
              cartas: [],
            },
          ],
        }),
      );

      const zonas = {
        izquierda: servicio.lugares().izquierda.zona,
        derecha: servicio.lugares().derecha.zona,
      };

      expect(zonas.izquierda.zonaPartidaId).toBe(163);
      expect(zonas.derecha.zonaPartidaId).toBe(164);
      expect(zonas.izquierda.nombre).toBe('Ritmo Urbano');
      expect(zonas.derecha.nombre).toBe('Barrio');

      // Imágenes de respaldo absolutas y diferenciadas por lugar
      expect(zonas.izquierda.imagenUrl).toBe('/imagenes/zona-generica.svg');
      expect(zonas.derecha.imagenUrl).toBe('/imagenes/zona-generica-derecha.svg');
    });

    it('conserva el arte y estado revelado de una carta rival en rondas posteriores si el backend manda imagenUrl nulo', () => {
      // Ronda 1: Carta revelada del rival en el resultado
      iniciar(
        estadoApi({
          ronda: 1,
          zonas: [
            {
              zonaPartidaId: 163,
              nombre: 'Ritmo Urbano',
              lugar: 'izquierda',
              imagenUrl: 'https://img.com/ritmo.jpg',
              efecto: null,
              tipoEfecto: 'bonus-categoria',
              puntajePropio: 0,
              puntajeRival: 4,
              diferencia: -4,
              ganador: 'rival',
              modificadores: [],
              cartas: [],
            },
            {
              zonaPartidaId: 164,
              nombre: 'Barrio',
              lugar: 'derecha',
              imagenUrl: null,
              efecto: null,
              tipoEfecto: 'bonus-categoria',
              puntajePropio: 0,
              puntajeRival: 0,
              diferencia: 0,
              ganador: 'empate',
              modificadores: [],
              cartas: [],
            },
          ],
          ultimoResultado: {
            ronda: 1,
            cartasReveladas: [
              {
                cartaPartidaId: 880,
                zonaPartidaId: 163,
                indice: 0,
                lado: 'rival',
                oculta: false,
                carta: {
                  cartaId: 26,
                  nombre: 'Super Cono',
                  descripcion: 'Cono de helado',
                  poder: 4,
                  costoCupon: 1,
                  rareza: 'Común',
                  categoria: 'Gastronomía',
                  imagenUrl: 'https://cloudinary.com/supercono.png',
                  habilidad: null,
                },
              },
            ],
            efectos: [],
            zonas: [
              {
                zonaPartidaId: 163,
                puntajePropio: 0,
                puntajeRival: 4,
                diferencia: -4,
                puntosGanadosPropio: 0,
                puntosGanadosRival: 4,
                ganador: 'rival',
              },
            ],
            puntosTotalesPropio: 0,
            puntosTotalesRival: 4,
            zonasNuevas: [],
            cartaRobada: null,
          },
        }),
      );

      const rivalRonda1 = servicio.lugares().izquierda.rival[0];
      expect(rivalRonda1).toBeTruthy();
      expect(rivalRonda1?.oculta).toBeFalsy();
      expect(rivalRonda1?.imagenUrl).toBe('https://cloudinary.com/supercono.png');


      // Ronda 2: El polling del backend llega con la carta en mesa pero con imagenUrl: null
      const estadoPolling = estadoApi({
        ronda: 2,
        cartasEnMesa: [
          {
            cartaPartidaId: 880,
            zonaPartidaId: 163,
            indice: 0,
            lado: 'rival',
            oculta: false,
            carta: {
              cartaId: 26,
              nombre: 'Super Cono',
              descripcion: 'Cono de helado',
              poder: 4,
              costoCupon: 1,
              rareza: 'Común',
              categoria: 'Gastronomía',
              imagenUrl: null,
              habilidad: null,
            },
            poderActual: 4,
          },
        ],
      });

      (servicio as any).aplicarEstado(estadoPolling);

      const rivalRonda2 = servicio.lugares().izquierda.rival[0];
      expect(rivalRonda2).toBeTruthy();
      expect(rivalRonda2?.oculta).toBeFalsy();

      // Debe conservar la imagen de la ronda previa
      expect(rivalRonda2?.imagenUrl).toBe('https://cloudinary.com/supercono.png');
    });

    it('normaliza URLs relativas de imágenes agregando barra inicial', () => {
      iniciar(
        estadoApi({
          zonas: [
            {
              zonaPartidaId: 10,
              nombre: 'Grido',
              lugar: 'izquierda',
              imagenUrl: 'imagenes/grido.jpg',
              efecto: null,
              tipoEfecto: 'bonus-categoria',
              puntajePropio: 0,
              puntajeRival: 0,
              diferencia: 0,
              ganador: 'empate',
              modificadores: [],
              cartas: [],
            },
            {
              zonaPartidaId: 20,
              nombre: 'Sprite',
              lugar: 'derecha',
              imagenUrl: 'imagenes/Sprite.png',
              efecto: null,
              tipoEfecto: 'bonus-categoria',
              puntajePropio: 0,
              puntajeRival: 0,
              diferencia: 0,
              ganador: 'empate',
              modificadores: [],
              cartas: [],
            },
          ],
        }),
      );

      expect(servicio.lugares().izquierda.zona.imagenUrl).toBe('/imagenes/grido.jpg');
      expect(servicio.lugares().derecha.zona.imagenUrl).toBe('/imagenes/Sprite.png');
    });

    it('genera descripciones apropiadas para cartas con habilidades de posición y azar', () => {
      const generar = (habilidad: any) =>
        (servicio as any).generarDescripcionHabilidad(habilidad);

      expect(
        generar({ tipo: 'AUMENTAR_PODER_ALIADOS_CERCANOS', valor: 2 }),
      ).toBe('+2 de poder a las cartas aliadas a su lado.');

      expect(
        generar({ tipo: 'BUFF_ALIADOS_CERCANOS', valor: 1 }),
      ).toBe('+1 de poder a las cartas aliadas a su lado.');

      expect(
        generar({ tipo: 'AUMENTAR_PODER_ALIADO_ALEATORIO', valor: 2 }),
      ).toBe('+2 de poder a una carta aliada aleatoria en esta zona.');

      expect(
        generar({ tipo: 'REDUCIR_PODER_RIVAL_ALEATORIO', valor: 1 }),
      ).toBe('-1 de poder a una carta rival aleatoria en esta zona.');

      expect(
        generar({ tipo: 'AUMENTAR_PODER_MISMA_FILA', valor: 2 }),
      ).toBe('+2 de poder a todas sus cartas en la misma fila de la ronda.');

      expect(
        generar({ tipo: 'REDUCIR_PODER_RIVAL_ENFRENTE', valor: 3 }),
      ).toBe('-3 de poder a la carta rival que esté enfrente.');
    });
  });
});



