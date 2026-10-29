import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { NavegacionInferiorMobile } from './navegacion-inferior-mobile';
import { GsapService } from '@servicios/gsap.service';

@Component({ standalone: true, template: '' })
class RutaDummy {}

describe('NavegacionInferiorMobile', () => {
  let fixture: ComponentFixture<NavegacionInferiorMobile>;
  let component: NavegacionInferiorMobile;
  let router: Router;
  let movimientoReducidoSignal = signal(false);
  let crearContextoSpy: jest.Mock;

  beforeEach(async () => {
    movimientoReducidoSignal = signal(false);
    crearContextoSpy = jest.fn((elemento: Element, configurar: (el: Element) => void) => {
      configurar(elemento);
      return { revert: jest.fn() };
    });

    const gsapServiceMock = {
      movimientoReducido: movimientoReducidoSignal.asReadonly(),
      crearContexto: crearContextoSpy,
      duracionPartida: jest.fn().mockReturnValue(0.24),
      gsap: {
        from: jest.fn(),
        set: jest.fn(),
      },
    };

    await TestBed.configureTestingModule({
      imports: [NavegacionInferiorMobile],
      providers: [
        provideRouter([
          { path: '', component: RutaDummy },
          { path: 'empresa/landing', component: RutaDummy },
          { path: 'login', component: RutaDummy },
          { path: 'registro', component: RutaDummy },
          { path: 'usuario', component: RutaDummy },
          { path: 'usuario/jugar', component: RutaDummy },
          { path: 'usuario/mis-cartas', component: RutaDummy },
          { path: 'usuario/mi-baraja', component: RutaDummy },
          { path: 'usuario/albumes', component: RutaDummy },
          { path: 'usuario/misiones', component: RutaDummy },
          { path: 'usuario/cupones', component: RutaDummy },
          { path: 'juego/ia', component: RutaDummy },
          { path: 'juego/jugador', component: RutaDummy },
          { path: 'juego/tutorial', component: RutaDummy },
        ]),
        { provide: GsapService, useValue: gsapServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-movimiento');
  });

  it('no debe renderizarse en la landing pública, login, registro ni durante la partida', async () => {
    fixture = TestBed.createComponent(NavegacionInferiorMobile);
    component = fixture.componentInstance;

    const rutasOcultas = [
      '/',
      '/empresa/landing',
      '/login',
      '/registro',
      '/juego/ia',
      '/juego/jugador',
      '/juego/tutorial',
    ];

    for (const ruta of rutasOcultas) {
      await router.navigateByUrl(ruta);
      fixture.detectChanges();

      const nav = (fixture.nativeElement as HTMLElement).querySelector('nav');
      expect(nav).toBeNull();
    }
  });

  it('debe renderizarse en las rutas del jugador y marcar el ítem activo con aria-current="page"', async () => {
    await router.navigateByUrl('/usuario/misiones');
    fixture = TestBed.createComponent(NavegacionInferiorMobile);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const nav = host.querySelector('nav[aria-label="Navegación inferior del jugador"]');
    expect(nav).not.toBeNull();

    const enlaces = Array.from(host.querySelectorAll<HTMLAnchorElement>('.nav-inferior__enlace'));
    expect(enlaces.length).toBe(4);

    // Todos los enlaces de solo ícono tienen aria-label accesible
    for (const enlace of enlaces) {
      expect(enlace.getAttribute('aria-label')).toBeTruthy();
    }

    const misionesEnlace = host.querySelector<HTMLAnchorElement>(
      '.nav-inferior__enlace[aria-label="Misiones"]',
    );
    expect(misionesEnlace?.getAttribute('aria-current')).toBe('page');
    expect(misionesEnlace?.classList.contains('nav-inferior__enlace--activo')).toBe(true);

    // Al navegar a /usuario/mi-baraja se activa el ítem "Mis cartas"
    await router.navigateByUrl('/usuario/mi-baraja');
    fixture.detectChanges();

    const cartasEnlace = host.querySelector<HTMLAnchorElement>(
      '.nav-inferior__enlace[aria-label="Mis cartas"]',
    );
    expect(cartasEnlace?.getAttribute('aria-current')).toBe('page');
    expect(misionesEnlace?.getAttribute('aria-current')).toBeNull();

    // Al navegar a /usuario/jugar se activa el botón flotante principal ("Jugar")
    await router.navigateByUrl('/usuario/jugar');
    fixture.detectChanges();

    const fab = host.querySelector<HTMLAnchorElement>('.nav-inferior__fab');
    expect(fab?.getAttribute('aria-current')).toBe('page');
    expect(fab?.classList.contains('nav-inferior__fab--activo')).toBe(true);
  });

  it('debe pasar a estado ligeramente oculto al hacer scroll hacia abajo y volver al subir o tocar la franja', async () => {
    await router.navigateByUrl('/usuario/albumes');
    fixture = TestBed.createComponent(NavegacionInferiorMobile);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const barra = host.querySelector('.nav-inferior__barra') as HTMLElement;

    expect(barra.classList.contains('nav-inferior__barra--oculta')).toBe(false);

    // Scroll hacia abajo supera el umbral -> se oculta parcialmente
    component.procesarScroll(120);
    fixture.detectChanges();

    expect(barra.classList.contains('nav-inferior__barra--oculta')).toBe(true);

    // La franja de reactivación aparece cuando está ligeramente oculta y al tocarla despliega la barra
    const franja = host.querySelector<HTMLButtonElement>('.nav-inferior__franja-reactivacion');
    expect(franja).not.toBeNull();
    franja?.click();
    fixture.detectChanges();

    expect(barra.classList.contains('nav-inferior__barra--oculta')).toBe(false);

    // Si vuelve a bajar y luego sube con scroll hacia arriba, también vuelve a mostrarse completa
    component.procesarScroll(180);
    fixture.detectChanges();
    expect(barra.classList.contains('nav-inferior__barra--oculta')).toBe(true);

    component.procesarScroll(140);
    fixture.detectChanges();
    expect(barra.classList.contains('nav-inferior__barra--oculta')).toBe(false);
  });

  it('debe aparecer y cambiar de estado sin animar cuando movimiento reducido está activo', async () => {
    movimientoReducidoSignal.set(true);
    await router.navigateByUrl('/usuario');

    fixture = TestBed.createComponent(NavegacionInferiorMobile);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Con movimiento reducido no crea animación de entrada con GsapService.crearContexto
    expect(crearContextoSpy).not.toHaveBeenCalled();
    expect(component.esMovimientoReducido()).toBe(true);

    // Cambia de estado inmediatamente al hacer scroll sin requerir animación
    component.procesarScroll(100);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.nav-inferior__barra')
        ?.classList.contains('nav-inferior__barra--oculta'),
    ).toBe(true);
  });
});

