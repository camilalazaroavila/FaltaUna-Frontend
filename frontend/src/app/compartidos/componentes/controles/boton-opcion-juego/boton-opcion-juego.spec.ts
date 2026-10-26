import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, RouterLink, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { BotonOpcionJuego } from './boton-opcion-juego';

@Component({
  standalone: true,
  template: '<p>Destino</p>',
})
class DestinoDummyComponent {}

@Component({
  standalone: true,
  imports: [BotonOpcionJuego, RouterLink],
  template: `
    <button app-boton-opcion-juego id="opcion-md" ancho="completo">Partida contra jugador</button>
    <button app-boton-opcion-juego id="opcion-sm" tamanio="sm" class="ml-auto">Tutorial</button>
    <button app-boton-opcion-juego id="opcion-lg" tamanio="lg">Volver al inicio</button>
    <button app-boton-opcion-juego id="opcion-bloqueada" [disabled]="true">
      Partida contra la IA
    </button>
    <button app-boton-opcion-juego id="opcion-compuesta">
      <strong>Partida</strong> contra <em>jugador</em>
    </button>
    <a app-boton-opcion-juego id="enlace" [routerLink]="['/destino']">Partida contra la IA</a>
    <a
      app-boton-opcion-juego
      id="enlace-bloqueado"
      [routerLink]="['/destino']"
      [disabled]="true"
    >
      Tutorial
    </a>
  `,
})
class TestHostComponent {}

