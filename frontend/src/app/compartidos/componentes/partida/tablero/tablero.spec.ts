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

  it('permite jugar múltiples cartas consecutivas sin bloquearse', () => {
    const totalInicial = servicio.manoPropia().length;
    const primeraCarta = servicio.manoPropia()[0];

    // Jugar primera carta
    const botonesCartas = fixture.nativeElement.querySelectorAll('app-mano button');
    botonesCartas[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    const slots = fixture.nativeElement.querySelectorAll(
      '[data-slot-lado="propio"][data-slot-estado="resaltado"] button',
    );
    expect(slots.length).toBeGreaterThan(0);
    (slots[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(servicio.manoPropia()).toHaveLength(totalInicial - 1);
    expect(servicio.manoPropia().some((c) => c.id === primeraCarta.id)).toBe(false);

    // Jugar segunda carta consecutiva
    const segundaCarta = servicio.manoPropia()[0];
    const botonesCartas2 = fixture.nativeElement.querySelectorAll('app-mano button');
    botonesCartas2[0].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    const slots2 = fixture.nativeElement.querySelectorAll(
      '[data-slot-lado="propio"][data-slot-estado="resaltado"] button',
    );
    expect(slots2.length).toBeGreaterThan(0);
    (slots2[0] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(servicio.manoPropia()).toHaveLength(totalInicial - 2);
    expect(servicio.manoPropia().some((c) => c.id === segundaCarta.id)).toBe(false);
  });

  it('permite retirar una carta provisional y la devuelve a la mano', () => {
    const totalInicial = servicio.manoPropia().length;
    const primeraCarta = servicio.manoPropia()[0];

    // Jugar primera carta
    const botonCarta = fixture.nativeElement.querySelector('app-mano button') as HTMLElement;
    botonCarta.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    fixture.detectChanges();

    const slot = fixture.nativeElement.querySelector(
      '[data-slot-lado="propio"][data-slot-estado="resaltado"] button',
    ) as HTMLButtonElement;
    slot.click();
    fixture.detectChanges();

    expect(servicio.manoPropia()).toHaveLength(totalInicial - 1);

    // Retirar la carta provisional
    component['alRetirarCarta'](primeraCarta);
    fixture.detectChanges();

    expect(servicio.manoPropia()).toHaveLength(totalInicial);
    expect(servicio.manoPropia().some((c) => c.id === primeraCarta.id)).toBe(true);
  });

  it('slotEnPosicion detecta correctamente un slot libre con data-slot-estado="vacio"', () => {
    const contenedor = document.createElement('div');
    contenedor.setAttribute('data-lugar', 'izquierda');
    contenedor.setAttribute('data-indice', '1');

    const slotDiv = document.createElement('div');
    slotDiv.setAttribute('data-slot-lado', 'propio');
    slotDiv.setAttribute('data-slot-estado', 'vacio');
    contenedor.appendChild(slotDiv);
    document.body.appendChild(contenedor);

    const originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = jest.fn().mockReturnValue(slotDiv);

    try {
      const res = component['slotEnPosicion']({ x: 50, y: 50 });
      expect(res).not.toBeNull();
      expect(res?.lugar).toBe('izquierda');
      expect(res?.indice).toBe(1);
    } finally {
      document.elementFromPoint = originalElementFromPoint;
      document.body.removeChild(contenedor);
    }
  });
});
