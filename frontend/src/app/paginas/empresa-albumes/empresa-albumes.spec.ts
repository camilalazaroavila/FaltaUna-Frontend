import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import type { AlbumRespuesta } from '@modelos/album.model';
import { PLANES } from '@modelos/plan.model';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumesService } from '@servicios/albumes.service';
import { EstadisticasEmpresaService } from '@servicios/estadisticas-empresa-service';
import { PagosService } from '@servicios/pagos.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import type { EstadisticasEmpresaRespuesta } from '@paginas/empresa-estadisticas/empresa-estadisticas';
import { EmpresaAlbumes } from './empresa-albumes';

const ESTADISTICAS_GENERALES_MOCK: EstadisticasEmpresaRespuesta = {
  nombreMarca: 'Havanna',
  categoria: 'Gastronomía',
  totalJugadoresInteractuando: 200,
  jugadoresCompletaronAlbumes: 50,
  porcentajeJugadoresCompletaron: 25,
  variacionCompletaronPorcentaje: 10,
  cartasIntercambiadas: 80,
  variacionIntercambiosPorcentaje: 5,
  jugadoresConCartasFavoritas: 120,
  variacionJugadoresFavoritasPorcentaje: 15,
  partidasConTusCartas: 300,
  variacionPartidasPorcentaje: 20,
  totalFavoritos: 150,
  favoritosPorAlbum: [{ coleccionId: 1, nombreAlbum: 'Colección Verano', cantidadFavoritos: 95 }],
  favoritosPorRareza: [],
  cartasMasQueridas: [],
  evolucionFavoritos: [],
};

const COLECCIONES_MOCK: AlbumRespuesta[] = [
  {
    id: 1,
    nombre: 'Colección Verano',
    descripcion: 'Álbum refrescante',
    fechaInicio: '2026-01-10T00:00:00Z',
    fechaFin: '2026-03-10T00:00:00Z',
    activa: true,
    marcaId: 10,
    marcaNombre: 'Havanna',
    marcaLogoUrl: '/logo.png',
    cantidadImagenes: 2,
    imagenesAlbum: [
      {
        id: 101,
        codigo: 'C-101',
        descripcion: 'Frappé Dulce',
        imagenUrl: '/c1.png',
        rarezaId: 4,
        rareza: 'Legendaria',
        poder: 12,
        costeTicket: 5,
        totalObtenidas: 50,
        totalFavoritos: 30,
        totalIntercambios: 12,
        totalPartidas: 85,
      },
      {
        id: 102,
        codigo: 'C-102',
        descripcion: 'Alfajor Limón',
        imagenUrl: '/c2.png',
        rarezaId: 1,
        rareza: 'Común',
        poder: 6,
        costeTicket: 2,
        totalObtenidas: 100,
        totalFavoritos: 15,
        totalIntercambios: 40,
        totalPartidas: 110,
      },
    ],
  },
];