describe('BotonOpcionJuego Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let router: Router;

  const elemento = (id: string) =>
    fixture.debugElement.query(By.css(`#${id}`)).nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([{ path: 'destino', component: DestinoDummyComponent }])],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe renderizar el texto proyectado, sin envoltura propia', () => {
    expect(elemento('opcion-md').textContent?.trim()).toBe('Partida contra jugador');
    expect(elemento('opcion-lg').textContent?.trim()).toBe('Volver al inicio');
    expect(elemento('opcion-bloqueada').textContent?.trim()).toBe('Partida contra la IA');

    // El contenido llega por proyección: no hay ningún span intermedio.
    expect(elemento('opcion-md').children.length).toBe(0);
  });

  it('debe componer el contenido proyectado sin perder las etiquetas del consumidor', () => {
    const btnEl = elemento('opcion-compuesta');

    expect(btnEl.querySelector('strong')?.textContent).toBe('Partida');
    expect(btnEl.querySelector('em')?.textContent).toBe('jugador');
    expect(btnEl.textContent?.replace(/\s+/g, ' ').trim()).toBe('Partida contra jugador');
  });

  it('debe conservar las clases del consumidor como ml-auto', () => {
    expect(elemento('opcion-sm').classList.contains('ml-auto')).toBe(true);
  });

  it('debe aplicar las clases de geometría de cada tamaño', () => {
    const sm = elemento('opcion-sm');
    expect(sm.classList.contains('[--desfase:6px]')).toBe(true);
    expect(sm.classList.contains('[--radio:14px]')).toBe(true);
    expect(sm.classList.contains('min-h-[4.75rem]')).toBe(true);
    expect(sm.classList.contains('text-[1.25rem]')).toBe(true);

    const md = elemento('opcion-md');
    expect(md.classList.contains('[--desfase:8px]')).toBe(true);
    expect(md.classList.contains('[--sangrado:80px]')).toBe(true);
    expect(md.classList.contains('min-h-[6.25rem]')).toBe(true);
    expect(md.classList.contains('text-[1.75rem]')).toBe(true);

    const lg = elemento('opcion-lg');
    expect(lg.classList.contains('[--desfase:10px]')).toBe(true);
    expect(lg.classList.contains('[--radio:22px]')).toBe(true);
    expect(lg.classList.contains('min-h-[7.5rem]')).toBe(true);
    expect(lg.classList.contains('text-[2.125rem]')).toBe(true);
  });

  it('debe escalar el padding derecho con el tamaño, porque depende del desfase', () => {
    expect(elemento('opcion-sm').classList.contains('pr-[calc(var(--desfase)+3.25rem)]')).toBe(true);
    expect(elemento('opcion-md').classList.contains('pr-[calc(var(--desfase)+4.375rem)]')).toBe(true);
    expect(elemento('opcion-lg').classList.contains('pr-[calc(var(--desfase)+5.5rem)]')).toBe(true);

    // Cada tamaño declara su propio desfase: el padding nunca queda en un valor fijo.
    expect(elemento('opcion-sm').classList.contains('[--desfase:6px]')).toBe(true);
    expect(elemento('opcion-md').classList.contains('[--desfase:8px]')).toBe(true);
    expect(elemento('opcion-lg').classList.contains('[--desfase:10px]')).toBe(true);
  });

  it('debe aplicar el ancho auto por defecto y completo cuando se pide', () => {
    expect(elemento('opcion-lg').classList.contains('w-fit')).toBe(true);
    expect(elemento('opcion-lg').classList.contains('w-full')).toBe(false);

    expect(elemento('opcion-md').classList.contains('w-full')).toBe(true);
    expect(elemento('opcion-md').classList.contains('w-fit')).toBe(false);
  });

  it('debe dibujar la sombra en ::before y la cara en ::after, sin transformar el host', () => {
    const btnEl = elemento('opcion-md');

    expect(btnEl.classList.contains('before:bg-btn-juego-sombra')).toBe(true);
    expect(btnEl.classList.contains('after:bg-btn-juego-bg')).toBe(true);
    expect(btnEl.classList.contains('text-btn-juego-texto')).toBe(true);

    // El sesgo va en las capas; el host queda intacto para no deformar el texto.
    expect(btnEl.classList.contains('before:skew-x-(--angulo)')).toBe(true);
    expect(btnEl.classList.contains('after:skew-x-(--angulo)')).toBe(true);
    expect(btnEl.classList.contains('isolate')).toBe(true);
    expect(btnEl.classList.contains('inclinar-menu')).toBe(false);
  });

  it('debe mover solo la cara al interactuar, con la sombra inmóvil', () => {
    const btnEl = elemento('opcion-md');

    // La sombra no tiene transición: el hover y el active solo afectan a ::after.
    expect(btnEl.classList.contains('after:transition-[translate,transform]')).toBe(true);
    expect(btnEl.classList.contains('habilitado:hover:after:translate-x-0.5')).toBe(true);
    expect(btnEl.classList.contains('habilitado:active:after:translate-x-(--desfase)')).toBe(true);
  });

  it('debe diferenciar el desplazamiento del hover del del active', () => {
    const btnEl = elemento('opcion-md');

    // El hover mueve 2px (spacing 0.25rem * 0.5) y el active el desfase completo
    // del tamaño (6px/8px/10px). Deben ser utilidades distintas: si coincidieran,
    // apretar el control no se distinguiría de solo pasar el cursor.
    const hover = 'habilitado:hover:after:translate-x-0.5';
    const active = 'habilitado:active:after:translate-x-(--desfase)';

    expect(btnEl.classList.contains(hover)).toBe(true);
    expect(btnEl.classList.contains(active)).toBe(true);
    expect(hover).not.toBe(active);

    for (const id of ['opcion-sm', 'opcion-md', 'opcion-lg']) {
      expect(elemento(id).classList.contains('habilitado:hover:after:translate-x-1')).toBe(false);
      expect(elemento(id).classList.contains('habilitado:hover:after:translate-x-2')).toBe(false);
      expect(elemento(id).classList.contains('habilitado:hover:after:translate-y-2')).toBe(false);
    }
  });

  it('debe anular las transiciones con motion-reduce', () => {
    expect(elemento('opcion-md').classList.contains('motion-reduce:after:transition-none')).toBe(
      true
    );
  });

  it('debe resolver el foco con un anillo inset sobre la cara, no con un outline', () => {
    const btnEl = elemento('opcion-md');

    // `overflow-hidden` recortaría cualquier indicador externo, y el outline
    // global es un rectángulo que no sigue el paralelogramo.
    expect(btnEl.classList.contains('focus-visible:outline-none')).toBe(true);
    expect(
      btnEl.classList.contains('focus-visible:after:shadow-[inset_0_0_0_3px_var(--btn-juego-foco)]')
    ).toBe(true);
  });

  it('debe cumplir el área táctil de 44px en los tres tamaños sin pseudo-elemento', () => {
    // Alto mínimo declarado por cada tamaño, en px.
    const esperados: Array<[string, number]> = [
      ['opcion-sm', 76],
      ['opcion-md', 100],
      ['opcion-lg', 120],
    ];

    for (const [id, pixelesEsperados] of esperados) {
      const btnEl = elemento(id);
      const minAlto = Array.from(btnEl.classList).find((clase) => clase.startsWith('min-h-['));

      expect(minAlto).toBeDefined();

      const valorRem = Number(minAlto?.match(/\[([\d.]+)rem\]/)?.[1]);
      expect(valorRem * 16).toBe(pixelesEsperados);

      // WCAG 2.5.5 se cumple con la caja del propio control.
      expect(valorRem * 16).toBeGreaterThanOrEqual(44);

      // La garantía la da el alto mínimo, no `area-tactil`: esa utilidad ocupa
      // `::before`, que en este componente pertenece a la capa de sombra.
      expect(btnEl.classList.contains('area-tactil')).toBe(false);
    }
  });

  it('debe aplicar atributos nativos y clases de deshabilitado en <button>', () => {
    const btnEl = elemento('opcion-bloqueada') as HTMLButtonElement;

    expect(btnEl.disabled).toBe(true);
    expect(btnEl.getAttribute('aria-disabled')).toBe('true');
    expect(btnEl.classList.contains('opacity-50')).toBe(true);
    expect(btnEl.classList.contains('cursor-not-allowed')).toBe(true);

    // Sin `pointer-events-none`: el bloqueo real lo hace el preventDefault.
    expect(btnEl.classList.contains('pointer-events-none')).toBe(false);
  });

  it('debe aplicar aria-disabled y tabindex="-1" en <a> sin poner el atributo disabled', () => {
    const linkEl = elemento('enlace-bloqueado') as HTMLAnchorElement;

    expect(linkEl.getAttribute('disabled')).toBeNull();
    expect(linkEl.getAttribute('aria-disabled')).toBe('true');
    expect(linkEl.getAttribute('tabindex')).toBe('-1');
    expect(linkEl.classList.contains('opacity-50')).toBe(true);
  });

  it('debe navegar cuando el enlace <a> está habilitado', fakeAsync(() => {
    (elemento('enlace') as HTMLAnchorElement).click();
    tick();
    fixture.detectChanges();

    expect(router.url).toBe('/destino');
  }));

  it('NO debe navegar ni disparar el click cuando el enlace está deshabilitado', fakeAsync(() => {
    router.navigateByUrl('/');
    tick();
    expect(router.url).toBe('/');

    const event = new MouseEvent('click', { cancelable: true, bubbles: true });
    const dispatched = elemento('enlace-bloqueado').dispatchEvent(event);

    tick();
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(dispatched).toBe(false);
    expect(router.url).toBe('/');
  }));

  it('NO debe disparar el click del consumidor cuando el botón está deshabilitado', () => {
    const clickSpy = jest.fn();
    const btnEl = elemento('opcion-bloqueada');
    btnEl.addEventListener('click', clickSpy);

    btnEl.click();

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('debe permitir el foco por teclado solo en los controles habilitados', () => {
    // `tabindex="-1"` saca el enlace del recorrido de tabulación pero sigue
    // permitiendo el foco programático, así que lo que se verifica es el
    // atributo, no la imposibilidad de enfocarlo.
    const habilitado = elemento('enlace');
    expect(habilitado.getAttribute('tabindex')).toBeNull();

    habilitado.focus();
    expect(document.activeElement).toBe(habilitado);

    expect(elemento('enlace-bloqueado').getAttribute('tabindex')).toBe('-1');

    const boton = elemento('opcion-md');
    boton.focus();
    expect(document.activeElement).toBe(boton);
  });
});
