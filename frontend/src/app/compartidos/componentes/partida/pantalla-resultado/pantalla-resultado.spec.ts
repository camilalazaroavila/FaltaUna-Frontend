import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PantallaResultado } from './pantalla-resultado';
import type { ResultadoPartidaApi, ResultadoRonda } from '@modelos/partida.model';

@Component({
  standalone: true,
  imports: [PantallaResultado],
  template: `
    <app-pantalla-resultado
      [resultado]="resultado()"
      [nombreJugador]="nombreJugador()"
      [nombreRival]="nombreRival()"
      [historialRondas]="historialRondas()"
      [ultimoResultado]="ultimoResultado()"
      [modoIncrustado]="modoIncrustado()"
      [expandidoInicial]="expandidoInicial()"
      (jugarOtraVez)="onJugarOtraVez()"
      (volverAlMenu)="onVolverAlMenu()"
    />
  `,
})
class TestHostComponent {
  resultado = signal<ResultadoPartidaApi | null>(null);
  nombreJugador = signal('Vos');
  nombreRival = signal('Bot');
  historialRondas = signal<readonly ResultadoRonda[]>([]);
  ultimoResultado = signal<ResultadoRonda | null>(null);
  modoIncrustado = signal(false);
  expandidoInicial = signal(false);
  reintentado = false;
  salido = false;

  onJugarOtraVez(): void {
    this.reintentado = true;
  }

  onVolverAlMenu(): void {
    this.salido = true;
  }
}

