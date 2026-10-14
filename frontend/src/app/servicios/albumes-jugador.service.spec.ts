import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AlbumesJugadorService } from './albumes-jugador.service';
import { CARTAS_MOCK } from '../modelos/cartas.mock';
import {
  CANTIDADES_ALBUM_VALIDAS,
  esCantidadAlbumValida,
  type CategoriaAlbum,
  type DetalleAlbum,
  type ResumenAlbum,
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

  const detalleDesdeMock = (id: number): DetalleAlbum => {
    let detalle: DetalleAlbum | null = null;
    servicio.obtenerDetalleAlbum(id).subscribe((d) => (detalle = d));
    httpMock
      .expectOne((peticion) => peticion.url.includes(`Colecciones/${id}/album`))
      .flush('error', { status: 500, statusText: 'Error' });
    return detalle!;
  };

  describe('listarCategorias', () => {
    it('traduce los nombres del backend, incluye Decoración y descarta las desconocidas', () => {
      let resultado: readonly CategoriaAlbum[] = [];

      servicio.listarCategorias().subscribe((categorias) => (resultado = categorias));

      httpMock
        .expectOne((req) => req.url.includes('Categorias'))
        .flush([
          { id: 1, nombre: 'Comida' },
          { id: 7, nombre: 'Decoración' },
          { id: 3, nombre: 'Ropa' },
          { id: 9, nombre: 'Sin categoría conocida' },
        ]);

      expect(resultado.map((categoria) => categoria.categoria)).toEqual([
        'gastronomia',
        'decoracion',
        'indumentaria',
      ]);
      expect(resultado.map((categoria) => categoria.id)).toEqual([1, 7, 3]);
    });

    it('cae al mock de siete categorías cuando el backend falla', () => {
      let resultado: readonly CategoriaAlbum[] = [];

      servicio.listarCategorias().subscribe((categorias) => (resultado = categorias));

      httpMock
        .expectOne((req) => req.url.includes('Categorias'))
        .flush('error', { status: 500, statusText: 'Error' });

      expect(resultado).toHaveLength(7);
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

      // Gastronomía: Grido, McDonald's y Coca-Cola.
      expect(resultado).toHaveLength(3);
      expect(resultado.every((album) => album.categoriaId === 1)).toBe(true);
    });

    it('devuelve todos los álbumes del mock cuando no se filtra', () => {
      let resultado: readonly ResumenAlbum[] = [];

      servicio.listarAlbumes().subscribe((albumes) => (resultado = albumes));

      httpMock
        .expectOne((peticion) => peticion.url.includes('Colecciones/albumes'))
        .flush('error', { status: 500, statusText: 'Error' });

      expect(resultado).toHaveLength(9);
      expect(resultado.every((album) => esCantidadAlbumValida(album.total))).toBe(true);
    });

    it('todos los álbumes del mock tienen un total válido (12, 20 o 30)', () => {
      let resultado: readonly ResumenAlbum[] = [];

      servicio.listarAlbumes().subscribe((albumes) => (resultado = albumes));
      httpMock
        .expectOne((peticion) => peticion.url.includes('Colecciones/albumes'))
        .flush('error', { status: 500, statusText: 'Error' });

      const totales = new Set(resultado.map((album) => album.total));
      for (const total of totales) {
        expect(CANTIDADES_ALBUM_VALIDAS).toContain(total);
      }
    });
  });

  describe('obtenerDetalleAlbum', () => {
    it('devuelve el detalle del backend cuando la cantidad de cartas es válida', () => {
      const detalle: DetalleAlbum = {
        id: 99,
        marcaNombre: 'Marca',
        logoUrl: null,
        descripcion: null,
        categoriaId: 4,
        categoriaNombre: 'Gastronomía',
        total: 12,
        obtenidas: 8,
        porcentaje: 67,
        cartas: [],
      };

      let resultado: DetalleAlbum | null = null;
      servicio.obtenerDetalleAlbum(99).subscribe((d) => (resultado = d));

      httpMock.expectOne((peticion) => peticion.url.includes('Colecciones/99/album')).flush(detalle);

      expect(resultado).toEqual(detalle);
    });

    it.each([11, 13, 21, 31])('falla si la colección tiene %i cartas', (total) => {
      const detalleInvalido: DetalleAlbum = {
        id: 99,
        marcaNombre: 'Marca',
        logoUrl: null,
        descripcion: null,
        categoriaId: 4,
        categoriaNombre: 'Gastronomía',
        total,
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

    it('cada álbum del mock tiene exactamente su total de cartas', () => {
      for (let id = 1; id <= 9; id++) {
        const detalle = detalleDesdeMock(id);
        expect(detalle.cartas).toHaveLength(detalle.total);
        expect(esCantidadAlbumValida(detalle.total)).toBe(true);
      }
    });

    it('incluye las cartas de "Mis cartas" con los mismos datos y marca', () => {
      const detalle = detalleDesdeMock(1); // Grido
      const esperadas = CARTAS_MOCK.filter((carta) => carta.marca === 'Grido');

      expect(esperadas.length).toBeGreaterThan(0);

      for (const origen of esperadas) {
        const enAlbum = detalle.cartas.find((carta) => carta.id === origen.id);
        expect(enAlbum).toBeDefined();
        expect(enAlbum!.nombre).toBe(origen.nombre);
        expect(enAlbum!.rareza).toBe(origen.rareza);
        expect(enAlbum!.imagenUrl).toBe(origen.imagenUrl);
        expect(enAlbum!.categoria).toBe(origen.categoria);
        expect(enAlbum!.poder).toBe(origen.atributoIzquierdo);
        expect(enAlbum!.costoMana).toBe(origen.atributoDerecho);
        expect(enAlbum!.obtenida).toBe(origen.obtenida);
      }
    });

    it('cuenta las obtenidas y rellena el resto con slots vacíos sin identidad', () => {
      const detalle = detalleDesdeMock(1); // Grido: 12 cartas
      const conocidas = detalle.cartas.filter((carta) => carta.id.startsWith('c-'));

      expect(detalle.obtenidas).toBe(conocidas.filter((carta) => carta.obtenida).length);
      expect(detalle.cartas).toHaveLength(detalle.total);

      const vacias = detalle.cartas.filter((carta) => carta.id.startsWith('slot-'));
      expect(vacias.length).toBe(detalle.total - conocidas.length);
      expect(vacias.every((carta) => !carta.obtenida && carta.cantidad === 0)).toBe(true);
    });

    it('recalcula el porcentaje a partir de obtenidas y total', () => {
      const detalle = detalleDesdeMock(1);
      expect(detalle.porcentaje).toBe(
        Math.round((detalle.obtenidas / detalle.total) * 100),
      );
    });

    it('deja el álbum de Grido al 100% para poder probar el canje', () => {
      const detalle = detalleDesdeMock(1); // Grido

      expect(detalle.total).toBe(12);
      expect(detalle.obtenidas).toBe(12);
      expect(detalle.porcentaje).toBe(100);
      expect(detalle.cartas.every((carta) => carta.obtenida)).toBe(true);
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
      servicio.marcarFavorita('c-001').subscribe();
      httpMock
        .expectOne((peticion) => peticion.method === 'POST')
        .flush('error', { status: 500, statusText: 'Error' });

      const detalle = detalleDesdeMock(1);
      const carta = detalle.cartas.find((c) => c.id === 'c-001')!;
      expect(carta.favorita).toBe(true);
    });

    it('quita una favorita previamente marcada', () => {
      servicio.marcarFavorita('c-001').subscribe();
      httpMock
        .expectOne((peticion) => peticion.method === 'POST')
        .flush('error', { status: 500, statusText: 'Error' });

      servicio.desmarcarFavorita('c-001').subscribe();
      httpMock
        .expectOne((peticion) => peticion.method === 'DELETE')
        .flush('error', { status: 500, statusText: 'Error' });

      const detalle = detalleDesdeMock(1);
      const carta = detalle.cartas.find((c) => c.id === 'c-001')!;
      expect(carta.favorita).toBe(false);
    });
  });
});
