import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PantallaCargaJuego } from './pantalla-carga-juego';

describe('PantallaCargaJuego', () => {
  let component: PantallaCargaJuego;
  let fixture: ComponentFixture<PantallaCargaJuego>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PantallaCargaJuego]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PantallaCargaJuego);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
