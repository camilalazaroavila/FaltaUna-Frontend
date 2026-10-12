import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { ProgresoPity } from '@modelos/misiones.model';
import { TarjetaPity } from './tarjeta-pity';

const crearProgreso = (parcial: Partial<ProgresoPity> = {}): ProgresoPity => ({
  id: 'generico',
  sobre: { tipo: 'generico' },
  abiertos: 30,
  umbral: 50,
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
    TestBed.configureTestingModule({ imports: [TarjetaPity] });
    fixture = TestBed.createComponent(TarjetaPity);
  });

  it('muestra cuántos sobres faltan para la legendaria', () => {
    const el = montar(crearProgreso({ abiertos: 30, umbral: 50 }));
    expect(el.textContent).toContain('Faltan 20 sobres para la legendaria');
  });

  it('usa el singular cuando falta exactamente un sobre', () => {
    const el = montar(crearProgreso({ abiertos: 9, umbral: 10 }));
    expect(el.textContent).toContain('Falta 1 sobre para la legendaria');
  });

  it('muestra un mensaje acorde cuando ya no falta ningún sobre', () => {
    const el = montar(crearProgreso({ abiertos: 60, umbral: 50 }));
    expect(el.textContent).toContain('¡Legendaria asegurada!');
    expect(el.textContent).not.toContain('Faltan 0');
  });

  it('nombra la legendaria de la marca cuando la fila ya está completa', () => {
    const el = montar(
      crearProgreso({
        abiertos: 10,
        umbral: 10,
        sobre: { tipo: 'marca', nombre: 'Grido', logoUrl: null },
      }),
    );
    expect(el.textContent).toContain('¡Legendaria de Grido asegurada!');
  });

  it('destaca las filas cercanas a la legendaria con "¡Casi!" y borde de acento', () => {
    const cercana = montar(crearProgreso({ abiertos: 8, umbral: 10 }));
    expect(cercana.textContent).toContain('¡Casi!');
    expect(cercana.querySelector('article')!.className).toContain('border-atencion');
  });

  it('no destaca las filas lejanas a la legendaria', () => {
    const lejana = montar(crearProgreso({ abiertos: 30, umbral: 50 }));
    expect(lejana.textContent).not.toContain('¡Casi!');
    expect(lejana.querySelector('article')!.className).not.toContain('border-atencion');
  });

  it('etiqueta el tipo de sobre sin repetir la palabra "sobres"', () => {
    const generico = montar(crearProgreso());
    expect(generico.querySelector('p')?.textContent).toContain('Generales');

    const categoria = montar(
      crearProgreso({ id: 'cat', sobre: { tipo: 'categoria', categoria: 'musica' } }),
    );
    expect(categoria.querySelector('p')?.textContent).toContain('Música');

    const marca = montar(
      crearProgreso({ id: 'marca', sobre: { tipo: 'marca', nombre: 'Grido', logoUrl: null } }),
    );
    expect(marca.querySelector('p')?.textContent).toContain('Grido');
  });

  it('renderiza el sobre como elemento informativo, sin botón', () => {
    const el = montar(crearProgreso());
    expect(el.querySelector('app-sobre-marca')).not.toBeNull();
    expect(el.querySelector('button')).toBeNull();
  });
});
