import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TutorialServicio } from '@compartidos/componentes/tutorial/tutorial.servicio';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import { Tutorial } from './tutorial';

describe('Tutorial', () => {
  let servicio: PartidaServicio;
  let tutorial: TutorialServicio;

  const avanzarHasta = (indiceObjetivo: number): void => {
    while (tutorial.indice() < indiceObjetivo) {
      const espera = tutorial.paso().espera;
      if (espera) {
        tutorial.notificar(espera);
      }
      tutorial.siguiente();
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tutorial],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    servicio = TestBed.inject(PartidaServicio);
    tutorial = TestBed.inject(TutorialServicio);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('prepara el escenario guionado y arranca el tutorial', () => {
    const fixture = TestBed.createComponent(Tutorial);
    fixture.detectChanges();

    expect(tutorial.activo()).toBe(true);
    expect(servicio.manoPropia()).toHaveLength(4);
    expect(servicio.turno()).toBe(1);
    expect(servicio.cuponesPropio()).toBe(3);
  });

  it('usa la clase partida-activa en el contenedor principal', () => {
    const fixture = TestBed.createComponent(Tutorial);
    fixture.detectChanges();

    const main = fixture.nativeElement.querySelector('main');
    expect(main).not.toBeNull();
    expect(main.classList.contains('partida-activa')).toBe(true);
  });

  it('cierra el detalle de carta al cambiar de paso', () => {
    const fixture = TestBed.createComponent(Tutorial);
    fixture.detectChanges();

    const comp = fixture.componentInstance as any;
    const tablero = comp.tablero();
    if (tablero) {
      jest.spyOn(tablero, 'cerrarCarta');
      tutorial.siguiente();
      fixture.detectChanges();
      expect(tablero.cerrarCarta).toHaveBeenCalled();
    }
  });

  it('avanza el paso automáticamente al jugar una carta', () => {
    const fixture = TestBed.createComponent(Tutorial);
    fixture.detectChanges();

    // Llevar al paso de jugar carta (índice 7)
    avanzarHasta(7);
    fixture.detectChanges();
    expect(tutorial.paso().espera).toBe('carta-jugada');
    expect(tutorial.indice()).toBe(7);

    const comp = fixture.componentInstance as any;
    comp.alJugarCarta();
    fixture.detectChanges();

    expect(tutorial.indice()).toBe(8);
  });

  it('el avance de turno-finalizado ocurre recién tras los 1200 ms y se limpia al salir', () => {
    jest.useFakeTimers();

    const fixture = TestBed.createComponent(Tutorial);
    fixture.detectChanges();

    // Llevar al paso de fin de turno (índice 8)
    avanzarHasta(8);
    fixture.detectChanges();
    expect(tutorial.paso().espera).toBe('turno-finalizado');
    expect(tutorial.indice()).toBe(8);

    const comp = fixture.componentInstance as any;
    comp.alFinalizarTurno();
    fixture.detectChanges();

    // Aún no transcurrieron los 1200 ms: sigue en el paso 8
    expect(tutorial.indice()).toBe(8);

    // Avanzan los 1200 ms: se resuelve la ronda guionada y avanza al paso 9
    jest.advanceTimersByTime(1200);
    fixture.detectChanges();

    expect(tutorial.indice()).toBe(9);
  });

  it('restaura la maqueta original al destruir la página', () => {
    const fixture = TestBed.createComponent(Tutorial);
    fixture.detectChanges();

    fixture.destroy();

    expect(servicio.manoPropia()).toHaveLength(5);
    expect(servicio.turno()).toBe(3);
    expect(servicio.cuponesPropio()).toBe(3);
  });
});
