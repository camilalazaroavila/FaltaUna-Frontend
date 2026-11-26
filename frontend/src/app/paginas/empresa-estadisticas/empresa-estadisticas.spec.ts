import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EstadisticasEmpresaService } from '@app/servicios/estadisticas-empresa-service';
import { AlbumesService } from '@servicios/albumes.service';
import {
  EmpresaEstadisticas,
  type EstadisticasEmpresaRespuesta,
} from './empresa-estadisticas';

const ESTADISTICAS_MOCK: EstadisticasEmpresaRespuesta = {
  nombreMarca: 'Havanna',
  categoria: 'Gastronomía',
  totalJugadoresInteractuando: 1500,
  jugadoresCompletaronAlbumes: 300,
  porcentajeJugadoresCompletaron: 20,
  variacionCompletaronPorcentaje: 12,
  cartasIntercambiadas: 450,
  variacionIntercambiosPorcentaje: -5,
  jugadoresConCartasFavoritas: 600,
  variacionJugadoresFavoritasPorcentaje: 0,
  partidasConTusCartas: 1100,
  variacionPartidasPorcentaje: 18,
  totalFavoritos: 800,
  favoritosPorAlbum: [
    { coleccionId: 1, nombreAlbum: 'Alfajores Clásicos', cantidadFavoritos: 500 },
    { coleccionId: 2, nombreAlbum: 'Edición Invierno', cantidadFavoritos: 250 },
  ],
  favoritosPorRareza: [
    { rareza: 'Común', orden: 1, cantidad: 400, porcentaje: 50 },
    { rareza: 'Rara', orden: 2, cantidad: 240, porcentaje: 30 },
    { rareza: 'Épica', orden: 3, cantidad: 120, porcentaje: 15 },
    { rareza: 'Legendaria', orden: 4, cantidad: 40, porcentaje: 5 },
  ],
  cartasMasQueridas: [
    {
      posicion: 1,
      cartaId: 101,
      nombreCarta: 'Alfajor 70% Cacao',
      nombreAlbum: 'Alfajores Clásicos',
      cantidadFavoritos: 210,
    },
    {
      posicion: 2,
      cartaId: 102,
      nombreCarta: 'Havannet Dulce de Leche',
      nombreAlbum: 'Alfajores Clásicos',
      cantidadFavoritos: 145,
    },
  ],
  evolucionFavoritos: [
    { mes: 'Sep', cantidadFavoritos: 100 },
    { mes: 'Oct', cantidadFavoritos: 200 },
  ],
};