describe('PantallaResultado', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  it('debe crearse correctamente', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement).toBeTruthy();
  });

  it('no es modal: no tiene aria-modal, usa role="region" y aria-live="polite"', () => {
    fixture.detectChanges();

    const contenedor = fixture.debugElement.query(By.css('.pantalla-resultado-contenedor'));
    expect(contenedor).toBeTruthy();
    expect(contenedor.attributes['role']).toBe('region');
    expect(contenedor.attributes['aria-live']).toBe('polite');
    expect(contenedor.attributes['aria-modal']).toBeUndefined();
    expect(contenedor.classes['pantalla-resultado-contenedor--flotante']).toBe(true);
  });

  it('muestra estado neutral cuando el resultado es null o sin ganador reconocible', () => {
    host.resultado.set(null);
    fixture.detectChanges();

    const titulo = fixture.debugElement.query(By.css('#titulo-resultado')).nativeElement;
    expect(titulo.textContent).toContain('Partida finalizada');
  });

  it('muestra Victoria cuando el ganador es propio con sus puntos y motivo', () => {
    host.resultado.set({
      partidaId: 10,
      ganador: 'propio',
      motivo: 'cien-puntos',
      puntosPropio: 102,
      puntosRival: 84,
      fechaFin: '2026-10-25T12:00:00Z',
    });
    fixture.detectChanges();

    const titulo = fixture.debugElement.query(By.css('#titulo-resultado')).nativeElement;
    expect(titulo.textContent).toContain('¡Victoria!');

    const motivo = fixture.debugElement.query(By.css('#motivo-resultado')).nativeElement;
    expect(motivo.textContent).toContain('Se alcanzó el límite de 100 puntos.');

    const textoCompleto = fixture.nativeElement.textContent;
    expect(textoCompleto).toContain('102');
    expect(textoCompleto).toContain('84');
  });

  it('muestra Derrota cuando el ganador es rival por rendición', () => {
    host.resultado.set({
      partidaId: 10,
      ganador: 'rival',
      motivo: 'rendicion',
      puntosPropio: 20,
      puntosRival: 40,
      fechaFin: '2026-10-25T12:00:00Z',
    });
    fixture.detectChanges();

    const titulo = fixture.debugElement.query(By.css('#titulo-resultado')).nativeElement;
    expect(titulo.textContent).toContain('Derrota');

    const motivo = fixture.debugElement.query(By.css('#motivo-resultado')).nativeElement;
    expect(motivo.textContent).toContain('La partida terminó por rendición.');
  });

  it('muestra Empate cuando el ganador es empate por seis rondas', () => {
    host.resultado.set({
      partidaId: 10,
      ganador: 'empate',
      motivo: 'seis-rondas',
      puntosPropio: 50,
      puntosRival: 50,
      fechaFin: '2026-10-25T12:00:00Z',
    });
    fixture.detectChanges();

    const titulo = fixture.debugElement.query(By.css('#titulo-resultado')).nativeElement;
    expect(titulo.textContent).toContain('Empate');

    const motivo = fixture.debugElement.query(By.css('#motivo-resultado')).nativeElement;
    expect(motivo.textContent).toContain('Se completaron las 6 rondas reglamentarias.');
  });

  it('muestra motivo de abandono correctamente', () => {
    host.resultado.set({
      partidaId: 10,
      ganador: 'rival',
      motivo: 'desconexion',
      puntosPropio: 10,
      puntosRival: 30,
      fechaFin: null,
    });
    fixture.detectChanges();

    const motivo = fixture.debugElement.query(By.css('#motivo-resultado')).nativeElement;
    expect(motivo.textContent).toContain('La partida terminó por abandono.');
  });

  it('emite jugarOtraVez al hacer clic en "Jugar otra vez"', () => {
    fixture.detectChanges();
    const botones = fixture.debugElement.queryAll(By.css('button[app-boton]'));
    const botonJugar = botones.find((b) => b.nativeElement.textContent.includes('Jugar otra vez'));
    expect(botonJugar).toBeTruthy();

    botonJugar!.nativeElement.click();
    expect(host.reintentado).toBe(true);
  });

  it('emite volverAlMenu al hacer clic en "Volver al menú"', () => {
    fixture.detectChanges();
    const botones = fixture.debugElement.queryAll(By.css('button[app-boton]'));
    const botonMenu = botones.find((b) => b.nativeElement.textContent.includes('Volver al menú'));
    expect(botonMenu).toBeTruthy();

    botonMenu!.nativeElement.click();
    expect(host.salido).toBe(true);
  });

  describe('Estado compacto y expandido ("Ver por qué")', () => {
    const rondasMock: readonly ResultadoRonda[] = [
      {
        numero: 1,
        puntosPropio: 15,
        puntosRival: 10,
        ganador: 'propio',
        motivo: null,
        gane: true,
        terminada: false,
        zonas: [
          {
            zonaPartidaId: 1,
            nombreZona: 'Obelisco',
            propio: 14,
            rival: 8,
            puntosGanadosPropio: 15,
            puntosGanadosRival: 0,
            ganador: 'propio',
          },
        ],
        cartasReveladasRival: [
          { nombre: 'Dibu Martínez', poder: 8, nombreZona: 'Obelisco' },
        ],
      },
    ];

    it('arranca en modo compacto con el botón "Ver por qué" y sin desglose', () => {
      host.historialRondas.set(rondasMock);
      fixture.detectChanges();

      const botonAlternar = fixture.debugElement.query(By.css('.boton-alternar-detalle')).nativeElement;
      expect(botonAlternar.textContent).toContain('Ver por qué');
      expect(botonAlternar.getAttribute('aria-expanded')).toBe('false');

      const panelDetalle = fixture.debugElement.query(By.css('#panel-detalle-resultado'));
      expect(panelDetalle).toBeNull();
    });

    it('al pulsar "Ver por qué" se expande y muestra el desglose por ronda y zona', () => {
      host.historialRondas.set(rondasMock);
      fixture.detectChanges();

      const botonAlternar = fixture.debugElement.query(By.css('.boton-alternar-detalle')).nativeElement;
      botonAlternar.click();
      fixture.detectChanges();

      expect(botonAlternar.textContent).toContain('Ocultar por qué');
      expect(botonAlternar.getAttribute('aria-expanded')).toBe('true');

      const panelDetalle = fixture.debugElement.query(By.css('#panel-detalle-resultado'));
      expect(panelDetalle).toBeTruthy();
      expect(panelDetalle.nativeElement.textContent).toContain('Ronda 1');
      expect(panelDetalle.nativeElement.textContent).toContain('Obelisco');
      expect(panelDetalle.nativeElement.textContent).toContain('Dibu Martínez');
    });

    it('muestra mensaje informativo cuando no hay historial local tras recarga', () => {
      host.historialRondas.set([]);
      host.ultimoResultado.set(null);
      host.expandidoInicial.set(true);
      fixture.detectChanges();

      const panelDetalle = fixture.debugElement.query(By.css('#panel-detalle-resultado'));
      expect(panelDetalle).toBeTruthy();
      expect(panelDetalle.nativeElement.textContent).toContain(
        'Detalle ronda a ronda no disponible tras recargar la partida.',
      );
    });

    it('muestra el último resultado disponible si el historial está vacío', () => {
      host.historialRondas.set([]);
      host.ultimoResultado.set(rondasMock[0]);
      host.expandidoInicial.set(true);
      fixture.detectChanges();

      const panelDetalle = fixture.debugElement.query(By.css('#panel-detalle-resultado'));
      expect(panelDetalle).toBeTruthy();
      expect(panelDetalle.nativeElement.textContent).toContain('Ronda 1');
      expect(panelDetalle.nativeElement.textContent).toContain('Obelisco');
    });
  });

  describe('Fase heroica y celebración con confeti', () => {
    it('muestra el componente app-confeti en la plantilla', () => {
      fixture.detectChanges();
      const confetiEl = fixture.debugElement.query(By.css('app-confeti'));
      expect(confetiEl).toBeTruthy();
    });

    it('inicia en fase heroica destacada en modo flotante y se cierra al hacer clic', () => {
      host.resultado.set({
        partidaId: 1,
        ganador: 'propio',
        motivo: 'cien-puntos',
        puntosPropio: 100,
        puntosRival: 80,
        fechaFin: '2026-10-25T12:00:00Z',
      });
      fixture.detectChanges();

      const heroico = fixture.debugElement.query(By.css('.pantalla-resultado-heroica'));
      expect(heroico).toBeTruthy();

      // Clic para cerrar la fase heroica
      heroico.nativeElement.click();
      fixture.detectChanges();

      const heroicoCerrado = fixture.debugElement.query(By.css('.pantalla-resultado-heroica'));
      expect(heroicoCerrado).toBeNull();
    });
  });
});
