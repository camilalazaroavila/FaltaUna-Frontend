import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideIcons } from '@ng-icons/core';
import {
  BotonJugar,
  URL_JAIME_REPOSO,
  URL_JAIME_HOVER,
} from './boton-jugar';

const ICONO_PRUEBA = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

@Component({
  standalone: true,
  imports: [BotonJugar],
  template: `
    <app-boton-jugar id="jugar-default" (accion)="registrar()" />
    <app-boton-jugar
      id="jugar-custom-label"
      ariaLabel="Entrar a jugar"
      textoGlobo="¡Vamos!"
      texto="Abrir sobre"
      subtexto="2 gratis hoy"
      (accion)="registrar()"
    />
    <app-boton-jugar id="jugar-bloqueado" [deshabilitado]="true" />
  `,
})
class TestHostComponent {
  readonly eventos: string[] = [];

  registrar(): void {
    this.eventos.push('accion');
  }
}

describe('BotonJugar Component', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  const boton = (id: string) =>
    fixture.debugElement.query(By.css(`#${id} button`)).nativeElement as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideIcons({ phosphorPlayFill: ICONO_PRUEBA })],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe renderizar el botón con aria-label "Jugar una partida" por defecto, globo con "¡Jugá!" e imágenes estáticas', () => {
    const btnEl = boton('jugar-default');

    expect(btnEl.type).toBe('button');
    expect(btnEl.getAttribute('aria-label')).toBe('Jugar una partida');

    const globo = btnEl.querySelector('.boton-jugar__globo');
    expect(globo).toBeTruthy();
    expect(globo?.getAttribute('aria-hidden')).toBe('true');
    expect(globo?.textContent?.trim()).toBe('¡Jugá!');

    const imagenes = btnEl.querySelectorAll('img');
    expect(imagenes.length).toBe(2);

    const imgReposo = imagenes[0];
    const imgHover = imagenes[1];

    expect(imgReposo.getAttribute('src')).toBe(URL_JAIME_REPOSO);
    expect(imgReposo.getAttribute('alt')).toBe('');
    expect(imgReposo.getAttribute('aria-hidden')).toBe('true');
    expect(imgReposo.getAttribute('width')).toBe('435');
    expect(imgReposo.getAttribute('height')).toBe('387');
    expect(imgReposo.getAttribute('loading')).toBe('eager');
    expect(imgReposo.classList.contains('boton-jugar__img--reposo')).toBe(true);

    expect(imgHover.getAttribute('src')).toBe(URL_JAIME_HOVER);
    expect(imgHover.getAttribute('alt')).toBe('');
    expect(imgHover.getAttribute('aria-hidden')).toBe('true');
    expect(imgHover.getAttribute('width')).toBe('435');
    expect(imgHover.getAttribute('height')).toBe('387');
    expect(imgHover.classList.contains('boton-jugar__img--hover')).toBe(true);
  });

  it('debe permitir un aria-label personalizado y texto de globo personalizado', () => {
    const btnEl = boton('jugar-custom-label');
    expect(btnEl.getAttribute('aria-label')).toBe('Entrar a jugar');
    const globo = btnEl.querySelector('.boton-jugar__globo');
    expect(globo?.textContent?.trim()).toBe('¡Vamos!');
  });

  it('debe bloquear el control de forma nativa cuando está deshabilitado', () => {
    const btnEl = boton('jugar-bloqueado');

    expect(btnEl.disabled).toBe(true);
    expect(btnEl.classList.contains('disabled:opacity-60')).toBe(true);
  });

  it('debe emitir accion al hacer clic y no hacerlo cuando está deshabilitado', () => {
    boton('jugar-default').click();
    boton('jugar-custom-label').click();
    boton('jugar-bloqueado').click();

    expect(fixture.componentInstance.eventos).toEqual(['accion', 'accion']);
  });

  it('debe mostrar el respaldo visual con texto si ocurre un error de carga de imagen', () => {
    const componente = fixture.debugElement.query(By.css('#jugar-default'))
      .componentInstance as BotonJugar;

    componente.alFallarCarga();
    fixture.detectChanges();

    const btnEl = boton('jugar-default');
    const respaldo = btnEl.querySelector('.boton-jugar__respaldo');

    expect(respaldo).toBeTruthy();
    expect(respaldo?.textContent).toContain('JUGAR');
  });
});
