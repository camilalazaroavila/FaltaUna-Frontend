import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AlbumesJugadorService } from './albumes-jugador.service';
import type { DetalleAlbum, ResumenAlbum } from '@modelos/album-jugador.model';

const RESUMEN_API = {
  id: 1,
  marcaNombre: 'Aura',
  logoUrl: 'https://logo.test/aura.png',
  descripcion: 'Indumentaria urbana.',
  categoriaId: 2,
  categoriaNombre: 'Indumentaria',
  total: 2,
  obtenidas: 1,
  porcentaje: 50,
};

const CARTA_API = {
  cartaId: 10,
  nombre: 'Aura Cap',
  imagenUrl: 'https://img.test/cap.png',
  rareza: 'Rara',
  rarezaOrden: 2,
  categoria: 'Indumentaria',
  poder: 4,
  costoCupon: 3,
  cantidad: 2,
  obtenida: true,
  favorita: true,
};

describe('AlbumesJugadorService', () => {
  let servicio: AlbumesJugadorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    servicio = TestBed.inject(AlbumesJugadorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('listarAlbumes', () => {
    it('pide todos los álbumes y mapea el contrato del backend', () => {
      let resultado: readonly ResumenAlbum[] = [];

      servicio.listarAlbumes().subscribe((albumes) => (resultado = albumes));

      const req = httpMock.expectOne((peticion) => peticion.url.includes('Albumes'));
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toEqual([]);
      req.flush([RESUMEN_API]);

      expect(resultado).toEqual([
        {
          id: 1,
          marcaNombre: 'Aura',
          logoUrl: 'https://logo.test/aura.png',
          descripcion: 'Indumentaria urbana.',
          categoriaId: 2,
          categoriaNombre: 'Indumentaria',
          total: 2,
          obtenidas: 1,
          porcentaje: 50,
        },
      ]);
    });

    it('no cae a datos de prueba cuando el backend falla', () => {
      let error: unknown;

      servicio.listarAlbumes().subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne((peticion) => peticion.url.includes('Albumes'))
        .flush('error', { status: 500, statusText: 'Error' });

      expect(error).toBeTruthy();
    });
  });

  describe('obtenerDetalleAlbum', () => {
    it('pide el detalle y mapea las cartas con rareza, categoría y favoritas', () => {
      let resultado: DetalleAlbum | null = null;

      servicio.obtenerDetalleAlbum(1).subscribe((detalle) => (resultado = detalle));

      httpMock
        .expectOne((peticion) => peticion.url.includes('Albumes/1'))
        .flush({ ...RESUMEN_API, cartas: [CARTA_API] });

      expect(resultado).toEqual({
        id: 1,
        marcaNombre: 'Aura',
        logoUrl: 'https://logo.test/aura.png',
        descripcion: 'Indumentaria urbana.',
        categoriaId: 2,
        categoriaNombre: 'Indumentaria',
        total: 2,
        obtenidas: 1,
        porcentaje: 50,
        cartas: [
          {
            id: '10',
            nombre: 'Aura Cap',
            imagenUrl: 'https://img.test/cap.png',
            rareza: 'rara',
            categoria: 'indumentaria',
            poder: 4,
            costoCupon: 3,
            obtenida: true,
            cantidad: 2,
            favorita: true,
          },
        ],
      });
    });

    it('usa valores seguros cuando la carta no trae imagen, rareza ni categoría', () => {
      let resultado: DetalleAlbum | null = null;

      servicio.obtenerDetalleAlbum(1).subscribe((detalle) => (resultado = detalle));

      httpMock
        .expectOne((peticion) => peticion.url.includes('Albumes/1'))
        .flush({
          ...RESUMEN_API,
          cartas: [
            {
              ...CARTA_API,
              imagenUrl: null,
              rareza: 'Desconocida',
              categoria: null,
              cantidad: 0,
              obtenida: false,
              favorita: false,
            },
          ],
        });

      const carta = resultado!.cartas[0];
      expect(carta.imagenUrl).toBe('');
      expect(carta.rareza).toBe('comun');
      expect(carta.categoria).toBe('gastronomia');
      expect(carta.obtenida).toBe(false);
      expect(carta.favorita).toBe(false);
    });

    it('propaga el error cuando el álbum no existe', () => {
      let error: unknown;

      servicio.obtenerDetalleAlbum(999).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne((peticion) => peticion.url.includes('Albumes/999'))
        .flush('error', { status: 404, statusText: 'Not Found' });

      expect(error).toBeTruthy();
    });
  });

  describe('favoritas', () => {
    it('marca una carta con POST al endpoint de favoritas', () => {
      servicio.marcarFavorita('10').subscribe();

      const req = httpMock.expectOne((peticion) =>
        peticion.url.includes('CartaFavorita/10'),
      );
      expect(req.request.method).toBe('POST');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('desmarca una carta con DELETE al endpoint de favoritas', () => {
      servicio.desmarcarFavorita('10').subscribe();

      const req = httpMock.expectOne((peticion) =>
        peticion.url.includes('CartaFavorita/10'),
      );
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('propaga el error al marcar una favorita', () => {
      let error: unknown;

      servicio.marcarFavorita('10').subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne((peticion) => peticion.url.includes('CartaFavorita/10'))
        .flush('error', { status: 500, statusText: 'Error' });

      expect(error).toBeTruthy();
    });
  });
});
