import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { BonoDiarioMisiones } from '@modelos/misiones.model';
import { BarraBonoMisiones } from './barra-bono-misiones';

const crearBono = (parcial: Partial<BonoDiarioMisiones> = {}): BonoDiarioMisiones => ({
  totalRequeridas: 4,
  completadas: 1,
  disponible: false,
  reclamado: false,
  recompensa: {
    id: 10,
    nombre: 'Sobre Diario Bono',
    tipo: 'GENERAL',
    categoria: null,
    marca: null,
    logoUrl: null,
  },
  cantidadRecompensa: 1,
  ...parcial,
});

describe('BarraBonoMisiones', () => {
  let fixture: ComponentFixture<BarraBonoMisiones>;

  const montar = (
    bono: BonoDiarioMisiones | null,
    proximoReinicioUtc: string | null = null,
  ): HTMLElement => {
    fixture.componentRef.setInput('bono', bono);
    fixture.componentRef.setInput('proximoReinicioUtc', proximoReinicioUtc);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BarraBonoMisiones] });
    fixture = TestBed.createComponent(BarraBonoMisiones);
  });

  it('no renderiza nada cuando bono es null', () => {
    const el = montar(null);
    expect(el.textContent?.trim()).toBe('');
    expect(el.querySelector('[role="progressbar"]')).toBeNull();
  });

  it('divide la barra en totalRequeridas segmentos sin contenedor app-caja y muestra "Reclamar" cuando no está disponible', () => {
    const el = montar(crearBono({ completadas: 1, totalRequeridas: 4, disponible: false }));
    expect(el.querySelector('app-caja')).toBeNull();
    const barra = el.querySelector('[role="progressbar"]')!;
    const segmentos = barra.querySelectorAll('span[aria-hidden="true"]');
    expect(segmentos.length).toBe(4);
    expect(segmentos[0].className).toContain('bg-barra-mision-relleno');
    expect(segmentos[1].className).not.toContain('bg-barra-mision-relleno');
    expect(el.textContent).toContain('1/4');
    expect(el.textContent).toContain('Reclamar');
    expect(el.querySelector('app-sobre-marca button')).toBeNull();
  });

  it('incluye app-reinicio-misiones cuando hay fecha de reinicio', () => {
    const futuro = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const el = montar(crearBono(), futuro);
    expect(el.querySelector('app-reinicio-misiones')).not.toBeNull();
    expect(el.textContent).toContain('Se reinicia en');
  });

  it('emite reclamar al clickear el sobre cuando está disponible y activa latido', () => {
    let emitido = false;
    fixture.componentInstance.reclamar.subscribe(() => {
      emitido = true;
    });

    const el = montar(crearBono({ completadas: 4, totalRequeridas: 4, disponible: true }));
    expect(el.textContent).toContain('4/4');
    expect(el.textContent).toContain('Reclamar');
    expect(el.querySelector('.animate-latido-reclamo')).not.toBeNull();

    const boton = el.querySelector('app-sobre-marca button') as HTMLButtonElement;
    expect(boton).not.toBeNull();
    boton.click();
    expect(emitido).toBe(true);
  });

  it('muestra "Reclamado" y deshabilita el clic cuando ya se cobró', () => {
    const el = montar(
      crearBono({ completadas: 4, totalRequeridas: 4, disponible: false, reclamado: true }),
    );
    expect(el.textContent).toContain('Reclamado');
    expect(el.querySelector('app-sobre-marca button')).toBeNull();
  });
});