describe('EmpresaAlbumes (estadísticas por álbum y por carta)', () => {
  let fixture: ComponentFixture<EmpresaAlbumes>;
  let componente: EmpresaAlbumes;
  let estadisticasMock: { obtenerEstadisticas: jest.Mock };
  let albumesMock: { obtenerMisAlbumes: jest.Mock };
  let pagosMock: { obtenerPago: jest.Mock };

  beforeEach(async () => {
    estadisticasMock = {
      obtenerEstadisticas: jest.fn().mockReturnValue(of(ESTADISTICAS_GENERALES_MOCK)),
    };

    albumesMock = {
      obtenerMisAlbumes: jest.fn().mockReturnValue(of(COLECCIONES_MOCK)),
    };

    pagosMock = {
      obtenerPago: jest.fn().mockReturnValue(of(null)),
    };

    await TestBed.configureTestingModule({
      imports: [EmpresaAlbumes],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EstadisticasEmpresaService, useValue: estadisticasMock },
        { provide: AlbumesService, useValue: albumesMock },
        { provide: PagosService, useValue: pagosMock },
      ],
    }).compileComponents();

    TestBed.inject(SuscripcionEstado).planElegido.set(PLANES[1]); // Plan Standard (5 álbumes)
    fixture = TestBed.createComponent(EmpresaAlbumes);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga las colecciones junto con las estadísticas generales y por marca', () => {
    expect(componente).toBeTruthy();
    expect(albumesMock.obtenerMisAlbumes).toHaveBeenCalledTimes(1);
    expect(estadisticasMock.obtenerEstadisticas).toHaveBeenCalledWith();
    expect(estadisticasMock.obtenerEstadisticas).toHaveBeenCalledWith(10);
    expect(componente['totalUsuarios']()).toBe(200);
    expect(componente['albumes']()).toHaveLength(1);
  });

  it('construye el resumen estadístico del álbum (favoritos, intercambios, % completado y reparto de rareza)', () => {
    const album = componente['albumes']()[0];
    expect(album.marcaNombre).toBe('Havanna');
    expect(album.jugadoresCompletaron).toBe(50);
    expect(album.resumen.totalCartas).toBe(2);
    expect(album.resumen.favoritos).toBe(95);
    expect(album.resumen.intercambios).toBe(80);
    expect(album.resumen.porcentajeCompletado).toBe(25);
    expect(album.resumen.reparto.map((r) => ({ rareza: r.rareza, porcentaje: r.porcentaje }))).toEqual([
      { rareza: 'comun', porcentaje: 50 },
      { rareza: 'legendaria', porcentaje: 50 },
    ]);
  });

  it('expone los 4 KPIs del álbum al seleccionarlo', () => {
    componente['seleccionarAlbum']('1');
    fixture.detectChanges();

    expect(componente['kpisAlbum']()).toEqual([
      { etiqueta: 'Cartas', valor: '2', contexto: 'En todo el álbum' },
      { etiqueta: 'Completaron', valor: '25%', contexto: '50 jugadores' },
      { etiqueta: 'Favoritos', valor: '95', contexto: 'Marcas de tus cartas' },
      { etiqueta: 'Intercambios', valor: '80', contexto: 'Entre jugadores' },
    ]);
  });

  it('calcula las estadísticas individuales de una carta al seleccionarla en el modal', () => {
    componente['seleccionarAlbum']('1');
    const carta = componente['cartasDelAlbum']().find((c) => c.id === '101')!;
    componente['abrirCarta'](carta);
    fixture.detectChanges();

    const estCarta = componente['estadisticasSeleccionada']();
    expect(estCarta).toEqual({
      usuariosQueLaTienen: 50,
      porcentajeUsuarios: 25, // 50 de 200 jugadores = 25%
      favoritos: 30,
      intercambios: 12,
      partidas: 85,
    });

    const dialogo = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialogo).toBeTruthy();
    expect(dialogo.textContent).toContain('Frappé Dulce');
    expect(dialogo.textContent).toContain('25%');
  });

  it('filtra y ordena las cartas del álbum seleccionado y cierra el modal con Escape', () => {
    componente['seleccionarAlbum']('1');

    // Orden por defecto: nombre-asc (Alfajor Limón, Frappé Dulce)
    expect(componente['cartasFiltradas']().map((c) => c.nombre)).toEqual([
      'Alfajor Limón',
      'Frappé Dulce',
    ]);

    // Filtrar por rareza legendaria
    componente['toggleRareza']('legendaria');
    expect(componente['cartasFiltradas']().map((c) => c.nombre)).toEqual(['Frappé Dulce']);

    // Limpiar filtros
    componente['limpiarFiltros']();
    expect(componente['cartasFiltradas']()).toHaveLength(2);

    // Abrir carta y presionar Escape cierra primero la carta y luego vuelve a la grilla
    componente['abrirCarta'](componente['cartasDelAlbum']()[0]);
    expect(componente['cartaSeleccionada']()).not.toBeNull();

    componente['alPresionarEscape']();
    expect(componente['cartaSeleccionada']()).toBeNull();
    expect(componente['albumActivo']()).toBe('1');

    componente['alPresionarEscape']();
    expect(componente['albumActivo']()).toBeNull();
  });

  it('permite iniciar la creación de un nuevo álbum cuando el plan activo lo habilita', () => {
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const borrador = TestBed.inject(AlbumBorrador);
    const limpiarSpy = jest.spyOn(borrador, 'limpiar');

    expect(componente['puedeCrearNuevoAlbum']()).toBe(true);
    componente['crearNuevoAlbum']();

    expect(limpiarSpy).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/empresa/album/crear/marca']);
  });

  it('muestra esqueletos de carga mientras cargando() es verdadero', () => {
    componente['cargando'].set(true);
    fixture.detectChanges();
    const esqueletos = fixture.nativeElement.querySelectorAll('app-esqueleto');
    expect(esqueletos.length).toBeGreaterThan(0);
  });
});
