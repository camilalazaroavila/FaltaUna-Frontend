import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PantallaInicialJuego } from './pantalla-inicial-juego';

describe('PantallaInicialJuego', () => {
  let component: PantallaInicialJuego;
  let fixture: ComponentFixture<PantallaInicialJuego>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PantallaInicialJuego],
      // La pantalla usa `routerLink` y el header consulta la ruta activa.
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(PantallaInicialJuego);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
