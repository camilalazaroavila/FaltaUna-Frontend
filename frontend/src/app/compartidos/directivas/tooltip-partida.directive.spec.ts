import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TooltipPartidaDirective } from './tooltip-partida.directive';

@Component({
  standalone: true,
  imports: [TooltipPartidaDirective],
  template: `
    <button
      id="boton-test"
      [appTooltipPartida]="'Descripción informativa del elemento'"
      [esCarta]="esCarta"
    >
      Elemento de partida
    </button>
  `,
})
class ComponentePrueba {
  esCarta = false;
}

describe('TooltipPartidaDirective', () => {
  let fixture: ComponentFixture<ComponentePrueba>;
  let directiva: TooltipPartidaDirective;
  let boton: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentePrueba],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentePrueba);
    fixture.detectChanges();
    boton = fixture.nativeElement.querySelector('#boton-test');
    directiva = fixture.debugElement
      .query(By.directive(TooltipPartidaDirective))
      .injector.get(TooltipPartidaDirective);
  });

  afterEach(() => {
    document.querySelectorAll('.tooltip-partida-flotante').forEach((el) => el.remove());
  });

  it('muestra el tooltip con hover de mouse tras el retardo y lo oculta en mouseleave', fakeAsync(() => {
    directiva.alEntrarMouse();
    expect(document.querySelector('.tooltip-partida-flotante')).toBeNull();

    tick(160);
    const globo = document.querySelector('.tooltip-partida-flotante');
    expect(globo).not.toBeNull();
    expect(globo?.textContent).toContain('Descripción informativa del elemento');

    directiva.alSalirMouse();
    expect(document.querySelector('.tooltip-partida-flotante')).toBeNull();
  }));

  it('muestra el tooltip en mobile con long press (touch)', fakeAsync(() => {
    directiva.alPulsarPointer({ pointerType: 'touch', clientX: 100, clientY: 100 });
    expect(document.querySelector('.tooltip-partida-flotante')).toBeNull();

    tick(460);
    expect(document.querySelector('.tooltip-partida-flotante')).not.toBeNull();

    directiva.alLiberarPointer({ pointerType: 'touch' });
    tick(1600);
    expect(document.querySelector('.tooltip-partida-flotante')).toBeNull();
  }));

  it('no activa el tooltip en mobile si esCarta es true', fakeAsync(() => {
    fixture.componentInstance.esCarta = true;
    fixture.detectChanges();

    directiva.alPulsarPointer({ pointerType: 'touch', clientX: 100, clientY: 100 });
    tick(500);

    expect(document.querySelector('.tooltip-partida-flotante')).toBeNull();
  }));
});
