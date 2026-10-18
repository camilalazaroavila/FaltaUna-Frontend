import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { BarajaService } from './baraja.service';
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
        costoMana: 3,
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
        atributoIzquierdo: 12,
        atributoDerecho: 3,
        obtenida: true,
      }),
    ]);
  });
  it('obtiene un mazo vacío cuando el usuario todavía no creó uno', async () => {
    const respuesta = firstValueFrom(servicio.obtenerMazoActual());
    http.expectOne(`${environment.apiUrl}/Mazos`).flush([]);
    await expect(respuesta).resolves.toBeNull();
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