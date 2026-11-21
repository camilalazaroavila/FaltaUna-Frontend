import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { ProgresoPity } from '@modelos/misiones.model';
import { TarjetaPity } from './tarjeta-pity';

const crearProgreso = (parcial: Partial<ProgresoPity> = {}): ProgresoPity => ({
  tipo: 'GENERAL',
  contador: 30,
  umbral: 40,
  sobresRestantes: 10,
  garantizada: false,
  ...parcial,
});

describe('TarjetaPity', () => {
  let fixture: ComponentFixture<TarjetaPity>;

  const montar = (progreso: ProgresoPity): HTMLElement => {
    fixture.componentRef.setInput('progreso', progreso);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TarjetaPity],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(TarjetaPity);
  });

  it('aplica la sombra cartoon clara en los 3 estados (en progreso, cerca y garantizada)', () => {
    const progreso = montar(crearProgreso({ contador: 10, umbral: 40, sobresRestantes: 30, garantizada: false }));
    expect(progreso.querySelector('article')!.classList.contains('shadow-cartoon-clara')).toBe(true);

    const cerca = montar(crearProgreso({ tipo: 'CATEGORIA', contador: 18, umbral: 20, sobresRestantes: 2, garantizada: false }));
    expect(cerca.querySelector('article')!.classList.contains('shadow-cartoon-clara')).toBe(true);

    const garantizada = montar(crearProgreso({ tipo: 'MARCA', contador: 10, umbral: 10, sobresRestantes: 0, garantizada: true }));
    expect(garantizada.querySelector('article')!.classList.contains('shadow-cartoon-clara')).toBe(true);
    expect(garantizada.querySelector('article')!.classList.contains('border-pity-garantizada-borde')).toBe(true);
    expect(garantizada.querySelector('article')!.classList.contains('ring-pity-garantizada-aro')).toBe(true);
  });

  it('muestra cuántos sobres faltan para la legendaria asegurada', () => {
    const el = montar(crearProgreso({ contador: 20, umbral: 40, sobresRestantes: 20 }));
    expect(el.textContent).toContain('Faltan 20 sobres para la legendaria asegurada');
  });

  it('usa el singular cuando falta exactamente un sobre', () => {
    const el = montar(crearProgreso({ contador: 39, umbral: 40, sobresRestantes: 1 }));
    expect(el.textContent).toContain('Falta 1 sobre para la legendaria asegurada');
  });

  it('muestra mensaje garantizado cuando el backend confirma garantizada=true', () => {
    const el = montar(crearProgreso({ contador: 40, umbral: 40, sobresRestantes: 0, garantizada: true }));
    expect(el.textContent).toContain('¡Tu próximo sobre trae una legendaria!');
  });

  it('incluye el botón de abrir sobre apagado sin icono en los 3 estados', () => {
    const elProgreso = montar(crearProgreso({ tipo: 'GENERAL', contador: 15, umbral: 40, sobresRestantes: 25, garantizada: false }));
    const botonProgreso = elProgreso.querySelector('button[app-boton]') as HTMLButtonElement;
    expect(botonProgreso).not.toBeNull();
    expect(botonProgreso.disabled).toBe(true);
    expect(botonProgreso.getAttribute('aria-disabled')).toBe('true');
    expect(botonProgreso.textContent).toContain('Abrir sobre general');
    expect(botonProgreso.querySelector('svg')).toBeNull();

    const elGarantizada = montar(crearProgreso({ tipo: 'MARCA', contador: 10, umbral: 10, sobresRestantes: 0, garantizada: true }));
    const botonGarantizada = elGarantizada.querySelector('button[app-boton]') as HTMLButtonElement;
    expect(botonGarantizada.disabled).toBe(true);
    expect(botonGarantizada.getAttribute('aria-disabled')).toBe('true');
    expect(botonGarantizada.textContent).toContain('Abrir sobre de marca');
    expect(botonGarantizada.querySelector('svg')).toBeNull();
  });

  it('asocia una descripción accesible neutral para lector de pantalla al botón apagado', () => {
    const el = montar(crearProgreso({ tipo: 'CATEGORIA', contador: 18, umbral: 20, sobresRestantes: 2 }));
    const boton = el.querySelector('button[app-boton]') as HTMLButtonElement;
    const descId = boton.getAttribute('aria-describedby');
    expect(descId).toBe('desc-boton-pity-CATEGORIA');
    const descEl = el.querySelector(`#${descId}`);
    expect(descEl).not.toBeNull();
    expect(descEl?.textContent).toContain('no disponible por el momento en esta vista');
  });

  it('destaca las filas cercanas a la garantía con "¡Casi!" y borde de atención', () => {
    const cercana = montar(crearProgreso({ tipo: 'MARCA', contador: 8, umbral: 10, sobresRestantes: 2, garantizada: false }));
    expect(cercana.textContent).toContain('¡Casi!');
    expect(cercana.querySelector('article')!.className).toContain('border-atencion-borde');
  });

  it('no destaca las filas lejanas a la garantía', () => {
    const lejana = montar(crearProgreso({ contador: 10, umbral: 40, sobresRestantes: 30, garantizada: false }));
    expect(lejana.textContent).not.toContain('¡Casi!');
    expect(lejana.querySelector('article')!.className).not.toContain('border-atencion-borde');
  });

  it('etiqueta el tipo de sobre como General, Categoría y Marca', () => {
    const general = montar(crearProgreso({ tipo: 'GENERAL' }));
    expect(general.textContent).toContain('General');

    const categoria = montar(crearProgreso({ tipo: 'CATEGORIA' }));
    expect(categoria.textContent).toContain('Categoría');

    const marca = montar(crearProgreso({ tipo: 'MARCA' }));
    expect(marca.textContent).toContain('Marca');
  });

  it('los sobres de pity no son clickeables (no renderizan botones interactivos)', () => {
    const general = montar(crearProgreso({ tipo: 'GENERAL' }));
    expect(general.querySelector('.tarjeta-pity__sobre-aura button')).toBeNull();

    const categoria = montar(crearProgreso({ tipo: 'CATEGORIA' }));
    expect(categoria.querySelector('.tarjeta-pity__sobre-aura button')).toBeNull();

    const marca = montar(crearProgreso({ tipo: 'MARCA' }));
    expect(marca.querySelector('.tarjeta-pity__sobre-aura button')).toBeNull();
  });

  it('despliega un abanico de 3 sobres para categoría y marca, y uno solo para general', () => {
    const general = montar(crearProgreso({ tipo: 'GENERAL' }));
    expect(general.querySelectorAll('app-sobre-marca').length).toBe(1);
    expect(general.querySelector('.tarjeta-pity__abanico')).toBeNull();

    const categoria = montar(crearProgreso({ tipo: 'CATEGORIA' }));
    expect(categoria.querySelectorAll('app-sobre-marca').length).toBe(3);
    expect(categoria.querySelector('.tarjeta-pity__abanico')).not.toBeNull();

    const marca = montar(crearProgreso({ tipo: 'MARCA' }));
    expect(marca.querySelectorAll('app-sobre-marca').length).toBe(3);
    expect(marca.querySelector('.tarjeta-pity__abanico')).not.toBeNull();
  });
});
