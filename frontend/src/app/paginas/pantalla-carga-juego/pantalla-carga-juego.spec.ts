import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { EmparejamientoService } from '@servicios/emparejamiento.service';
import { GsapService } from '@servicios/gsap.service';
import { PantallaCargaJuego } from './pantalla-carga-juego';

describe('PantallaCargaJuego', () => {
  let fixture: ComponentFixture<PantallaCargaJuego>;
  let encontradoSubject: Subject<boolean>;

  beforeEach(async () => {
    encontradoSubject = new Subject<boolean>();

    const emparejamientoMock = {
      buscarPartida: jest.fn().mockReturnValue(encontradoSubject.asObservable()),
    };

    const gsapMock = {
      movimientoReducido: jest.fn().mockReturnValue(true),
      crearContexto: jest.fn(),
      gsap: {},
    };

    await TestBed.configureTestingModule({
      imports: [PantallaCargaJuego],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { modo: 'pvp' } } } },
        { provide: EmparejamientoService, useValue: emparejamientoMock },
        { provide: GsapService, useValue: gsapMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PantallaCargaJuego);
    fixture.detectChanges();
  });

  it('muestra "Cargando..." antes de encontrar rival', () => {
    expect(fixture.nativeElement.textContent).toContain('Cargando...');
  });

  it('muestra los nombres sanitizados al encontrarse la partida', () => {
    fixture.componentRef.setInput('nombrePropio', '  Sofi\nGamer  ');
    fixture.componentRef.setInput('nombreRival', '  RivalPro\t ');

    encontradoSubject.next(true);
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Sofi Gamer');
    expect(texto).toContain('vs');
    expect(texto).toContain('RivalPro');
    expect(texto).toContain('¡A luchar!');
  });

  it('usa respaldos seguros si los nombres llegan vacíos', () => {
    fixture.componentRef.setInput('nombrePropio', '   ');
    fixture.componentRef.setInput('nombreRival', '');

    encontradoSubject.next(true);
    fixture.detectChanges();

    const texto = fixture.nativeElement.textContent;
    expect(texto).toContain('Jugador');
    expect(texto).toContain('Rival');
  });
});
