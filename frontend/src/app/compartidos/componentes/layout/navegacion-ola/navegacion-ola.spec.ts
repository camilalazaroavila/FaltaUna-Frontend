import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { NavegacionOla } from './navegacion-ola';
import { GsapService } from '@servicios/gsap.service';
import { IntercambioService } from '@servicios/intercambio.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('NavegacionOla (Unificado: Mobile con 5 columnas y Desktop vertical izquierdo)', () => {
  let fixture: ComponentFixture<NavegacionOla>;
  let component: NavegacionOla;
  let router: Router;

  const mockMovimientoReducido = signal(false);
  const mockGsapService = {
    movimientoReducido: mockMovimientoReducido.asReadonly(),
    crearContexto: jest.fn((el, cb) => {
      cb(el);
      return { revert: jest.fn() };
    }),
    duracionPartida: jest.fn().mockReturnValue(0.24),
    gsap: {
      to: jest.fn((target, opts) => {
        if (opts?.onUpdate) opts.onUpdate();
        return {};
      }),
      from: jest.fn(),
      fromTo: jest.fn(),
      set: jest.fn(),
    },
  };

  const mockIntercambioService = {
    tieneNovedadDashboardSignal: signal(false).asReadonly(),
  };

  beforeEach(async () => {
    mockMovimientoReducido.set(false);
    jest.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [NavegacionOla],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'login', component: DummyComponent },
          { path: 'registro', component: DummyComponent },
          { path: 'usuario', component: DummyComponent },
          { path: 'usuario/mis-cartas', component: DummyComponent },
          { path: 'usuario/misiones', component: DummyComponent },
          { path: 'usuario/albumes', component: DummyComponent },
          { path: 'usuario/intercambio', component: DummyComponent },
          { path: 'usuario/jugar', component: DummyComponent },
          { path: 'juego/ia', component: DummyComponent },
          { path: 'juego/tutorial', component: DummyComponent },
        ]),
        { provide: GsapService, useValue: mockGsapService },
        { provide: IntercambioService, useValue: mockIntercambioService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(NavegacionOla);
    component = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('no debe renderizarse en rutas restringidas (login, registro, landing, partida, tutorial, jugar e intercambio)', async () => {
    await router.navigateByUrl('/login');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();

    await router.navigateByUrl('/registro');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();

    await router.navigateByUrl('/juego/ia');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();

    await router.navigateByUrl('/juego/tutorial');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();

    await router.navigateByUrl('/usuario/jugar');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();

    await router.navigateByUrl('/usuario/intercambio');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });

  describe('Mobile (< 768px)', () => {
    it('divide en 5 columnas con botón central JUGAR y 3 destinos visibles', async () => {
      await router.navigateByUrl('/usuario');
      fixture.detectChanges();

      const navMobile = fixture.nativeElement.querySelector('.nav-ola__barra-mobile');
      expect(navMobile).toBeTruthy();

      expect(component['destinosMobile']().length).toBe(3);
      expect(component['destinosMobile']()[0].id).toBe('cartas');
      expect(component['destinosMobile']()[1].id).toBe('misiones');
      expect(component['destinosMobile']()[2].id).toBe('albumes');

      const btnJugar = fixture.nativeElement.querySelector('.nav-ola__boton-jugar-mobile');
      expect(btnJugar).toBeTruthy();
    });

    it('no renderiza la barra mobile en ruta Jugar ni en Intercambio', async () => {
      await router.navigateByUrl('/usuario/jugar');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.nav-ola__barra-mobile')).toBeNull();

      await router.navigateByUrl('/usuario/intercambio');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.nav-ola__barra-mobile')).toBeNull();
    });

    it('posiciona el hueco y círculo en Col 0 en Mis cartas y en Col 3 en Álbumes', async () => {
      await router.navigateByUrl('/usuario/mis-cartas');
      fixture.detectChanges();

      expect(component.columnaActivaMobile()).toBe(0);
      expect(component.destinoActivoMobile()?.id).toBe('cartas');
      expect(component['olaMobileVisible']()).toBe(true);

      await router.navigateByUrl('/usuario/albumes');
      fixture.detectChanges();

      expect(component.columnaActivaMobile()).toBe(3);
      expect(component.destinoActivoMobile()?.id).toBe('albumes');
      expect(component['olaMobileVisible']()).toBe(true);
    });

    it('abre el panel Más accesible, atrapa foco y cierra con Escape devolviendo foco', async () => {
      await router.navigateByUrl('/usuario');
      fixture.detectChanges();

      expect(component['panelMasAbierto']()).toBe(false);

      const btnMas = fixture.nativeElement.querySelector('button[aria-label="Más secciones de navegación"]');
      expect(btnMas).toBeTruthy();
      btnMas.click();
      fixture.detectChanges();

      expect(component['panelMasAbierto']()).toBe(true);
      const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
      expect(dialog.getAttribute('aria-labelledby')).toBe('titulo-panel-mas');

      // Prueba de Escape
      const eventEscape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      component['manejarTecladoDialogo'](eventEscape);
      fixture.detectChanges();

      expect(component['panelMasAbierto']()).toBe(false);
    });

    it('identifica correctamente las rutas con auto-ocultación por scroll (Mis cartas y Álbumes)', async () => {
      await router.navigateByUrl('/usuario/mis-cartas');
      expect(component['esRutaLecturaLarga']()).toBe(true);

      await router.navigateByUrl('/usuario/albumes');
      expect(component['esRutaLecturaLarga']()).toBe(true);

      await router.navigateByUrl('/usuario/misiones');
      expect(component['esRutaLecturaLarga']()).toBe(false);

      await router.navigateByUrl('/usuario');
      expect(component['esRutaLecturaLarga']()).toBe(false);
    });
  });

  describe('Desktop (>= 768px)', () => {
    it('renderiza la barra lateral vertical izquierda con los 6 destinos del rail', async () => {
      await router.navigateByUrl('/usuario');
      fixture.detectChanges();

      const asideDesktop = fixture.nativeElement.querySelector('.nav-ola--desktop');
      expect(asideDesktop).toBeTruthy();

      const items = fixture.nativeElement.querySelectorAll('.nav-ola__item-desktop');
      expect(items.length).toBe(6);

      const tooltips = fixture.nativeElement.querySelectorAll('.nav-ola__tooltip');
      expect(tooltips.length).toBe(6);
    });

    it('sigue el hover del mouse en desktop y vuelve al salir', async () => {
      await router.navigateByUrl('/usuario/mis-cartas');
      fixture.detectChanges();

      expect(component.indiceRutaDesktop()).toBe(0);
      expect(component.indiceEfectivoDesktop()).toBe(0);

      // Simula hover sobre el ítem 2 (Álbumes)
      component['alPasarMouseDesktop'](2);
      fixture.detectChanges();

      expect(component.indiceEfectivoDesktop()).toBe(2);
      expect(component['destinoOlaDesktop']()?.id).toBe('albumes');

      // Sale el mouse
      component['alSalirMouseDesktop']();
      fixture.detectChanges();

      expect(component.indiceEfectivoDesktop()).toBe(0);
      expect(component['destinoOlaDesktop']()?.id).toBe('cartas');
    });

    it('con movimiento reducido no utiliza animación temporal', async () => {
      mockMovimientoReducido.set(true);
      await router.navigateByUrl('/usuario/misiones');
      fixture.detectChanges();

      expect(component['posicionOlaMobileX']()).toBeGreaterThan(0);
      expect(component.destinoActivoMobile()?.id).toBe('misiones');
    });

    it('permite clickear ítems en desktop navegando a la vista correspondiente', async () => {
      await router.navigateByUrl('/usuario/mis-cartas');
      fixture.detectChanges();

      const emitSpy = jest.spyOn(component.seleccionarDestino, 'emit');

      const enlacesDesktop = fixture.nativeElement.querySelectorAll('.nav-ola__enlace-desktop');
      // Click en el segundo enlace (Misiones)
      enlacesDesktop[1].click();
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'misiones' }));
    });

    it('permite clickear el círculo flotante activo en desktop para navegar', async () => {
      await router.navigateByUrl('/usuario/mis-cartas');
      fixture.detectChanges();

      const spyNavigate = jest.spyOn(router, 'navigateByUrl');
      const emitSpy = jest.spyOn(component.seleccionarDestino, 'emit');

      const circuloBtn = fixture.nativeElement.querySelector('button.nav-ola__circulo-desktop');
      expect(circuloBtn).toBeTruthy();

      circuloBtn.click();
      fixture.detectChanges();

      expect(emitSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'cartas' }));
      expect(spyNavigate).toHaveBeenCalledWith('/usuario/mis-cartas');
    });

    it('aplica clase de ícono trofeo y mantiene el círculo y los ítemes centrados en el eje común', async () => {
      await router.navigateByUrl('/usuario/mis-cartas');
      fixture.detectChanges();

      const trofeoEl = fixture.nativeElement.querySelector('.nav-ola__icono-trofeo');
      expect(trofeoEl).toBeTruthy();

      // Centro común X = 40 (en ancho 80px)
      expect(component['transformCirculoDesktop']()).toContain('17px'); // 40 - 23 = 17
    });

    it('incluye sangrado izquierdo en el SVG desktop para que la sombra inferior cubra hasta x=0', async () => {
      await router.navigateByUrl('/usuario/mis-cartas');
      fixture.detectChanges();

      const svgDesktop = fixture.nativeElement.querySelector('.nav-ola__svg-desktop');
      expect(svgDesktop).toBeTruthy();
      expect(svgDesktop.getAttribute('viewBox')).toMatch(/^-14 0 94 /);

      const pathDesktop = svgDesktop.querySelector('path');
      expect(pathDesktop).toBeTruthy();
      expect(pathDesktop.getAttribute('d')).toContain('M -14,0');
    });
  });
});
