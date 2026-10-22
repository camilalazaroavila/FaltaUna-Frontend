import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PartidaEstadoService } from '@servicios/servicios-partida/partida-estado.service';

import { Tablero } from './tablero';

describe('Tablero', () => {
  let component: Tablero;
  let fixture: ComponentFixture<Tablero>;
  let servicio: PartidaEstadoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tablero],
      // El tablero consume `PartidaServicio`, que habla con la API aunque esté
      // en modo mock: hace falta el cliente HTTP para poder resolverlo.
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Tablero);
    component = fixture.componentInstance;
    servicio = TestBed.inject(PartidaEstadoService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no resalta slots si no hay carta en juego', () => {
    expect(fixture.nativeElement.querySelector('[data-slot-estado="resaltado"]')).toBeNull();
  });

  it('juega una carta al seleccionarla con teclado y usar el botón de la casilla', () => {
    const totalMano = servicio.manoPropia().length;
    const carta = servicio.manoPropia()[0];

    const cartaBoton = fixture.nativeElement.querySelector('app-mano button') as HTMLElement;
    cartaBoton.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    const slotResaltado = fixture.nativeElement.querySelector(
      '[data-slot-lado="propio"][data-slot-estado="resaltado"]',
    ) as HTMLElement | null;

    expect(slotResaltado).toBeTruthy();

    (slotResaltado?.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(servicio.manoPropia()).toHaveLength(totalMano - 1);
    expect(servicio.manoPropia().some((enMano) => enMano.id === carta.id)).toBe(false);
  });

  it('resalta los slots cuando la galería fuerza una carta agarrada', () => {
    fixture.componentRef.setInput('cartaAgarrada', true);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-slot-lado="propio"][data-slot-estado="resaltado"]'),
    ).toBeTruthy();
  });
});
