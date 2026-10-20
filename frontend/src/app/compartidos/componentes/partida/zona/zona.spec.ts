import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZONAS_MOCK } from '@servicios/servicios-partida/zonas-mock.service';
import { Zona } from './zona';

describe('Zona', () => {
  let component: Zona;
  let fixture: ComponentFixture<Zona>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Zona],
    }).compileComponents();

    fixture = TestBed.createComponent(Zona);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('zona', ZONAS_MOCK[0]);
    fixture.componentRef.setInput('cartasRival', [null, null, null, null, null, null]);
    fixture.componentRef.setInput('cartasPropias', [null, null, null, null, null, null]);
    fixture.componentRef.setInput('puntajeRival', 0);
    fixture.componentRef.setInput('puntajePropio', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
