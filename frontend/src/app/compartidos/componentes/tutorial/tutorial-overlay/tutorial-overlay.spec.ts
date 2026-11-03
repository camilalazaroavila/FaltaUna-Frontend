import { TestBed } from '@angular/core/testing';
import { SonidoService } from '@servicios/sonido.service';
import { TutorialServicio } from '@compartidos/componentes/tutorial/tutorial.servicio';
import { TutorialOverlay } from './tutorial-overlay';

const botones = (host: HTMLElement): HTMLButtonElement[] =>
  Array.from(host.querySelectorAll<HTMLButtonElement>('button'));

const botonConTexto = (host: HTMLElement, texto: string): HTMLButtonElement | undefined =>
  botones(host).find((boton) => boton.textContent?.trim() === texto);

describe('TutorialOverlay', () => {
  let servicio: TutorialServicio;
  let mockSonidos: { reproducir: jest.Mock };

  beforeEach(async () => {
    mockSonidos = { reproducir: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [TutorialOverlay],
      providers: [{ provide: SonidoService, useValue: mockSonidos }],
    }).compileComponents();
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

    expect(host.querySelector('#tutorial-titulo')?.textContent).toContain('Bienvenido');

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

  it('el overlay en vistaPrevia no reproduce sonidos', () => {
    const fixture = TestBed.createComponent(TutorialOverlay);
    fixture.componentRef.setInput('vistaPrevia', true);
    fixture.detectChanges();

    const comp = fixture.componentInstance as any;
    comp.sonar('pop');
    comp.sonar('ping');

    expect(mockSonidos.reproducir).not.toHaveBeenCalled();
  });

  it('poseJaime devuelve si cuando se cumple la espera y la pose del paso en los demás casos', () => {
    servicio.iniciar();
    const fixture = TestBed.createComponent(TutorialOverlay);
    fixture.detectChanges();

    // Paso 0: pose 'si'
    expect((fixture.componentInstance as any).poseJaime()).toBe('si');

    // Avanzar a paso 1 (cupones, sin pose específica -> 'senalando')
    servicio.siguiente();
    fixture.detectChanges();
    expect((fixture.componentInstance as any).poseJaime()).toBe('senalando');

    // Avanzar hasta paso 3 (costo y poder, con espera 'carta-vista')
    servicio.siguiente();
    servicio.siguiente();
    fixture.detectChanges();
    expect((fixture.componentInstance as any).poseJaime()).toBe('senalando');

    // Cumplir espera -> cambia a 'si'
    servicio.notificar('carta-vista');
    fixture.detectChanges();
    expect((fixture.componentInstance as any).poseJaime()).toBe('si');
  });

  it('mirarHacia determina izquierda o derecha según la posición del elemento', () => {
    const fixture = TestBed.createComponent(TutorialOverlay);
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;

    comp.posicion.set({ top: 100, left: 300, width: 200 }); // centro = 400

    // Elemento a la derecha (centro = 600)
    comp.mirarHacia({ left: 550, width: 100 } as DOMRect);
    expect(comp.mira()).toBe('derecha');

    // Elemento a la izquierda (centro = 100)
    comp.mirarHacia({ left: 50, width: 100 } as DOMRect);
    expect(comp.mira()).toBe('izquierda');
  });
  it('el ancla y el texto cambian cuando la acción del paso empieza', () => {
    servicio.iniciar();
    const fixture = TestBed.createComponent(TutorialOverlay);
    fixture.detectChanges();

    // Avanzar hasta paso 3 (Costo y poder)
    servicio.siguiente();
    servicio.siguiente();
    servicio.siguiente();
    fixture.detectChanges();

    const comp = fixture.componentInstance as any;
    expect(comp.anclaActual()).toBe('mano');
    expect(comp.textoActual()).toContain('Tocá una carta de tu mano');

    servicio.iniciarAccion();
    fixture.detectChanges();

    expect(comp.anclaActual()).toBe('carta-detalle');
    expect(comp.textoActual()).toContain('Fijate en los números');

    servicio.cancelarAccion();
    fixture.detectChanges();

    expect(comp.anclaActual()).toBe('mano');
  });

  it('unir() combina dos DOMRect en la caja envolvente mínima', () => {
    const fixture = TestBed.createComponent(TutorialOverlay);
    const comp = fixture.componentInstance as any;
    const a = { top: 10, left: 20, right: 100, bottom: 80 } as DOMRect;
    const b = { top: 5, left: 10, right: 150, bottom: 120 } as DOMRect;

    const unida = comp.unir(a, b);
    expect(unida.top).toBe(5);
    expect(unida.left).toBe(10);
    expect(unida.width).toBe(140);
    expect(unida.height).toBe(115);
  });
});
