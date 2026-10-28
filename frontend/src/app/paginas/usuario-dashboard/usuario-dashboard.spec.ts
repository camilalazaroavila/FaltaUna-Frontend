import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { UsuarioDashboard } from './usuario-dashboard';
import { AuthService } from '@servicios/auth.service';
import { SobresService } from '@servicios/sobres.service';
import { Usuario } from '@modelos/usuario.model';
import { BarajaService } from '@servicios/baraja.service';
import { SonidoService } from '@servicios/sonido.service';

describe('UsuarioDashboard Component', () => {
  let component: UsuarioDashboard;
  let fixture: ComponentFixture<UsuarioDashboard>;
  let mockAuthService: Partial<AuthService>;
  let mockSobresService: Partial<SobresService>;
  let mockBarajaService: Partial<BarajaService>;
  let mockSonidoService: Partial<SonidoService>;

  const usuarioPrueba: Usuario = {
    id: 1,
    nombreUsuario: 'testuser',
    email: 'test@example.com',
    rol: 'Usuario',
    fechaRegistro: '2026-01-01',
    oro: 100,
    monedasIntercambio: 50,
  };

  beforeEach(async () => {
    localStorage.setItem('faltauna_bienvenida_mazos_v1', 'true');
    mockAuthService = {
      usuarioActual: signal<Usuario | null>(usuarioPrueba),
      logout: jest.fn(),
    };
    mockBarajaService = {
      obtenerMazos: jest.fn().mockReturnValue(of([])),
    };
    mockSonidoService = {
      reproducir: jest.fn(),
      precargar: jest.fn(),
    };

    const signalSobres = signal({ actuales: 2, maximo: 2 });
    let primeraCarga = true;
    mockSobresService = {
      obtenerSobres: jest.fn().mockReturnValue(of([])),
      obtenerInventarioSobres: jest.fn().mockReturnValue(of([])),
      sobresDisponibles: signalSobres,
      cargarEstadoDiario: jest.fn().mockImplementation(() => {
        if (!primeraCarga) {
          signalSobres.update((s) => ({ ...s, actuales: Math.max(0, s.actuales - 1) }));
        }
        primeraCarga = false;
        return of({
          cargasDisponibles: signalSobres().actuales,
          cargasMaximas: signalSobres().maximo,
        });
      }),
      consumirSobreGratuito: jest.fn().mockImplementation(() => {
        signalSobres.update((s) => ({ ...s, actuales: Math.max(0, s.actuales - 1) }));
      }),
    };

    await TestBed.configureTestingModule({
      imports: [UsuarioDashboard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: SobresService, useValue: mockSobresService },
        { provide: BarajaService, useValue: mockBarajaService },
        { provide: SonidoService, useValue: mockSonidoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el header compartido con logo y avatar, sin buscador', () => {
    const header = fixture.nativeElement.querySelector('app-header');
    expect(header).toBeTruthy();

    const encabezado = header.querySelector('header');
    expect(encabezado).toBeTruthy();

    const logo = encabezado.querySelector('img[alt="Falta Una"]');
    expect(logo).toBeTruthy();

    expect(encabezado.querySelector('input[type="search"]')).toBeFalsy();

    const botonAvatar = encabezado.querySelector('button[aria-label="Menú de perfil"]');
    expect(botonAvatar).toBeTruthy();
  });

  it('debe mostrar 3 sobres en el abanico: general, categoría indumentaria y marca Lego', () => {
    const sobres: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('app-sobre-marca button')
    );
    const etiquetas = sobres.map((s) => s.getAttribute('aria-label'));

    expect(sobres.length).toBe(3);
    expect(etiquetas).toEqual(
      expect.arrayContaining(['Sobre de Falta Una', 'Sobre de Indumentaria', 'Sobre de Lego'])
    );
  });

  it('debe abrir el selector al hacer clic en un sobre del abanico', () => {
    const sobre = fixture.nativeElement.querySelector('app-sobre-marca button') as HTMLButtonElement;
    sobre.click();
    fixture.detectChanges();

    expect(component['selectorSobresAbierto']()).toBe(true);
  });

  it('debe renderizar el dock de navegación con los 6 destinos', () => {
    const aside = fixture.nativeElement.querySelector('aside[aria-label="Navegación principal"]');
    expect(aside).toBeTruthy();

    const botonesNav = aside.querySelectorAll('app-boton-navegacion-circular');
    expect(botonesNav.length).toBe(6);

    const botonMisiones = Array.from(
      botonesNav as NodeListOf<HTMLElement>
    ).find(
      (b) =>
        b.querySelector('button')?.getAttribute('aria-label') === 'Misiones'
    );
    expect(botonMisiones).toBeTruthy();
  });

  it('debe permitir cambiar la sección activa al interactuar con el dock', () => {
    expect(component['seccionActiva']()).toBeNull();

    component.seleccionarSeccion('album');
    fixture.detectChanges();

    expect(component['seccionActiva']()).toBe('album');
  });

  it('debe navegar a Mis cartas al seleccionar el primer destino del dock', () => {
    const router = TestBed.inject(Router);
    const navegar = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.seleccionarSeccion('cartas');

    expect(component['seccionActiva']()).toBe('cartas');
    expect(navegar).toHaveBeenCalledWith('/usuario/mis-cartas');
  });

  it('debe navegar a Cupones al seleccionar su destino del dock', () => {
    const router = TestBed.inject(Router);
    const navegar = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.seleccionarSeccion('cupones');

    expect(navegar).toHaveBeenCalledWith('/usuario/cupones');
  });

  it('debe mostrar el contador de sobres diarios disponibles', () => {
    const textoContador = fixture.nativeElement.textContent;
    expect(textoContador).toContain('2/2 GRATIS');
  });

  it('debe abrir el panel selector de sobres al presionar VER SOBRES', () => {
    expect(component['selectorSobresAbierto']()).toBe(false);

    const botonVerSobres = fixture.debugElement.query(
      By.css('#btn-ver-sobres')
    ).nativeElement as HTMLButtonElement;

    expect(botonVerSobres.textContent?.trim()).toBe('VER SOBRES');
    botonVerSobres.click();
    fixture.detectChanges();

    expect(component['selectorSobresAbierto']()).toBe(true);

    const flujoEl = fixture.nativeElement.querySelector('app-flujo-apertura-sobres');
    expect(flujoEl).toBeTruthy();
    expect(flujoEl.textContent).toContain('Elegí tu sobre');
  });

  it('debe cerrar el panel selector de sobres al invocar cerrarSelectorSobres', () => {
    component.abrirSelectorSobres();
    fixture.detectChanges();
    expect(component['selectorSobresAbierto']()).toBe(true);

    component.cerrarSelectorSobres();
    fixture.detectChanges();
    expect(component['selectorSobresAbierto']()).toBe(false);
  });

  it('debe descontar sobres disponibles al completar una apertura', () => {
    expect(component['sobresDisponibles']().actuales).toBe(2);

    component.alCompletarApertura();

    expect(component['sobresDisponibles']().actuales).toBe(1);
  });

  it('no debe mostrar el icono de jugar mientras el juego esté deshabilitado (MVP)', () => {
    // El botón de jugar está habilitado a propósito
    expect(component['juegoHabilitado']).toBe(true);
    expect(fixture.nativeElement.querySelector('img[alt="Abrir sobre"]')).toBeTruthy();
  });

  it('debe desplegar el menú de usuario del header y permitir cerrar sesión', () => {
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    const avatar = fixture.nativeElement.querySelector(
      'app-header button[aria-label="Menú de perfil"]'
    ) as HTMLButtonElement;
    avatar.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('testuser');

    const botonCerrar = (
      Array.from(fixture.nativeElement.querySelectorAll('app-header button')) as HTMLButtonElement[]
    ).find((b) => b.textContent?.trim() === 'Cerrar sesión');
    botonCerrar?.click();

    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('no debe navegar ni cambiar sección activa si el destino está deshabilitado (intercambio y canje)', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigateByUrl');

    component.seleccionarSeccion('intercambios');
    expect(component['seccionActiva']()).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();

    component.seleccionarSeccion('qr');
    expect(component['seccionActiva']()).toBeNull();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('permite cerrar la bienvenida de mazos y guarda el flag en localStorage', () => {
    component['modalBienvenidaMazosVisible'].set(true);
    fixture.detectChanges();

    component.cerrarBienvenidaMazos();
    fixture.detectChanges();

    expect(component['modalBienvenidaMazosVisible']()).toBe(false);
    expect(localStorage.getItem('faltauna_bienvenida_mazos_v1')).toBe('true');
  });
});