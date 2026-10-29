import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SobresService } from './sobres.service';
import { ApiService } from './api.service';
import { AperturaSobreRespuesta, SobreRespuesta } from '@modelos/sobre.model';

describe('SobresService', () => {
  let service: SobresService;
  let httpTesting: HttpTestingController;
  let baseUrl: string;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SobresService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(SobresService);
    httpTesting = TestBed.inject(HttpTestingController);
    baseUrl = `${TestBed.inject(ApiService).urlBase}/Sobres`;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe obtener todos los sobres con GET /api/Sobres', () => {
    const mockSobres: SobreRespuesta[] = [
      {
        id: 1,
        nombre: 'Sobre General',
        tipo: 'GENERAL',
        precio: 0,
        cantidadCartas: 4,
      },
    ];

    service.obtenerSobres().subscribe((res) => {
      expect(res).toEqual(mockSobres);
    });

    const req = httpTesting.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockSobres);
  });

  it('debe omitir sobres de marcas eliminadas o sin marca al listar el catálogo', () => {
    const mockSobres: SobreRespuesta[] = [
      {
        id: 1,
        nombre: 'Sobre Burger Bust',
        tipo: 'MARCA',
        marca: 'Burger Bust',
        precio: 150,
        cantidadCartas: 1,
      },
      {
        id: 2,
        nombre: 'Sobre McDonald\'s',
        tipo: 'MARCA',
        marca: 'McDonald\'s',
        precio: 150,
        cantidadCartas: 1,
      },
      {
        id: 3,
        nombre: 'Sobre Huérfano',
        tipo: 'MARCA',
        marca: '   ',
        precio: 150,
        cantidadCartas: 1,
      },
    ];

    let resultado: SobreRespuesta[] = [];
    service.obtenerSobres().subscribe((res) => (resultado = res));

    httpTesting.expectOne(baseUrl).flush(mockSobres);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].marca).toBe('Burger Bust');
  });

  it('debe abrir un sobre con POST /api/Sobres/{id}/abrir', () => {
    const mockApertura: AperturaSobreRespuesta = {
      id: 10,
      sobreId: 2,
      fecha: '2026-10-08T00:00:00Z',
      cartas: [
        { cartaId: 1, nombre: 'Super Grido', cantidad: 1, imagenUrl: null },
      ],
    };

    service.abrirSobre(2, 5).subscribe((res) => {
      expect(res).toEqual(mockApertura);
    });

    const req = httpTesting.expectOne(`${baseUrl}/2/abrir`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ usuarioId: 5 });
    req.flush(mockApertura);
  });

  it('debe filtrar cartas huérfanas de marcas eliminadas al abrir un sobre o reclamar diario', () => {
    const mockAperturaConHuerfanas: AperturaSobreRespuesta = {
      id: 12,
      sobreId: 1,
      fecha: '2026-10-08T00:00:00Z',
      cartas: [
        { cartaId: 1, nombre: 'Royal Bacon Melt', cantidad: 1, imagenUrl: null },
        { cartaId: 90, nombre: 'Ensalada Caesar con Pollo Crispy', cantidad: 1, imagenUrl: null },
        { cartaId: 91, nombre: 'Super Cono', cantidad: 1, imagenUrl: null },
      ],
    };

    let resultado: AperturaSobreRespuesta | undefined;
    service.reclamarSobreDiario(5).subscribe((res) => (resultado = res));

    httpTesting.expectOne(`${baseUrl}/diario`).flush(mockAperturaConHuerfanas);
    expect(resultado?.cartas.map((c) => c.nombre)).toEqual(['Royal Bacon Melt']);
  });

  it('debe reclamar sobre diario con POST /api/Sobres/diario', () => {
    const mockApertura: AperturaSobreRespuesta = {
      id: 11,
      sobreId: 1,
      fecha: '2026-10-08T00:00:00Z',
      cartas: [
        { cartaId: 2, nombre: 'Carta Diaria', cantidad: 1, imagenUrl: null },
      ],
    };

    service.reclamarSobreDiario(5).subscribe((res) => {
      expect(res).toEqual(mockApertura);
    });

    const req = httpTesting.expectOne(`${baseUrl}/diario`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ usuarioId: 5 });
    req.flush(mockApertura);
  });
});