describe('EmpresaEstadisticas', () => {
  let fixture: ComponentFixture<EmpresaEstadisticas>;
  let componente: EmpresaEstadisticas;
  let estadisticasMock: { obtenerEstadisticas: jest.Mock };
  let albumesMock: { obtenerMisAlbumes: jest.Mock };

  beforeEach(async () => {
    estadisticasMock = {
      obtenerEstadisticas: jest.fn().mockReturnValue(of(ESTADISTICAS_MOCK)),
    };

    albumesMock = {
      obtenerMisAlbumes: jest.fn().mockReturnValue(
        of([
          { id: 1, marcaId: 10, marcaNombre: 'Havanna' },
          { id: 2, marcaId: 10, marcaNombre: 'Havanna' },
          { id: 3, marcaId: 20, marcaNombre: 'Grido' },
        ]),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [EmpresaEstadisticas],
      providers: [
        { provide: EstadisticasEmpresaService, useValue: estadisticasMock },
        { provide: AlbumesService, useValue: albumesMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmpresaEstadisticas);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse y cargar marcas únicas y estadísticas iniciales', () => {
    expect(componente).toBeTruthy();
    expect(albumesMock.obtenerMisAlbumes).toHaveBeenCalledTimes(1);
    expect(estadisticasMock.obtenerEstadisticas).toHaveBeenCalledWith(undefined);
    expect(componente['cargando']()).toBe(false);
    expect(componente['marcas']()).toEqual([
      { id: 10, nombre: 'Havanna' },
      { id: 20, nombre: 'Grido' },
    ]);
  });

  it('calcula los 4 KPIs generales con formato de tendencia positiva y negativa', () => {
    const kpis = componente['kpis']();
    expect(kpis).toHaveLength(4);

    const kpiCompletaron = kpis.find((k) => k.id === 'completaron')!;
    expect(kpiCompletaron.etiqueta).toBe('Total de jugadores que completaron tus álbumes');
    expect(kpiCompletaron.valor).toBe((300).toLocaleString('es-AR'));
    expect(kpiCompletaron.detalle).toBe('');
    expect(kpiCompletaron.tendencia).toBe('+12%');
    expect(kpiCompletaron.tendenciaPositiva).toBe(true);

    const kpiIntercambios = kpis.find((k) => k.id === 'intercambios')!;
    expect(kpiIntercambios.etiqueta).toBe('Total de cartas intercambiadas de tus álbumes');
    expect(kpiIntercambios.tendencia).toBe('-5%');
    expect(kpiIntercambios.tendenciaPositiva).toBe(false);

    const kpiFavoritas = kpis.find((k) => k.id === 'favoritas')!;
    expect(kpiFavoritas.etiqueta).toBe('Total de jugadores que marcaron tus cartas como favoritas');
    expect(kpiFavoritas.tendencia).toBe('+0%');
    expect(kpiFavoritas.tendenciaPositiva).toBe(true);

    const kpiPartidas = kpis.find((k) => k.id === 'partidas')!;
    expect(kpiPartidas.etiqueta).toBe('Total de cartas usadas en partidas');
  });

  it('adapta las descripciones de los KPIs a singular cuando está filtrado por marca/álbum', () => {
    componente['seleccionarMarca'](10);
    const kpis = componente['kpis']();

    expect(kpis.find((k) => k.id === 'completaron')?.etiqueta).toBe('Total de jugadores que completaron el álbum');
    expect(kpis.find((k) => k.id === 'intercambios')?.etiqueta).toBe('Total de cartas intercambiadas del álbum');
    expect(kpis.find((k) => k.id === 'favoritas')?.etiqueta).toBe('Total de jugadores que marcaron cartas del álbum como favoritas');
    expect(kpis.find((k) => k.id === 'partidas')?.etiqueta).toBe('Total de cartas del álbum usadas en partidas');
  });

  it('muestra esqueletos de carga mientras el estado cargando es verdadero', () => {
    componente['cargando'].set(true);
    fixture.detectChanges();
    const esqueletos = fixture.nativeElement.querySelectorAll('app-esqueleto');
    expect(esqueletos.length).toBeGreaterThan(0);
  });

  it('limita el ranking de cartas más queridas al top 3', () => {
    componente['datos'].set({
      ...ESTADISTICAS_MOCK,
      cartasMasQueridas: [
        { posicion: 1, cartaId: 1, nombreCarta: 'C1', nombreAlbum: 'A', cantidadFavoritos: 10 },
        { posicion: 2, cartaId: 2, nombreCarta: 'C2', nombreAlbum: 'A', cantidadFavoritos: 9 },
        { posicion: 3, cartaId: 3, nombreCarta: 'C3', nombreAlbum: 'A', cantidadFavoritos: 8 },
        { posicion: 4, cartaId: 4, nombreCarta: 'C4', nombreAlbum: 'A', cantidadFavoritos: 7 },
      ],
    });
    expect(componente['topCartas']()).toHaveLength(3);
  });

  it('normaliza los porcentajes de favoritos por álbum respecto al álbum con más favoritos', () => {
    const porAlbum = componente['favoritosPorAlbum']();
    expect(porAlbum).toEqual([
      { id: 1, etiqueta: 'Alfajores Clásicos', cantidad: 500, porcentaje: 100 },
      { id: 2, etiqueta: 'Edición Invierno', cantidad: 250, porcentaje: 50 },
    ]);
  });

  it('calcula la distribución por rareza y el conic-gradient del gráfico donut', () => {
    const distribucion = componente['distribucionRareza']();
    expect(distribucion).toHaveLength(4);
    expect(distribucion[0]).toEqual({
      etiqueta: 'Común',
      cantidad: 400,
      porcentaje: 50,
      color: 'var(--rareza-1)',
    });

    expect(componente['donutFondo']()).toBe(
      'conic-gradient(var(--rareza-1) 0% 50%, var(--rareza-2) 50% 80%, var(--rareza-3) 80% 95%, var(--rareza-4) 95% 100%)',
    );
    expect(componente['totalFavoritosRareza']()).toBe((800).toLocaleString('es-AR'));
  });

  it('mapea el ranking de cartas más queridas y normaliza la evolución mensual', () => {
    expect(componente['topCartas']()).toEqual([
      { nombre: 'Alfajor 70% Cacao', album: 'Alfajores Clásicos', favoritos: 210 },
      { nombre: 'Havannet Dulce de Leche', album: 'Alfajores Clásicos', favoritos: 145 },
    ]);

    expect(componente['evolucion']()).toEqual([
      { etiqueta: 'Sep', valor: 100, altura: 50 },
      { etiqueta: 'Oct', valor: 200, altura: 100 },
    ]);
  });

  it('filtra estadísticas al seleccionar una marca y evita recargar si se elige la misma', () => {
    estadisticasMock.obtenerEstadisticas.mockClear();

    componente['seleccionarMarca'](10);
    expect(componente['marcaSeleccionadaId']()).toBe(10);
    expect(estadisticasMock.obtenerEstadisticas).toHaveBeenCalledTimes(1);
    expect(estadisticasMock.obtenerEstadisticas).toHaveBeenCalledWith(10);

    // Misma marca: no debe volver a llamar al servicio
    componente['seleccionarMarca'](10);
    expect(estadisticasMock.obtenerEstadisticas).toHaveBeenCalledTimes(1);

    // Volver a "Todas"
    componente['seleccionarMarca'](undefined);
    expect(componente['marcaSeleccionadaId']()).toBeUndefined();
    expect(estadisticasMock.obtenerEstadisticas).toHaveBeenCalledWith(undefined);
  });

  it('maneja errores cuando falla la carga de estadísticas', () => {
    estadisticasMock.obtenerEstadisticas.mockReturnValueOnce(
      throwError(() => new Error('Fallo HTTP')),
    );

    componente['seleccionarMarca'](20);

    expect(componente['cargando']()).toBe(false);
    expect(componente['error']()).toBe('No se pudieron obtener las estadísticas');
  });
});
