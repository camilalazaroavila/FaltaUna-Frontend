import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { UsuarioDashboard } from './usuario-dashboard';
import { AuthService } from '../../servicios/auth.service';
import { SobresService } from '../../servicios/sobres.service';
import { Usuario } from '../../modelos/usuario.model';
import { AperturaSobreRespuesta } from '../../modelos/sobre.model';

describe('UsuarioDashboard Component', () => {
  let component: UsuarioDashboard;
  let fixture: ComponentFixture<UsuarioDashboard>;
  let mockAuthService: Partial<AuthService>;
  let mockSobresService: Partial<SobresService>;

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
    mockAuthService = {
      usuarioActual: signal<Usuario | null>(usuarioPrueba),
      logout: jest.fn(),
    };

    mockSobresService = {
      obtenerSobres: jest.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [UsuarioDashboard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: SobresService, useValue: mockSobresService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsuarioDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el logo, buscador y avatar en el encabezado', () => {
    const encabezado = fixture.nativeElement.querySelector('header');
    expect(encabezado).toBeTruthy();

    const logo = encabezado.querySelector('img[alt="Falta Una"]');
    expect(logo).toBeTruthy();

    const buscador = encabezado.querySelector('input[type="search"]');
    expect(buscador).toBeTruthy();
    expect(buscador.getAttribute('placeholder')).toBe('Buscá tu campaña preferida...');

    const botonAvatar = encabezado.querySelector('button[aria-label="Menú de perfil"]');
    expect(botonAvatar).toBeTruthy();
  });

  it('debe renderizar el dock lateral con los 5 destinos de navegación', () => {
    const aside = fixture.nativeElement.querySelector('aside[aria-label="Navegación principal"]');
    expect(aside).toBeTruthy();

    const botonesNav = aside.querySelectorAll('app-boton-navegacion-circular');
    expect(botonesNav.length).toBe(5);
  });

  it('debe permitir cambiar la sección activa al interactuar con el dock', () => {
    expect(component['seccionActiva']()).toBe('cartas');

    component.seleccionarSeccion('album');
    fixture.detectChanges();

    expect(component['seccionActiva']()).toBe('album');
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

    const mockApertura: AperturaSobreRespuesta = {
      id: 1,
      sobreId: 1,
      fecha: '2026-10-08T00:00:00Z',
      cartas: [],
    };

    component.alCompletarApertura(mockApertura);
    expect(component['sobresDisponibles']().actuales).toBe(1);
  });

  it('debe desplegar el menú de usuario y permitir cerrar sesión', () => {
    expect(component['menuUsuarioAbierto']()).toBe(false);

    component.toggleMenuUsuario();
    fixture.detectChanges();
    expect(component['menuUsuarioAbierto']()).toBe(true);

    const textoMenu = fixture.nativeElement.textContent;
    expect(textoMenu).toContain('testuser');

    component.cerrarSesion();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });
});
