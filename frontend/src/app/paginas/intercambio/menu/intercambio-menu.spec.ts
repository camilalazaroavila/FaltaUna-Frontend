import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { IntercambioMenu } from './intercambio-menu';
import { GsapService } from '@servicios/gsap.service';
import { IntercambioService } from '@servicios/intercambio.service';

describe('IntercambioMenu', () => {
  let component: IntercambioMenu;
  let fixture: ComponentFixture<IntercambioMenu>;

  beforeEach(async () => {
    const gsapServiceMock = {
      movimientoReducido: jest.fn().mockReturnValue(true),
      crearContexto: jest.fn(),
      gsap: {
        timeline: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnThis(),
        }),
      },
    };

    const intercambioServiceMock = {
      marcarDashboardIntercambioVisto: jest.fn(),
      verificarNovedades: jest.fn().mockReturnValue(of({ dashboard: false, menu: false })),
      tieneNovedadMenuSignal: signal(false),
    };

    await TestBed.configureTestingModule({
      imports: [IntercambioMenu],
      providers: [
        provideRouter([]),
        { provide: GsapService, useValue: gsapServiceMock },
        { provide: IntercambioService, useValue: intercambioServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IntercambioMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar la opción "Buscar coleccionistas"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Buscar coleccionistas');
  });

  it('no debe mostrar la opción "Intercambiar con un amigo"', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Intercambiar con un amigo');
  });

  it('debe mostrar la insignia "!" cuando hay novedades activas', () => {
    component['tieneNovedadActivos'].set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('!');
  });
});
