import { TestBed } from '@angular/core/testing';
import { TutorialServicio } from '@compartidos/componentes/tutorial/tutorial.servicio';
import { TutorialOverlay } from './tutorial-overlay';

const botones = (host: HTMLElement): HTMLButtonElement[] =>
  Array.from(host.querySelectorAll<HTMLButtonElement>('button'));

const botonConTexto = (host: HTMLElement, texto: string): HTMLButtonElement | undefined =>
  botones(host).find((boton) => boton.textContent?.trim() === texto);

describe('TutorialOverlay', () => {
  let servicio: TutorialServicio;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TutorialOverlay] }).compileComponents();
    servicio = TestBed.inject(TutorialServicio);
  });

  it('no renderiza nada si el tutorial está inactivo', () => {
    const fixture = TestBed.createComponent(TutorialOverlay);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.tutorial')).toBeNull();
  });

  it('muestra el paso actual y avanza con Siguiente', () => {
    servicio.iniciar();

    const fixture = TestBed.createComponent(TutorialOverlay);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('#tutorial-titulo')?.textContent).toContain('Tu primera ronda');

    botonConTexto(host, 'Siguiente')?.click();
    fixture.detectChanges();

    expect(host.querySelector('#tutorial-titulo')?.textContent).toContain('Los cupones');
  });

  it('bloquea Siguiente en un paso con acción hasta que llega el evento', () => {
    servicio.iniciar();

    const fixture = TestBed.createComponent(TutorialOverlay);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    for (let i = 0; i < 3; i++) {
      botonConTexto(host, 'Siguiente')?.click();
      fixture.detectChanges();
    }

    expect(host.querySelector('#tutorial-titulo')?.textContent).toContain('Costo y poder');
    expect(botonConTexto(host, 'Siguiente')?.disabled).toBe(true);

    servicio.notificar('carta-vista');
    fixture.detectChanges();

    expect(botonConTexto(host, 'Siguiente')?.disabled).toBe(false);
  });

  it('pide confirmación antes de salir', () => {
    servicio.iniciar();

    const fixture = TestBed.createComponent(TutorialOverlay);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    botonConTexto(host, 'Salir')?.click();
    fixture.detectChanges();

    expect(host.querySelector('.tutorial__confirmacion')).not.toBeNull();

    botonConTexto(host, 'Seguir')?.click();
    fixture.detectChanges();

    expect(host.querySelector('.tutorial__confirmacion')).toBeNull();
  });

  it('muestra la vista previa inline sin pedir salida', () => {
    const fixture = TestBed.createComponent(TutorialOverlay);
    fixture.componentRef.setInput('vistaPrevia', true);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.tutorial--vista-previa')).not.toBeNull();
    expect(botonConTexto(host, 'Salir')).toBeUndefined();
    expect(host.querySelector('#tutorial-titulo')?.textContent).toContain('Los cupones');
  });
});
