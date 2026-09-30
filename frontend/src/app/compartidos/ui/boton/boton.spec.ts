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
    <a app-boton id="link-enabled" [routerLink]="['/destino']">IR A DESTINO</a>
    <a app-boton id="link-disabled" [routerLink]="['/destino']" [disabled]="true">LINK BLOQUEADO</a>
    <button app-boton id="btn-sin-texto" forma="circulo"></button>
    <button app-boton id="btn-con-aria" forma="circulo" aria-label="Notificaciones"></button>
  `,
})
class TestHostComponent {}

describe('Boton Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let router: Router;

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
    const btnEl = fixture.debugElement.query(By.css('#btn-default')).nativeElement as HTMLButtonElement;
    expect(btnEl).toBeTruthy();
    expect(btnEl.classList.contains('btn')).toBe(true);
    expect(btnEl.classList.contains('btn--primario')).toBe(true);
    expect(btnEl.classList.contains('btn--pildora')).toBe(true);
    expect(btnEl.classList.contains('btn--md')).toBe(true);
  });

  it('debe aplicar variantes, formas, tamaños y preservar clases del consumidor como ml-auto', () => {
    const btnEl = fixture.debugElement.query(By.css('#btn-custom')).nativeElement as HTMLButtonElement;
    expect(btnEl.classList.contains('btn--secundario')).toBe(true);
    expect(btnEl.classList.contains('btn--circulo')).toBe(true);
    expect(btnEl.classList.contains('btn--lg')).toBe(true);
    expect(btnEl.classList.contains('ml-auto')).toBe(true);
  });

  it('debe aplicar atributos nativos y clases de disabled en <button>', () => {
    const btnEl = fixture.debugElement.query(By.css('#btn-disabled')).nativeElement as HTMLButtonElement;
    expect(btnEl.disabled).toBe(true);
    expect(btnEl.classList.contains('btn--deshabilitado')).toBe(true);
    expect(btnEl.getAttribute('aria-disabled')).toBe('true');
  });

  it('debe aplicar aria-disabled y tabindex="-1" en <a> deshabilitado sin poner el atributo disabled', () => {
    const linkEl = fixture.debugElement.query(By.css('#link-disabled')).nativeElement as HTMLAnchorElement;
    expect(linkEl.getAttribute('disabled')).toBeNull();
    expect(linkEl.getAttribute('aria-disabled')).toBe('true');
    expect(linkEl.getAttribute('tabindex')).toBe('-1');
    expect(linkEl.classList.contains('btn--deshabilitado')).toBe(true);
  });

  it('debe navegar cuando el enlace <a> está habilitado', fakeAsync(() => {
    const linkDebug = fixture.debugElement.query(By.css('#link-enabled'));
    const linkEl = linkDebug.nativeElement as HTMLAnchorElement;

    linkEl.click();
    tick();
    fixture.detectChanges();

    expect(router.url).toBe('/destino');
  }));

  it('NO debe navegar y debe cancelar el evento cuando el enlace <a> está deshabilitado con routerLink', fakeAsync(() => {
    router.navigateByUrl('/');
    tick();
    expect(router.url).toBe('/');

    const linkDebug = fixture.debugElement.query(By.css('#link-disabled'));
    const linkEl = linkDebug.nativeElement as HTMLAnchorElement;

    const event = new MouseEvent('click', { cancelable: true, bubbles: true });
    const dispatched = linkEl.dispatchEvent(event);

    tick();
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(dispatched).toBe(false);
    expect(router.url).toBe('/');
  }));

  it('debe advertir en consola en dev si no tiene texto ni aria-label', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Crear un componente aislado sin texto ni aria
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
