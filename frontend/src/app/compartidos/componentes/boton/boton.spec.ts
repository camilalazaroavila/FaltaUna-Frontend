import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, RouterLink, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { Boton } from './boton';

@Component({
  standalone: true,
  template: '<p>Destino</p>',
})
class DestinoDummyComponent {}

@Component({
  standalone: true,
  imports: [Boton, RouterLink],
  template: `
    <button app-boton id="btn-default">VER SOBRES</button>
    <button app-boton id="btn-custom" variante="secundario" forma="circulo" tamanio="lg" class="ml-auto">
      CUSTOM
    </button>
    <button app-boton id="btn-disabled" [disabled]="true">DESHABILITADO</button>
    <button app-boton id="btn-cargando" [cargando]="true">ABRIENDO</button>
    <button app-boton id="btn-claro" variante="claro">MODO EMPRESA</button>
    <a app-boton id="link-enabled" [routerLink]="['/destino']">IR A DESTINO</a>
    <a app-boton id="link-disabled" [routerLink]="['/destino']" [disabled]="true">LINK BLOQUEADO</a>
    <button app-boton id="btn-sin-texto" forma="circulo"></button>
    <button app-boton id="btn-con-aria" forma="circulo" aria-label="Notificaciones"></button>
    <button app-boton id="btn-sm-circular" forma="circulo" tamanio="sm" aria-label="Favorito"></button>
  `,
})
class TestHostComponent {}

describe('Boton Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let router: Router;

  const elemento = (id: string) =>
    fixture.debugElement.query(By.css(`#${id}`)).nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([
          { path: 'destino', component: DestinoDummyComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe renderizar correctamente con valores por defecto (primario, pildora, md)', () => {
    const btnEl = elemento('btn-default');

    expect(btnEl.classList.contains('inline-flex')).toBe(true);
    expect(btnEl.classList.contains('rounded-pildora')).toBe(true);
    expect(btnEl.classList.contains('font-interfaz')).toBe(true);
    expect(btnEl.classList.contains('bg-btn-primario-bg')).toBe(true);
    expect(btnEl.classList.contains('text-btn-primario-texto')).toBe(true);
    expect(btnEl.classList.contains('h-[2.75rem]')).toBe(true);
    expect(btnEl.classList.contains('px-6')).toBe(true);
  });

  it('debe aplicar variantes, formas, tamaños y preservar clases del consumidor como ml-auto', () => {
    const btnEl = elemento('btn-custom');

    expect(btnEl.classList.contains('bg-btn-secundario-bg')).toBe(true);
    expect(btnEl.classList.contains('rounded-circulo')).toBe(true);
    expect(btnEl.classList.contains('aspect-square')).toBe(true);
    expect(btnEl.classList.contains('h-[3.25rem]')).toBe(true);
    // La pildora no debe arrastrar el padding horizontal de la forma circular.
    expect(btnEl.classList.contains('px-8')).toBe(false);
    expect(btnEl.classList.contains('ml-auto')).toBe(true);
  });

  it('debe conservar el área táctil de 44px solo en botones circulares compactos', () => {
    expect(elemento('btn-sm-circular').classList.contains('area-tactil')).toBe(true);
    expect(elemento('btn-sm-circular').classList.contains('h-8')).toBe(true);

    // El tamaño md ya supera los 44px: el pseudo-elemento sería redundante.
    expect(elemento('btn-con-aria').classList.contains('area-tactil')).toBe(false);
  });

  it('debe aplicar la variante claro con superficie elevada y hover de marca', () => {
    const btnEl = elemento('btn-claro');

    expect(btnEl.classList.contains('bg-fondo-elevado')).toBe(true);
    expect(btnEl.classList.contains('border-borde-default')).toBe(true);
    expect(btnEl.classList.contains('habilitado:hover:bg-marca-acento')).toBe(true);
  });

  it('debe aplicar atributos nativos y clases de disabled en <button>', () => {
    const btnEl = elemento('btn-disabled') as HTMLButtonElement;

    expect(btnEl.disabled).toBe(true);
    expect(btnEl.classList.contains('opacity-50')).toBe(true);
    expect(btnEl.classList.contains('cursor-not-allowed')).toBe(true);
    expect(btnEl.getAttribute('aria-disabled')).toBe('true');
    expect(btnEl.getAttribute('aria-busy')).toBeNull();
  });

  it('debe bloquear la acción y anunciar el estado de carga cuando cargando="true"', () => {
    const btnEl = elemento('btn-cargando') as HTMLButtonElement;
    const clickSpy = jest.fn();

    btnEl.addEventListener('click', clickSpy);
    btnEl.click();

    expect(btnEl.disabled).toBe(true);
    expect(btnEl.getAttribute('aria-busy')).toBe('true');
    expect(btnEl.classList.contains('opacity-50')).toBe(true);
    expect(btnEl.querySelector('svg')).not.toBeNull();
    expect(btnEl.querySelector('.sr-only')?.textContent?.trim()).toBe('Cargando…');
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('debe aplicar aria-disabled y tabindex="-1" en <a> deshabilitado sin poner el atributo disabled', () => {
    const linkEl = elemento('link-disabled') as HTMLAnchorElement;

    expect(linkEl.getAttribute('disabled')).toBeNull();
    expect(linkEl.getAttribute('aria-disabled')).toBe('true');
    expect(linkEl.getAttribute('tabindex')).toBe('-1');
    expect(linkEl.classList.contains('opacity-50')).toBe(true);
  });

  it('debe navegar cuando el enlace <a> está habilitado', fakeAsync(() => {
    (elemento('link-enabled') as HTMLAnchorElement).click();
    tick();
    fixture.detectChanges();

    expect(router.url).toBe('/destino');
  }));

  it('NO debe navegar y debe cancelar el evento cuando el enlace <a> está deshabilitado con routerLink', fakeAsync(() => {
    router.navigateByUrl('/');
    tick();
    expect(router.url).toBe('/');

    const event = new MouseEvent('click', { cancelable: true, bubbles: true });
    const dispatched = elemento('link-disabled').dispatchEvent(event);

    tick();
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(dispatched).toBe(false);
    expect(router.url).toBe('/');
  }));

  it('debe advertir en consola en dev si no tiene texto ni aria-label', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    @Component({
      standalone: true,
      imports: [Boton],
      template: '<button app-boton></button>',
    })
    class SinTextoHostComponent {}

    const isolatedFixture = TestBed.createComponent(SinTextoHostComponent);
    isolatedFixture.detectChanges();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[app-boton]: Todo botón o enlace sin texto visible requiere "aria-label"')
    );

    warnSpy.mockRestore();
  });

  it('NO debe advertir en consola en dev si tiene aria-label', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    @Component({
      standalone: true,
      imports: [Boton],
      template: '<button app-boton aria-label="Cerrar"></button>',
    })
    class ConAriaHostComponent {}

    const isolatedFixture = TestBed.createComponent(ConAriaHostComponent);
    isolatedFixture.detectChanges();

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
