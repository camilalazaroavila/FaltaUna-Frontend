import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CABECERA_IDEMPOTENCIA, PartidaApiService } from './partida-api.service';

const CLAVE = 'clave-idempotencia-123';

describe('PartidaApiService', () => {
  let api: PartidaApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(PartidaApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crea la partida contra el bot con el mazo elegido', () => {
    api.iniciarContraBot(3).subscribe();

    const pedido = http.expectOne((req) => req.url.endsWith('/Partidas/bot'));

    expect(pedido.request.method).toBe('POST');
    expect(pedido.request.body).toEqual({ mazoId: 3 });
    pedido.flush({});
  });

  it('consulta el estado por id', () => {
    api.obtenerEstado(7).subscribe();

    const pedido = http.expectOne((req) => req.url.endsWith('/Partidas/7'));

    expect(pedido.request.method).toBe('GET');
    pedido.flush({});
  });

  it('envía la jugada con la cabecera de idempotencia', () => {
    api
      .jugarCarta(
        7,
        { cartaId: 100, cartaPartidaId: 11, zonaPartidaId: 10, indice: 2, numeroRonda: 1 },
        CLAVE,
      )
      .subscribe();

    const pedido = http.expectOne((req) => req.url.endsWith('/Partidas/7/jugar'));

    expect(pedido.request.method).toBe('POST');
    expect(pedido.request.headers.get(CABECERA_IDEMPOTENCIA)).toBe(CLAVE);
    expect(pedido.request.body).toEqual({
      cartaId: 100,
      cartaPartidaId: 11,
      zonaPartidaId: 10,
      indice: 2,
      numeroRonda: 1,
    });
    pedido.flush({});
  });

  it('finaliza la ronda con la cabecera de idempotencia', () => {
    api.finalizar(7, 2, CLAVE).subscribe();

    const pedido = http.expectOne((req) => req.url.endsWith('/Partidas/7/finalizar'));

    expect(pedido.request.headers.get(CABECERA_IDEMPOTENCIA)).toBe(CLAVE);
    expect(pedido.request.body).toEqual({ ronda: 2 });
    pedido.flush({});
  });

  it('usa los endpoints de rendición, abandono, heartbeat y resultado', () => {
    api.rendirse(7, CLAVE).subscribe();
    api.abandonar(7, `${CLAVE}-b`).subscribe();
    api.enviarLatido(7).subscribe();
    api.obtenerResultado(7).subscribe();

    http.expectOne((req) => req.url.endsWith('/Partidas/7/rendirse')).flush({});
    http.expectOne((req) => req.url.endsWith('/Partidas/7/abandonar')).flush({});
    http
      .expectOne((req) => req.url.endsWith('/Partidas/7/heartbeat'))
      .flush({ ahora: '2026-10-22T00:00:00Z' });
    http.expectOne((req) => req.url.endsWith('/Partidas/7/resultado')).flush({});
  });
});
