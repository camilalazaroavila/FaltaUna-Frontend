import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { IntercambioService } from './intercambio.service';
import { ApiService } from './api.service';
import { UsuariosService } from './usuario.service';
import { AuthService } from './auth.service';
import { AlbumesJugadorService } from './albumes-jugador.service';
import type { CartaInventarioApi } from '@modelos/mazo.model';

describe('IntercambioService', () => {
  let service: IntercambioService;
  let apiMock: { get: jest.Mock; post: jest.Mock };
  let usuariosServiceMock: { obtenerUsuarios: jest.Mock };
  let authServiceMock: { usuarioActual: jest.Mock; estaAutenticado: jest.Mock };
  let albumesServiceMock: { listarAlbumes: jest.Mock };

  beforeEach(() => {
    apiMock = { get: jest.fn().mockReturnValue(of([])), post: jest.fn().mockReturnValue(of({})) };
    usuariosServiceMock = { obtenerUsuarios: jest.fn() };
    authServiceMock = {
      usuarioActual: jest.fn().mockReturnValue({ id: 1, nombreUsuario: 'Yo', rol: 'Usuario' }),
      estaAutenticado: jest.fn().mockReturnValue(true),
    };
    albumesServiceMock = {
      listarAlbumes: jest.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      providers: [
        IntercambioService,
        { provide: ApiService, useValue: apiMock },
        { provide: UsuariosService, useValue: usuariosServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: AlbumesJugadorService, useValue: albumesServiceMock },
      ],
    });

    service = TestBed.inject(IntercambioService);
  });

  it('debe obtener coleccionistas priorizando a los que tienen cartas favoritas', (done) => {
    const coincidencias = [
      {
        id: 3,
        nombreUsuario: 'PedroConFavoritas',
        avatarUrl: null,
        coincidenciasFavoritas: 2,
        coincidenciasIntercambiables: 2,
        totalFavoritas: 3,
        porcentajeCoincidencia: 66.7,
        cartasFavoritasQueTiene: [],
      },
    ];

    const general = [
      {
        id: 2,
        nombreUsuario: 'MaertinSinFavoritas',
        fechaRegistro: '',
        avatarUrl: null,
        cartasDistintas: 5,
        totalCartas: 10,
        cartas: [],
      },
      {
        id: 3,
        nombreUsuario: 'PedroConFavoritas',
        fechaRegistro: '',
        avatarUrl: null,
        cartasDistintas: 2,
        totalCartas: 2,
        cartas: [],
      },
      {
        id: 1, // Usuario actual en sesión: debe ser excluido
        nombreUsuario: 'Yo',
        fechaRegistro: '',
        avatarUrl: null,
        cartasDistintas: 12,
        totalCartas: 20,
        cartas: [],
      },
    ];

    apiMock.get.mockImplementation((ruta: string) => {
      if (ruta === 'Usuarios/coincidencias') return of(coincidencias);
      if (ruta === 'Usuarios') return of(general);
      return of([]);
    });

    service.obtenerColeccionistas().subscribe((coleccionistas) => {
      expect(coleccionistas.length).toBe(2);
      // El primero debe ser Pedro por tener coincidencias favoritas
      expect(coleccionistas[0].id).toBe(3);
      expect(coleccionistas[0].coincidenciasFavoritas).toBe(2);
      expect(coleccionistas[0].mensajeEstado).toBeTruthy();

      // El segundo debe ser Maertin
      expect(coleccionistas[1].id).toBe(2);
      done();
    });
  });

  it('debe pasar los filtros de categoriaId y coleccionId en las consultas', (done) => {
    apiMock.get.mockReturnValue(of([]));

    service.obtenerColeccionistas({ categoriaId: 2, coleccionId: 5 }).subscribe(() => {
      expect(apiMock.get).toHaveBeenCalledWith(
        'Usuarios/coincidencias',
        expect.objectContaining({
          params: expect.objectContaining({ categoriaId: 2, coleccionId: 5 }),
        }),
      );
      expect(apiMock.get).toHaveBeenCalledWith(
        'Usuarios',
        expect.objectContaining({
          params: expect.objectContaining({ categoriaId: 2, coleccionId: 5, incluirInventario: true }),
        }),
      );
      done();
    });
  });

  it('debe obtener las opciones de categorías y colecciones', (done) => {
    apiMock.get.mockReturnValue(of([{ id: 1, nombre: 'Gastronomía' }]));
    albumesServiceMock.listarAlbumes.mockReturnValue(of([{ id: 10, marcaNombre: 'Aura', categoriaId: 1 }]));

    service.obtenerCategorias().subscribe((cats) => {
      expect(cats.length).toBe(1);
      expect(cats[0].nombre).toBe('Gastronomía');

      service.obtenerColecciones().subscribe((cols) => {
        expect(cols.length).toBe(1);
        expect(cols[0].nombre).toBe('Aura');
        done();
      });
    });
  });

  it('debe filtrar cartas repetidas con cantidad >= 2 y excluir cartas sin marca', (done) => {
    const cartas: CartaInventarioApi[] = [
      {
        cartaId: 10,
        nombre: 'Carta Única',
        descripcion: null,
        poder: 5,
        costoCupon: 3,
        rarezaId: 1,
        rareza: 'Común',
        rarezaOrden: 1,
        categoriaId: 1,
        categoria: 'gastronomia',
        imagenUrl: null,
        cantidad: 1,
      },
      {
        cartaId: 20,
        nombre: 'Carta Repetida',
        descripcion: 'Repetida',
        poder: 7,
        costoCupon: 4,
        rarezaId: 2,
        rareza: 'Rara',
        rarezaOrden: 2,
        categoriaId: 1,
        categoria: 'gastronomia',
        imagenUrl: null,
        cantidad: 3,
      },
    ];

    apiMock.get.mockReturnValue(of(cartas));

    service.obtenerCartasRepetidas().subscribe((repetidas) => {
      expect(repetidas.length).toBe(1);
      expect(repetidas[0].id).toBe('20');
      expect(repetidas[0].nombre).toBe('Carta Repetida');
      done();
    });
  });

  it('debe obtener cartas favoritas del coleccionista mapeando correctamente los campos', (done) => {
    const favoritasApi = [
      {
        cartaId: 101,
        nombre: 'Guacamole Supremo',
        descripcion: 'Delicia',
        poder: 5,
        costoCupon: 3,
        rarezaId: 4,
        rareza: 'Legendaria',
        rarezaOrden: 4,
        categoriaId: 1,
        categoria: 'gastronomia',
        imagenUrl: null,
        cantidad: 1,
      },
    ];

    apiMock.get.mockReturnValue(of(favoritasApi));

    service.obtenerCartasFavoritasDeColeccionista(5).subscribe((favoritas) => {
      expect(favoritas.length).toBe(1);
      expect(favoritas[0].id).toBe('101');
      expect(favoritas[0].nombre).toBe('Guacamole Supremo');
      expect(favoritas[0].rareza).toBe('legendaria');
      done();
    });
  });

  it('debe crear un intercambio enviando la solicitud correcta por POST', (done) => {
    const respuestaMock = {
      id: 55,
      estado: 'PENDIENTE',
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date().toISOString(),
    };
    apiMock.post.mockReturnValue(of(respuestaMock));

    service.crearIntercambio({ usuarioReceptorId: 2, cartaId: 10 }).subscribe((res) => {
      expect(apiMock.post).toHaveBeenCalledWith('Intercambios', { usuarioReceptorId: 2, cartaId: 10 });
      expect(res.id).toBe(55);
      expect(res.estado).toBe('PENDIENTE');
      done();
    });
  });

  it('debe responder un intercambio existente', (done) => {
    const respuestaMock = {
      id: 55,
      estado: 'EN_REVISION',
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date().toISOString(),
    };
    apiMock.post.mockReturnValue(of(respuestaMock));

    service.responderIntercambio(55, 20).subscribe((res) => {
      expect(apiMock.post).toHaveBeenCalledWith('Intercambios/55/responder', { cartaId: 20 });
      expect(res.estado).toBe('EN_REVISION');
      done();
    });
  });

  it('debe calcular correctamente los días restantes (máximo 3)', () => {
    const en3Dias = new Date(Date.now() + 3 * 86400000).toISOString();
    expect(service.calcularDiasRestantes(en3Dias)).toBe(3);

    const en1Dia = new Date(Date.now() + 1 * 86400000).toISOString();
    expect(service.calcularDiasRestantes(en1Dia)).toBe(1);

    const pasado = new Date(Date.now() - 100000).toISOString();
    expect(service.calcularDiasRestantes(pasado)).toBe(0);
  });

  describe('Sistema de Notificaciones y Novedades (!)', () => {
    const intercambioMock = {
      id: 88,
      estado: 'PENDIENTE',
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: new Date(Date.now() + 86400000).toISOString(),
      usuarioOfertanteId: 2,
      usuarioReceptorId: 1, // Usuario actual es el receptor
      cartas: [],
    };

    it('debe detectar actualización pendiente para el receptor cuando el estado es PENDIENTE', () => {
      expect(service.tieneActualizacionPendiente(intercambioMock, 1)).toBe(true);
      expect(service.tieneActualizacionPendiente(intercambioMock, 2)).toBe(false);
    });

    it('debe detectar actualización pendiente para el ofertante cuando el estado es EN_REVISION', () => {
      const enRevision = { ...intercambioMock, estado: 'EN_REVISION' };
      expect(service.tieneActualizacionPendiente(enRevision, 2)).toBe(true);
      expect(service.tieneActualizacionPendiente(enRevision, 1)).toBe(false);
    });

    it('debe marcar una tarjeta como vista y actualizar esIntercambioNovedad', () => {
      localStorage.clear();
      expect(service.esIntercambioNovedad(88, 'PENDIENTE')).toBe(true);

      service.marcarIntercambioVisto(88, 'PENDIENTE');
      expect(service.esIntercambioNovedad(88, 'PENDIENTE')).toBe(false);
    });

    it('debe verificar novedades para dashboard y menú', (done) => {
      localStorage.clear();
      apiMock.get.mockReturnValue(of([intercambioMock]));

      service.verificarNovedades().subscribe((res) => {
        expect(res.dashboard).toBe(true);
        expect(res.menu).toBe(true);
        expect(service.tieneNovedadDashboardSignal()).toBe(true);
        expect(service.tieneNovedadMenuSignal()).toBe(true);
        done();
      });
    });
  });
});
