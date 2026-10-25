import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Carta } from '@modelos/carta.model';
import { ZONAS_MOCK } from '@servicios/servicios-partida/zonas-mock.service';
import { GsapService } from '@servicios/gsap.service';
import { Zona } from './zona';

const crearDobleGsap = (movimientoReducido: boolean) => {
  const linea = {
    fromTo: jest.fn().mockReturnThis(),
    to: jest.fn().mockReturnThis(),
  };

  const crearContexto = jest.fn(() => {
    const contexto = {
      revert: jest.fn(),
      add: (funcion: () => void) => {
        funcion();
        return contexto;
      },
    };
    return contexto;
  });

  return {
    movimientoReducido: signal(movimientoReducido),
    gsap: {
      timeline: jest.fn(() => linea),
      fromTo: jest.fn(),
      to: jest.fn(),
      set: jest.fn(),
      killTweensOf: jest.fn(),
    },
    crearContexto,
    duracionPartida: jest.fn(() => 0.3),
  };
};

const cartaMock = (overrides: Partial<Carta> = {}): Carta => ({
  id: 'cp-1',
  cartaId: 10,
  cartaPartidaId: 1,
  nombre: 'Super Grido',
  imagenUrl: '',
  rareza: 'comun',
  categoria: 'gastronomia',
  atributoIzquierdo: 2,
  atributoDerecho: 8,
  obtenida: true,
  oculta: false,
  ...overrides,
});

