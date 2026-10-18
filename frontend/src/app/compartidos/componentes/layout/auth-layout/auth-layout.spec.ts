import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthLayout } from './auth-layout';

/**
 * El layout no tiene lógica de negocio: absorbe `?modo=`, lo aplica sobre
 * `data-modo` y restaura el atributo anterior al destruirse para que el tema
 * de auth no contamine el resto de la aplicación.
 */
describe('AuthLayout', () => {
  const preparar = (query: Record<string, string>) => {
    TestBed.configureTestingModule({
      imports: [AuthLayout],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(query) },
            queryParamMap: of(convertToParamMap(query)),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(AuthLayout);
    fixture.componentRef.setInput('variante', 'login');
    return fixture;
  };

  afterEach(() => {
    document.documentElement.removeAttribute('data-modo');
  });

  it('crea el layout', () => {
    const fixture = preparar({});
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renderiza el header dentro del layout, sobre el fondo de la pantalla y sin buscador', () => {
    const fixture = preparar({});
    fixture.detectChanges();

    const header: HTMLElement | null = fixture.nativeElement.querySelector('header');
    expect(header).toBeTruthy();

    const fondo = header?.closest('div');
    expect(
      fondo?.classList.contains('bg-fondo-app') ||
        fondo?.classList.contains('bg-landing-gradiente-amarillo-verde'),
    ).toBe(true);

    expect(fixture.nativeElement.querySelector('input[type="search"]')).toBeFalsy();

    const overlay = fixture.nativeElement.querySelector('.bg-auth-fondo-gradiente') as HTMLElement;
    expect(overlay.classList.contains('opacity-0')).toBe(true);

    const headerHost = fixture.nativeElement.querySelector('app-header') as HTMLElement;
    expect(headerHost.getAttribute('data-modo-auth')).toBe('jugador');
  });

  it('cruza el gradiente de auth-empresa sobre el fondo de landing y marca el modo en el contenido', () => {
    const fixture = preparar({ modo: 'empresa' });
    fixture.detectChanges();

    const raiz = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(raiz.classList.contains('bg-landing-gradiente-amarillo-verde')).toBe(true);

    const overlay = raiz.querySelector('.bg-auth-fondo-gradiente') as HTMLElement;
    expect(overlay.classList.contains('opacity-0')).toBe(false);

    const headerHost = raiz.querySelector('app-header') as HTMLElement;
    expect(headerHost.getAttribute('data-modo-auth')).toBe('empresa');

    const contenido = raiz.querySelector('div[data-modo-auth]') as HTMLElement;
    expect(contenido.getAttribute('data-modo-auth')).toBe('empresa');
  });

  it('aplica ?modo=empresa y restaura el data-modo previo al destruirse', () => {
    document.documentElement.setAttribute('data-modo', 'jugador');

    const fixture = preparar({ modo: 'empresa' });
    expect(document.documentElement.getAttribute('data-modo')).toBe('empresa');

    fixture.destroy();
    expect(document.documentElement.getAttribute('data-modo')).toBe('jugador');
  });

  it('quita el data-modo si no existía antes de entrar con ?modo=empresa', () => {
    document.documentElement.removeAttribute('data-modo');

    const fixture = preparar({ modo: 'empresa' });
    expect(document.documentElement.getAttribute('data-modo')).toBe('empresa');

    fixture.destroy();
    expect(document.documentElement.hasAttribute('data-modo')).toBe(false);
  });

  it('no toca el data-modo cuando la URL no trae ?modo=', () => {
    document.documentElement.setAttribute('data-modo', 'empresa');

    const fixture = preparar({});
    expect(document.documentElement.getAttribute('data-modo')).toBe('empresa');

    fixture.destroy();
    expect(document.documentElement.getAttribute('data-modo')).toBe('empresa');
  });
});
