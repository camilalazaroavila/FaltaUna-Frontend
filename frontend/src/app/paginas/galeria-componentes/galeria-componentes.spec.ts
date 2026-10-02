import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { GaleriaComponentes } from './galeria-componentes';
import { SECCIONES } from './secciones';

const ICONO_PRUEBA = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

/** Iconos que la galeria le pide a `NgIcon`; el dibujo es irrelevante. */
const ICONOS = {
  phosphorPlusFill: ICONO_PRUEBA,
  phosphorArrowRightFill: ICONO_PRUEBA,
  phosphorCaretRightFill: ICONO_PRUEBA,
  phosphorSparkleFill: ICONO_PRUEBA,
  phosphorCardsFill: ICONO_PRUEBA,
  phosphorStackFill: ICONO_PRUEBA,
  phosphorArrowsLeftRightFill: ICONO_PRUEBA,
  phosphorQrCodeFill: ICONO_PRUEBA,
  phosphorTicketFill: ICONO_PRUEBA,
  phosphorBellFill: ICONO_PRUEBA,
  phosphorGiftFill: ICONO_PRUEBA,
  phosphorHouseFill: ICONO_PRUEBA,
  phosphorTrophyFill: ICONO_PRUEBA,
  phosphorWarningFill: ICONO_PRUEBA,
  phosphorPlayFill: ICONO_PRUEBA,
  phosphorXFill: ICONO_PRUEBA,
  phosphorHeartFill: ICONO_PRUEBA,
  phosphorLockFill: ICONO_PRUEBA,
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('GaleriaComponentes', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<GaleriaComponentes>>;

  const html = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    document.documentElement.removeAttribute('data-modo');
    document.documentElement.removeAttribute('data-movimiento');

    await TestBed.configureTestingModule({
      imports: [GaleriaComponentes],
      providers: [provideRouter([]), provideIcons(ICONOS)],
    }).compileComponents();

    fixture = TestBed.createComponent(GaleriaComponentes);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    document.documentElement.removeAttribute('data-modo');
    document.documentElement.removeAttribute('data-movimiento');
  });

  it('debe renderizar las siete secciones de la galeria', () => {
    expect(SECCIONES.length).toBe(7);

    for (const seccion of SECCIONES) {
      expect(html().querySelector(`#${seccion.id}`)).not.toBeNull();
    }
  });

  it('debe generar un indice con un enlace por seccion, sin sobras ni faltantes', () => {
    const enlaces = Array.from(
      html().querySelectorAll<HTMLAnchorElement>('nav[aria-label="Índice de secciones"] a'),
    );

    const destinos = enlaces.map((enlace) => enlace.getAttribute('href'));
    const esperados = SECCIONES.map((seccion) => `#${seccion.id}`);

    expect(destinos).toEqual(esperados);
  });

  it('debe contener al menos una tarjeta de muestra por seccion', () => {
    for (const seccion of SECCIONES) {
      const nodo = html().querySelector(`#${seccion.id}`) as HTMLElement;

      expect(nodo.querySelectorAll('app-tarjeta-muestra').length).toBeGreaterThan(0);
    }
  });

  it('debe cambiar data-modo en el elemento raiz sin recargar', () => {
    expect(document.documentElement.getAttribute('data-modo')).toBe('jugador');

    const radioEmpresa = html().querySelector<HTMLInputElement>(
      'input[name="modo-galeria"][value="empresa"]',
    ) as HTMLInputElement;

    radioEmpresa.checked = true;
    radioEmpresa.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(document.documentElement.getAttribute('data-modo')).toBe('empresa');
  });

  it('debe activar el atributo de movimiento reducido y limpiarlo al salir', () => {
    const interruptor = html().querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    interruptor.checked = true;
    interruptor.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(document.documentElement.getAttribute('data-movimiento')).toBe('reducido');

    interruptor.checked = false;
    interruptor.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(document.documentElement.hasAttribute('data-movimiento')).toBe(false);
  });

  it('debe registrar el output del boton base al interactuar', () => {
    const boton = html().querySelector<HTMLButtonElement>('#boton button[app-boton]') as HTMLButtonElement;

    expect(html().querySelector('#boton app-registro-eventos')?.textContent).toContain(
      'Sin eventos',
    );

    boton.click();
    fixture.detectChanges();

    const registro = html().querySelector('#boton app-registro-eventos')?.textContent ?? '';

    expect(registro).toContain('accion emitida');
  });

  it('debe mover el estado activo de la barra lateral simulada', () => {
    const botones = Array.from(
      html().querySelectorAll<HTMLElement>('nav[aria-label="Barra lateral de ejemplo"] button'),
    );

    expect(botones.length).toBe(5);

    botones[4].click();
    fixture.detectChanges();

    expect(botones[4].getAttribute('aria-pressed')).toBe('true');
    expect(botones[0].getAttribute('aria-pressed')).toBeNull();
  });

  it('debe exponer el estado deshabilitado del boton de navegacion circular', () => {
    const deshabilitado = html().querySelector<HTMLButtonElement>(
      '#navegacion-circular app-boton-navegacion-circular button[disabled]',
    );

    expect(deshabilitado).not.toBeNull();
    expect(deshabilitado?.disabled).toBe(true);
    expect(deshabilitado?.getAttribute('aria-disabled')).toBe('true');
  });

  it('debe renderizar las muestras de tokens, feedback y scrollbar', () => {
    const seccion = html().querySelector('#tokens') as HTMLElement;

    expect(seccion.textContent).toContain('--marca-primaria');
    expect(seccion.textContent).toContain('--exito-fondo');
    expect(seccion.textContent).toContain('Russo One');
    expect(seccion.textContent).toContain('--sombra-brillo-verde');
    expect(seccion.querySelectorAll('.custom-scrollbar').length).toBeGreaterThan(0);
  });

  it('debe marcar como pendientes los componentes de la Tanda D', () => {
    const seccion = html().querySelector('#boton-icono') as HTMLElement;

    expect(seccion.textContent).toContain('app-icono-corazon');
    expect(seccion.textContent).toContain('app-flechas-navegacion');
  });
});