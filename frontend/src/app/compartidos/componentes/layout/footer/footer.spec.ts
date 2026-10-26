import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Footer } from './footer';

/**
 * El footer es compartido por ambas landings: el `modo` solo decide el logo, la
 * superficie y arrastra ese mismo modo al login/registro. No expone URLs de
 * redes ni enlaces legales todavía (Open Decision).
 */
describe('Footer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  const crear = (modo: 'jugador' | 'empresa' = 'jugador'): ComponentFixture<Footer> => {
    const fixture = TestBed.createComponent(Footer);
    fixture.componentRef.setInput('modo', modo);
    fixture.detectChanges();
    return fixture;
  };

  const enlaces = (fixture: ComponentFixture<Footer>) =>
    Array.from(fixture.nativeElement.querySelectorAll('nav a')) as HTMLAnchorElement[];

  const texto = (fixture: ComponentFixture<Footer>) =>
    fixture.nativeElement.querySelector('footer')?.textContent ?? '';

  it('crea el pie de página', () => {
    const fixture = crear();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('footer')).toBeTruthy();
  });

  it('en modo jugador ofrece el acceso al modo empresa sin arrastrar query params', () => {
    const fixture = crear('jugador');

    const textos = enlaces(fixture).map((a) => a.textContent?.trim());
    expect(textos).toContain('Modo empresa');
    expect(textos).not.toContain('Modo usuario');

    const login = enlaces(fixture).find((a) => a.textContent?.trim() === 'Iniciar sesión');
    expect(login?.getAttribute('href')).toBe('/login');
  });

  it('en modo empresa propaga ese modo al login/registro y ofrece el modo usuario', () => {
    const fixture = crear('empresa');

    const textos = enlaces(fixture).map((a) => a.textContent?.trim());
    expect(textos).toContain('Modo usuario');
    expect(textos).not.toContain('Modo empresa');

    const login = enlaces(fixture).find((a) => a.textContent?.trim() === 'Iniciar sesión');
    const registro = enlaces(fixture).find((a) => a.textContent?.trim() === 'Registrarse');
    expect(login?.getAttribute('href')).toBe('/login?modo=empresa');
    expect(registro?.getAttribute('href')).toBe('/registro?modo=empresa');
  });

  it('muestra el año vigente y el descargo en la franja inferior', () => {
    const fixture = crear();
    const contenido = texto(fixture);
    expect(contenido).toContain(String(new Date().getFullYear()));
    expect(contenido).toContain('Falta Una');
    expect(contenido).toContain('proyecto académico');
  });

  it('elige un logo distinto según el modo', () => {
    const logoJugador = crear('jugador')
      .nativeElement.querySelector('footer img')
      ?.getAttribute('src');
    const logoEmpresa = crear('empresa')
      .nativeElement.querySelector('footer img')
      ?.getAttribute('src');

    expect(logoJugador).toBeTruthy();
    expect(logoEmpresa).toBeTruthy();
    expect(logoEmpresa).not.toBe(logoJugador);
  });
});
