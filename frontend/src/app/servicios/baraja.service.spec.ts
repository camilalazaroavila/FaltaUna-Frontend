import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import {
  BarajaService,
  NOMBRES_MAZOS_BIENVENIDA,
  resolverNombreMazoInicial,
} from './baraja.service';
describe('BarajaService', () => {
  let servicio: BarajaService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(BarajaService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('consulta y adapta las cartas disponibles del inventario', async () => {
    const respuesta = firstValueFrom(servicio.obtenerCartasDisponibles());
    const solicitud = http.expectOne(`${environment.apiUrl}/Mazos/cartas-disponibles`);
    solicitud.flush([
      {
        cartaId: 7,
        nombre: 'Carta real',
        descripcion: null,
        poder: 12,
        costoCupon: 3,
        rarezaId: 2,
        rareza: 'Rara',
        rarezaOrden: 2,
        categoriaId: 1,
        categoria: 'Gastronomía',
        imagenUrl: null,
        cantidad: 1,
      },
    ]);
    await expect(respuesta).resolves.toEqual([
      expect.objectContaining({
        id: '7',
        nombre: 'Carta real',
        rareza: 'rara',
        categoria: 'gastronomia',
        atributoIzquierdo: 3,
        atributoDerecho: 12,
        obtenida: true,
      }),
    ]);
  });
  it('filtra cartas huérfanas cuya marca o colección fue eliminada', async () => {
    const respuesta = firstValueFrom(servicio.obtenerCartasDisponibles());
    const solicitud = http.expectOne(`${environment.apiUrl}/Mazos/cartas-disponibles`);
    solicitud.flush([
      {
        cartaId: 1,
        nombre: 'Royal Bacon Melt',
        descripcion: null,
        poder: 8,
        costoCupon: 5,
        rarezaId: 3,
        rareza: 'Épica',
        rarezaOrden: 3,
        categoriaId: 1,
        categoria: 'Gastronomía',
        imagenUrl: null,
        cantidad: 2,
      },
      {
        cartaId: 90,
        nombre: 'Ensalada Caesar con Pollo Crispy',
        descripcion: null,
        poder: 5,
        costoCupon: 2,
        rarezaId: 1,
        rareza: 'Común',
        rarezaOrden: 1,
        categoriaId: 1,
        categoria: 'Gastronomía',
        imagenUrl: null,
        cantidad: 1,
      },
      {
        cartaId: 91,
        nombre: 'Super Cono',
        descripcion: null,
        poder: 4,
        costoCupon: 1,
        rarezaId: 1,
        rareza: 'Común',
        rarezaOrden: 1,
        categoriaId: 1,
        categoria: 'Gastronomía',
        imagenUrl: null,
        cantidad: 1,
      },
      {
        cartaId: 92,
        nombre: 'Carta sin marca en API',
        descripcion: null,
        poder: 6,
        costoCupon: 2,
        rarezaId: 2,
        rareza: 'Rara',
        rarezaOrden: 2,
        categoriaId: 1,
        categoria: 'Gastronomía',
        imagenUrl: null,
        cantidad: 1,
        marcaNombre: '',
      },
      {
        cartaId: 93,
        nombre: 'Carta de colección inactiva',
        descripcion: null,
        poder: 6,
        costoCupon: 2,
        rarezaId: 2,
        rareza: 'Rara',
        rarezaOrden: 2,
        categoriaId: 1,
        categoria: 'Gastronomía',
        imagenUrl: null,
        cantidad: 1,
        coleccionActiva: false,
      },
    ]);

    const cartas = await respuesta;
    expect(cartas).toHaveLength(1);
    expect(cartas[0].nombre).toBe('Royal Bacon Melt');
  });
  it('obtiene un mazo vacío cuando el usuario todavía no creó uno', async () => {
    const respuesta = firstValueFrom(servicio.obtenerMazoActual());
    http.expectOne(`${environment.apiUrl}/Mazos`).flush([]);
    await expect(respuesta).resolves.toBeNull();
  });
  it('reemplaza los nombres genéricos de bienvenida por nombres acordes a las cartas del mazo', async () => {
    const respuesta = firstValueFrom(servicio.obtenerMazos());
    http.expectOne(`${environment.apiUrl}/Mazos`).flush([
      {
        id: 1,
        nombre: 'Mazo de Bienvenida 1',
        completo: true,
        cartas: [
          {
            cartaId: 12,
            nombre: 'Golden Run',
            poder: 9,
            costoCupon: 6,
            rarezaId: 4,
            rareza: 'Legendaria',
            rarezaOrden: 4,
            imagenUrl: null,
          },
        ],
      },
      {
        id: 2,
        nombre: 'Mazo de Bienvenida 2',
        completo: true,
        cartas: [
          {
            cartaId: 24,
            nombre: 'Harmony Sound DJ Controller',
            poder: 10,
            costoCupon: 6,
            rarezaId: 4,
            rareza: 'Legendaria',
            rarezaOrden: 4,
            imagenUrl: null,
          },
        ],
      },
      {
        id: 3,
        nombre: 'Mazo de Bienvenida 3',
        completo: true,
        cartas: [
          {
            cartaId: 36,
            nombre: 'Croquembouche Imperial de Caramelo',
            poder: 10,
            costoCupon: 6,
            rarezaId: 4,
            rareza: 'Legendaria',
            rarezaOrden: 4,
            imagenUrl: null,
          },
        ],
      },
    ]);

    const mazos = await respuesta;
    expect(mazos.map((m) => m.nombre)).toEqual([...NOMBRES_MAZOS_BIENVENIDA]);
    expect(resolverNombreMazoInicial('Mi Baraja Personalizada', [], 0)).toBe(
      'Mi Baraja Personalizada',
    );
  });
  it('crea la baraja enviando nombre e ids de cartas', async () => {
    const cartas = [
      {
        id: '7',
        nombre: 'Carta',
        imagenUrl: '',
        rareza: 'rara' as const,
        categoria: 'gastronomia' as const,
        atributoIzquierdo: 1,
        atributoDerecho: 1,
        obtenida: true,
      },
    ];
    const respuesta = firstValueFrom(servicio.guardarBaraja(cartas, 'Mi mazo'));
    const solicitud = http.expectOne(`${environment.apiUrl}/Mazos`);
    expect(solicitud.request.method).toBe('POST');
    expect(solicitud.request.body).toEqual({ nombre: 'Mi mazo', cartasIds: [7] });
    solicitud.flush({
      id: 3,
      nombre: 'Mi mazo',
      completo: false,
      cartas: [],
    });
    await expect(respuesta).resolves.toEqual([]);
  });
});
