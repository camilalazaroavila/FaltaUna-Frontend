import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EsqueletoMisiones } from './esqueleto-misiones';
import { EsqueletoPity } from './esqueleto-pity';
import { EsqueletoCupones } from './esqueleto-cupones';
import { EsqueletoCartas } from './esqueleto-cartas';
import { EsqueletoBaraja } from './esqueleto-baraja';

describe('Esqueletos de Vistas', () => {
  describe('EsqueletoMisiones', () => {
    let fixture: ComponentFixture<EsqueletoMisiones>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [EsqueletoMisiones] });
      fixture = TestBed.createComponent(EsqueletoMisiones);
      fixture.detectChanges();
    });

    it('renderiza la barra de bono diario por defecto y 4 tarjetas', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Cargando misiones…');
      const cards = el.querySelectorAll('li');
      expect(cards.length).toBe(4);
    });

    it('permite ocultar la barra de bono diario', () => {
      fixture.componentRef.setInput('mostrarBono', false);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.mb-6')).toBeNull();
    });
  });

  describe('EsqueletoPity', () => {
    let fixture: ComponentFixture<EsqueletoPity>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [EsqueletoPity] });
      fixture = TestBed.createComponent(EsqueletoPity);
      fixture.detectChanges();
    });

    it('renderiza 4 tarjetas de pity con barra y sobre', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Cargando PT System…');
      const cards = el.querySelectorAll('li');
      expect(cards.length).toBe(4);
    });
  });

  describe('EsqueletoCupones', () => {
    let fixture: ComponentFixture<EsqueletoCupones>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [EsqueletoCupones] });
      fixture = TestBed.createComponent(EsqueletoCupones);
      fixture.detectChanges();
    });

    it('renderiza 8 cupones esqueleto en la grilla', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Cargando tus cupones…');
      const cupones = el.querySelectorAll('li');
      expect(cupones.length).toBe(8);
    });
  });

  describe('EsqueletoCartas', () => {
    let fixture: ComponentFixture<EsqueletoCartas>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [EsqueletoCartas] });
      fixture = TestBed.createComponent(EsqueletoCartas);
      fixture.detectChanges();
    });

    it('renderiza 12 siluetas de cartas coleccionables por defecto', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Cargando cartas…');
      const grilla = el.querySelector('.coleccion__grilla');
      expect(grilla).not.toBeNull();
      const cartas = grilla?.querySelectorAll('.aspect-\\[5\\/7\\]');
      expect(cartas?.length).toBe(12);
    });

    it('permite configurar la cantidad de cartas', () => {
      fixture.componentRef.setInput('cantidad', 6);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const cartas = el.querySelectorAll('.aspect-\\[5\\/7\\]');
      expect(cartas.length).toBe(6);
    });
  });

  describe('EsqueletoBaraja', () => {
    let fixture: ComponentFixture<EsqueletoBaraja>;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [EsqueletoBaraja] });
      fixture = TestBed.createComponent(EsqueletoBaraja);
      fixture.detectChanges();
    });

    it('renderiza el panel 3x4 (12 slots) y el catálogo de cartas', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain('Cargando gestión de barajas…');
      const slots = el.querySelectorAll('.baraja__slot-esqueleto');
      expect(slots.length).toBe(12);
      const catalogoCartas = el.querySelectorAll('.baraja__grilla .aspect-\\[5\\/7\\]');
      expect(catalogoCartas.length).toBe(8);
    });
  });
});