describe('Zona', () => {
  let component: Zona;
  let fixture: ComponentFixture<Zona>;
  let dobleGsap: ReturnType<typeof crearDobleGsap>;

  const configurar = async (movimientoReducido = false) => {
    dobleGsap = crearDobleGsap(movimientoReducido);

    await TestBed.configureTestingModule({
      imports: [Zona],
      providers: [{ provide: GsapService, useValue: dobleGsap }],
    }).compileComponents();

    fixture = TestBed.createComponent(Zona);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('zona', ZONAS_MOCK[0]);
    fixture.componentRef.setInput('cartasRival', [null, null, null, null, null, null]);
    fixture.componentRef.setInput('cartasPropias', [null, null, null, null, null, null]);
    fixture.componentRef.setInput('puntajeRival', 0);
    fixture.componentRef.setInput('puntajePropio', 0);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await configurar(false);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el indicador de categorías cuando la zona tiene efectos de categoría', () => {
    fixture.componentRef.setInput('zona', {
      ...ZONAS_MOCK[0],
      efectosCategoria: [{ tipo: 'sube', categoria: 'gastronomia', valor: 2 }],
    });
    fixture.detectChanges();

    const indicador = fixture.nativeElement.querySelector('app-indicador-categorias-habilidad');
    expect(indicador).toBeTruthy();
  });

  it('no muestra el indicador de categorías cuando la zona no tiene efectos', () => {
    fixture.componentRef.setInput('zona', {
      ...ZONAS_MOCK[0],
      efecto: { categoria: 'gastronomia', bonus: 0 },
      bonusPorCategoria: {},
      efectosCategoria: [],
    });
    fixture.detectChanges();

    const indicador = fixture.nativeElement.querySelector('app-indicador-categorias-habilidad');
    expect(indicador).toBeNull();
  });

  it('oculta renderiza reverso', () => {
    const cartaOculta = cartaMock({
      id: 'oculta-1',
      nombre: 'Carta oculta',
      oculta: true,
    });
    fixture.componentRef.setInput('cartasRival', [cartaOculta, null, null, null, null, null]);
    fixture.detectChanges();

    const reverso = fixture.nativeElement.querySelector('[aria-label="Carta oculta del rival"]');
    expect(reverso).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-carta')).toBeFalsy();
  });

  it('revelada renderiza app-carta', () => {
    const cartaRevelada = cartaMock({
      id: 'cp-1',
      nombre: 'Messi Bot',
      oculta: false,
    });
    fixture.componentRef.setInput('cartasRival', [cartaRevelada, null, null, null, null, null]);
    fixture.detectChanges();

    const appCarta = fixture.nativeElement.querySelector('app-carta');
    expect(appCarta).toBeTruthy();
    const boton = fixture.nativeElement.querySelector('button[aria-label="Ver carta Messi Bot"]');
    expect(boton).toBeTruthy();
  });

  describe('cartas provisionales y confirmadas', () => {
    it('muestra el botón de quitar carta provisoria sin tapar los atributos', () => {
      const carta = cartaMock({ id: 'prov-1', nombre: 'Carta Prov' });
      fixture.componentRef.setInput('cartasPropias', [carta, null, null, null, null, null]);
      fixture.componentRef.setInput('esProvisionalFn', (c: Carta) => c.id === 'prov-1');
      fixture.detectChanges();

      const botonQuitar = fixture.nativeElement.querySelector(
        'button[title="Devolver a mi mano"]',
      ) as HTMLButtonElement | null;
      expect(botonQuitar).toBeTruthy();
      // Verifica que está centrado en la parte superior (-top-2 left-1/2) y no en la esquina superior derecha
      expect(botonQuitar?.className).toContain('-top-2');
      expect(botonQuitar?.className).toContain('left-1/2');
    });

    it('al pulsar el botón de quitar carta provisoria, emite retirarCarta', () => {
      const carta = cartaMock({ id: 'prov-1', nombre: 'Carta Prov' });
      fixture.componentRef.setInput('cartasPropias', [carta, null, null, null, null, null]);
      fixture.componentRef.setInput('esProvisionalFn', (c: Carta) => c.id === 'prov-1');
      fixture.detectChanges();

      const spyRetirar = jest.fn();
      component.retirarCarta.subscribe(spyRetirar);

      const botonQuitar = fixture.nativeElement.querySelector(
        'button[title="Devolver a mi mano"]',
      ) as HTMLButtonElement;
      botonQuitar.click();

      expect(spyRetirar).toHaveBeenCalledWith(carta);
    });

    it('al arrastrar una carta provisoria hacia abajo, emite retirarCarta', () => {
      const carta = cartaMock({ id: 'prov-1', nombre: 'Carta Prov' });
      fixture.componentRef.setInput('cartasPropias', [carta, null, null, null, null, null]);
      fixture.componentRef.setInput('esProvisionalFn', (c: Carta) => c.id === 'prov-1');
      fixture.detectChanges();

      const spyRetirar = jest.fn();
      component.retirarCarta.subscribe(spyRetirar);

      // Simular pointerdown, pointermove hacia abajo (+40px), y pointerup
      component['alPulsarCartaProvisional'](carta, {
        button: 0,
        pointerType: 'mouse',
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        currentTarget: { setPointerCapture: jest.fn() },
      } as any);

      component['alMoverCartaProvisional']({
        pointerId: 1,
        clientX: 100,
        clientY: 140,
      } as any);

      component['alSoltarCartaProvisional']({
        pointerId: 1,
        clientX: 100,
        clientY: 140,
        stopPropagation: jest.fn(),
        currentTarget: { releasePointerCapture: jest.fn() },
      } as any);

      expect(spyRetirar).toHaveBeenCalledWith(carta);
    });

    it('no muestra el botón de quitar en cartas ya confirmadas', () => {
      const cartaConfirmada = cartaMock({ id: 'conf-1', nombre: 'Carta Confirmada' });
      fixture.componentRef.setInput('cartasPropias', [cartaConfirmada, null, null, null, null, null]);
      fixture.componentRef.setInput('esProvisionalFn', () => false);
      fixture.detectChanges();

      const botonQuitar = fixture.nativeElement.querySelector(
        'button[title="Devolver a mi mano"]',
      );
      expect(botonQuitar).toBeNull();
    });
  });

  describe('con movimiento reducido', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      jest.useFakeTimers();
      await configurar(true);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('con movimiento reducido no se llama a GSAP', () => {
      const cartaOculta = cartaMock({ id: 'oculta-1', oculta: true });
      fixture.componentRef.setInput('cartasRival', [cartaOculta, null, null, null, null, null]);
      fixture.detectChanges();

      const cartaRevelada = cartaMock({ id: 'cp-1', oculta: false });
      fixture.componentRef.setInput('cartasRival', [cartaRevelada, null, null, null, null, null]);
      fixture.detectChanges();
      jest.runAllTimers();

      expect(dobleGsap.gsap.fromTo).not.toHaveBeenCalled();
    });
  });
});
