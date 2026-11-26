import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { EstadisticasEmpresaService } from './estadisticas-empresa-service';
import type { EstadisticasEmpresaRespuesta } from '@app/paginas/empresa-estadisticas/empresa-estadisticas';

const RESPUESTA_MOCK: EstadisticasEmpresaRespuesta = {
  nombreMarca: 'Grido',
  categoria: 'Gastronomía',
  totalJugadoresInteractuando: 1200,
  jugadoresCompletaronAlbumes: 180,
  porcentajeJugadoresCompletaron: 15,
  variacionCompletaronPorcentaje: 8,
  cartasIntercambiadas: 340,
  variacionIntercambiosPorcentaje: -4,
  jugadoresConCartasFavoritas: 510,
  variacionJugadoresFavoritasPorcentaje: 12,
  partidasConTusCartas: 920,
  variacionPartidasPorcentaje: 20,
  totalFavoritos: 860,
  favoritosPorAlbum: [{ coleccionId: 1, nombreAlbum: 'Sabores Clásicos', cantidadFavoritos: 860 }],
  favoritosPorRareza: [{ rareza: 'Común', orden: 1, cantidad: 400, porcentaje: 46.5 }],
  cartasMasQueridas: [
    {
      posicion: 1,
      cartaId: 10,
      nombreCarta: 'Super Gridito',
      nombreAlbum: 'Sabores Clásicos',
      cantidadFavoritos: 250,
    },
  ],
  evolucionFavoritos: [{ mes: 'Oct', cantidadFavoritos: 140 }],
};

describe('EstadisticasEmpresaService', () => {
  let servicio: EstadisticasEmpresaService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servicio = TestBed.inject(EstadisticasEmpresaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('consulta las estadísticas generales sin parámetro marcaId cuando no se especifica', async () => {
    const promesa = firstValueFrom(servicio.obtenerEstadisticas());
    const req = http.expectOne(`${environment.apiUrl}/EstadisticasEmpresa/estadisticas`);

    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toHaveLength(0);

    req.flush(RESPUESTA_MOCK);
    await expect(promesa).resolves.toEqual(RESPUESTA_MOCK);
  });

  it('consulta las estadísticas filtradas enviando marcaId por query string', async () => {
    const promesa = firstValueFrom(servicio.obtenerEstadisticas(7));
    const req = http.expectOne(
      (r) =>
        r.url === `${environment.apiUrl}/EstadisticasEmpresa/estadisticas` &&
        r.params.get('marcaId') === '7',
    );

    expect(req.request.method).toBe('GET');
    req.flush(RESPUESTA_MOCK);
    await expect(promesa).resolves.toEqual(RESPUESTA_MOCK);
  });
});
