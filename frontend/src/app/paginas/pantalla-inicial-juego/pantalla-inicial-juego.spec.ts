import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PantallaInicialJuego } from './pantalla-inicial-juego';

describe('PantallaInicialJuego', () => {
  let component: PantallaInicialJuego;
  let fixture: ComponentFixture<PantallaInicialJuego>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PantallaInicialJuego]
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
