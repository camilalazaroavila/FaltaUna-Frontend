import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AlbumesJugadorService } from './albumes-jugador.service';
import type {
  CategoriaAlbum,
  DetalleAlbum,
  ResumenAlbum,
} from '../modelos/album-jugador.model';

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

  describe('listarCategorias', () => {
    it('traduce los nombres del backend y descarta las categorías sin icono', () => {
      let resultado: readonly CategoriaAlbum[] = [];

      servicio.listarCategorias().subscribe((categorias) => (resultado = categorias));

      httpMock
        .expectOne((req) => req.url.includes('Categorias'))
        .flush([
          { id: 1, nombre: 'Comida' },
          { id: 7, nombre: 'Decoración' },
          { id: 3, nombre: 'Ropa' },
        ]);

      expect(resultado.map((categoria) => categoria.categoria)).toEqual([
        'gastronomia',
        'indumentaria',
      ]);
      expect(resultado.map((categoria) => categoria.id)).toEqual([1, 3]);
    });

    it('cae al mock de seis categorías cuando el backend falla', () => {
      let resultado: readonly CategoriaAlbum[] = [];

      servicio.listarCategorias().subscribe((categorias) => (resultado = categorias));

      httpMock
        .expectOne((req) => req.url.includes('Categorias'))
        .flush('error', { status: 500, statusText: 'Error' });

      expect(resultado).toHaveLength(6);
      expect(resultado.every((categoria) => categoria.categoria !== null)).toBe(true);
    });
  });

  describe('listarAlbumes', () => {
    it('envía el filtro por categoría como query param', () => {
      let resultado: readonly ResumenAlbum[] = [];

      servicio.listarAlbumes(2).subscribe((albumes) => (resultado = albumes));

      const req = httpMock.expectOne((peticion) => peticion.url.includes('Colecciones/albumes'));
      expect(req.request.params.get('categoriaId')).toBe('2');
      req.flush([]);

      expect(resultado).toEqual([]);
    });

    it('devuelve el mock ya filtrado por categoría ante un error', () => {
      let resultado: readonly ResumenAlbum[] = [];

      servicio.listarAlbumes(1).subscribe((albumes) => (resultado = albumes));

      httpMock
        .expectOne((peticion) => peticion.url.includes('Colecciones/albumes'))
        .flush('error', { status: 500, statusText: 'Error' });

      expect(resultado).toHaveLength(1);
      expect(resultado.every((album) => album.categoriaId === 1)).toBe(true);
    });

    it('devuelve todos los álbumes del mock cuando no se filtra', () => {
      let resultado: readonly ResumenAlbum[] = [];

      servicio.listarAlbumes().subscribe((albumes) => (resultado = albumes));

      httpMock
        .expectOne((peticion) => peticion.url.includes('Colecciones/albumes'))
        .flush('error', { status: 500, statusText: 'Error' });

      expect(resultado).toHaveLength(8);
    });
  });

  describe('obtenerDetalleAlbum', () => {
    it('devuelve el detalle del backend cuando responde con cantidad válida de cartas', () => {
      const detalle: DetalleAlbum = {
        id: 99,
        marcaNombre: 'Marca',
        logoUrl: null,
        descripcion: null,
        categoriaId: 4,
        categoriaNombre: 'Gastronomía',
        total: 15,
        obtenidas: 8,
        porcentaje: 53,
        cartas: [],
      };

      let resultado: DetalleAlbum | null = null;
      servicio.obtenerDetalleAlbum(99).subscribe((d) => (resultado = d));

      httpMock.expectOne((peticion) => peticion.url.includes('Colecciones/99/album')).flush(detalle);

      expect(resultado).toEqual(detalle);
    });

    it('falla si la colección tiene menos de 12 cartas', () => {
      const detalleInvalido: DetalleAlbum = {
        id: 99,
        marcaNombre: 'Marca Corta',
        logoUrl: null,
        descripcion: null,
        categoriaId: 4,
        categoriaNombre: 'Gastronomía',
        total: 11,
        obtenidas: 5,
        porcentaje: 45,
        cartas: [],
      };

      let error: Error | null = null;
      servicio.obtenerDetalleAlbum(99).subscribe({
        next: () => fail('debió fallar'),
        error: (e) => (error = e),
      });

      httpMock
        .expectOne((peticion) => peticion.url.includes('Colecciones/99/album'))
        .flush(detalleInvalido);

      expect(error).toBeTruthy();
      expect(error?.message).toContain('inválida');
    });

    it('falla si la colección tiene más de 30 cartas', () => {
      const detalleInvalido: DetalleAlbum = {
        id: 99,
        marcaNombre: 'Marca Larga',
        logoUrl: null,
        descripcion: null,
        categoriaId: 4,
        categoriaNombre: 'Gastronomía',
        total: 31,
        obtenidas: 10,
        porcentaje: 32,
        cartas: [],
      };

      let error: Error | null = null;
      servicio.obtenerDetalleAlbum(99).subscribe({
        next: () => fail('debió fallar'),
        error: (e) => (error = e),
      });

      httpMock
        .expectOne((peticion) => peticion.url.includes('Colecciones/99/album'))
        .flush(detalleInvalido);

      expect(error).toBeTruthy();
      expect(error?.message).toContain('inválida');
    });

    it('falla si el álbum pedido no existe en el mock', () => {
      let error: unknown;

      servicio.obtenerDetalleAlbum(999).subscribe({ error: (e) => (error = e) });

      httpMock
        .expectOne((peticion) => peticion.url.includes('Colecciones/999/album'))
        .flush('error', { status: 500, statusText: 'Error' });

      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('favoritas', () => {
    it('recuerda una favorita marcada en el mock y la refleja en el detalle', () => {
      servicio.marcarFavorita('album-1-carta-1').subscribe();
      httpMock
        .expectOne((peticion) => peticion.method === 'POST')
        .flush('error', { status: 500, statusText: 'Error' });

      let detalle: DetalleAlbum | null = null;
      servicio.obtenerDetalleAlbum(1).subscribe((d) => (detalle = d));
      httpMock
        .expectOne((peticion) => peticion.url.includes('Colecciones/1/album'))
        .flush('error', { status: 500, statusText: 'Error' });

      const carta = detalle!.cartas.find((c) => c.id === 'album-1-carta-1')!;
      expect(carta.favorita).toBe(true);
    });

    it('quita una favorita previamente marcada', () => {
      servicio.marcarFavorita('album-1-carta-1').subscribe();
      httpMock
        .expectOne((peticion) => peticion.method === 'POST')
        .flush('error', { status: 500, statusText: 'Error' });

      servicio.desmarcarFavorita('album-1-carta-1').subscribe();
      httpMock
        .expectOne((peticion) => peticion.method === 'DELETE')
        .flush('error', { status: 500, statusText: 'Error' });

      let detalle: DetalleAlbum | null = null;
      servicio.obtenerDetalleAlbum(1).subscribe((d) => (detalle = d));
      httpMock
        .expectOne((peticion) => peticion.url.includes('Colecciones/1/album'))
        .flush('error', { status: 500, statusText: 'Error' });

      const carta = detalle!.cartas.find((c) => c.id === 'album-1-carta-1')!;
      expect(carta.favorita).toBe(false);
    });
  });
});
