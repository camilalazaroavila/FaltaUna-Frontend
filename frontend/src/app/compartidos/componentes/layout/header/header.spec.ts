import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Header } from './header';
import { AuthService } from '@servicios/auth.service';
import logoClaro from '@svgs/Imagotipo_claro.svg';
import logoOscuro from '@svgs/Imagotipo_Alt.svg';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('usa el logo compacto por defecto y el agrandado en la variante de auth', () => {
    const logo = fixture.nativeElement.querySelector('header img');
    expect(logo.classList.contains('h-8')).toBe(true);
    expect(logo.classList.contains('h-12')).toBe(false);

    fixture.componentRef.setInput('enAuth', true);
    fixture.detectChanges();

    expect(logo.classList.contains('h-8')).toBe(false);
    expect(logo.classList.contains('h-12')).toBe(true);
  });

  it('el logo lleva a la landing cuando no hay sesión', () => {
    const logo = fixture.nativeElement.querySelector(
      'header a[aria-label="Falta Una, ir al inicio"]',
    ) as HTMLAnchorElement;
    expect(logo.getAttribute('href')).toBe('/');
  });

  it('en auth con modo jugador mantiene el fondo sólido y el logo con sus colores', () => {
    fixture.componentRef.setInput('enAuth', true);
    fixture.detectChanges();

    const encabezado = fixture.nativeElement.querySelector('header') as HTMLElement;
    expect(encabezado.classList.contains('bg-header-auth-fondo')).toBe(true);

    const logo = encabezado.querySelector('img') as HTMLImageElement;
    expect(logo.classList.contains('brightness-0')).toBe(false);
    expect(logo.classList.contains('invert')).toBe(false);
  });

  it('en auth con ?modo=empresa usa el fondo marrón de header y el logo en blanco', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ modo: 'empresa' }) },
            queryParamMap: of(convertToParamMap({ modo: 'empresa' })),
          },
        },
      ],
    }).compileComponents();

    const sut = TestBed.createComponent(Header);
    sut.componentRef.setInput('enAuth', true);
    sut.detectChanges();

    const encabezado = sut.nativeElement.querySelector('header') as HTMLElement;
    expect(encabezado.classList.contains('bg-header-auth-fondo')).toBe(true);
    expect(encabezado.classList.contains('bg-transparent')).toBe(false);

    const logo = encabezado.querySelector('img') as HTMLImageElement;
    expect(logo.classList.contains('brightness-0')).toBe(true);
    expect(logo.classList.contains('invert')).toBe(true);

    const componente = sut.componentInstance as unknown as { urlLogo: string };
    expect(componente.urlLogo).toBe(logoClaro);
    expect(componente.urlLogo).not.toBe(logoOscuro);
  });
});

describe('Header (variante logueado)', () => {
  let fixture: ComponentFixture<Header>;
  let logout: jest.Mock;

  beforeEach(async () => {
    logout = jest.fn();

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            usuarioActual: signal({ nombreUsuario: 'testuser' }),
            logout,
          } as unknown as AuthService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    fixture.componentRef.setInput('logueado', true);
    fixture.detectChanges();
  });

  it('el logo lleva a la home del usuario (/usuario) con sesión iniciada', () => {
    const logo = fixture.nativeElement.querySelector(
      'a[aria-label="Ir al inicio de Falta Una"]',
    ) as HTMLAnchorElement;
    expect(logo.getAttribute('href')).toBe('/usuario');
  });

  it('respeta un enlaceLogo explícito por sobre el destino por defecto', () => {
    fixture.componentRef.setInput('enlaceLogo', '/misiones');
    fixture.detectChanges();

    const logo = fixture.nativeElement.querySelector(
      'a[aria-label="Ir al inicio de Falta Una"]',
    ) as HTMLAnchorElement;
    expect(logo.getAttribute('href')).toBe('/misiones');
  });

  it('muestra logo y avatar, sin buscador ni enlaces de login/registro', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('img[alt="Falta Una"]')).toBeTruthy();
    expect(el.querySelector('button[aria-label="Menú de perfil"]')).toBeTruthy();
    expect(el.querySelector('input[type="search"]')).toBeFalsy();
    expect(el.querySelector('a[href="/login"]')).toBeFalsy();
    expect(el.querySelector('a[href="/registro"]')).toBeFalsy();
  });

  it('despliega el menú con el nombre del usuario al tocar el avatar', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('testuser');

    (el.querySelector('button[aria-label="Menú de perfil"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.textContent).toContain('testuser');
    expect(
      el.querySelector('button[aria-label="Menú de perfil"]')?.getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('cierra la sesión y navega a /login', () => {
    const router = TestBed.inject(Router);
    const navegar = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const el = fixture.nativeElement as HTMLElement;

    (el.querySelector('button[aria-label="Menú de perfil"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const botonCerrar = (Array.from(el.querySelectorAll('button')) as HTMLButtonElement[]).find(
      (b) => b.textContent?.trim() === 'Cerrar sesión',
    );
    botonCerrar?.click();

    expect(logout).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });
});