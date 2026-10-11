import { ComponentFixture, TestBed } from '@angular/core/testing';

import type { ProgresoPity } from '../../../modelos/misiones.model';
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

  it('nunca muestra faltantes negativos', () => {
    const el = montar(crearProgreso({ abiertos: 60, umbral: 50 }));
    expect(el.textContent).toContain('Faltan 0 sobres para la legendaria');
  });

  it('etiqueta el sobre según su tipo', () => {
    const generico = montar(crearProgreso());
    expect(generico.textContent).toContain('Sobres generales');

    const categoria = montar(
      crearProgreso({ id: 'cat', sobre: { tipo: 'categoria', categoria: 'musica' } }),
    );
    expect(categoria.textContent).toContain('Sobres de Música');

    const marca = montar(
      crearProgreso({ id: 'marca', sobre: { tipo: 'marca', nombre: 'Grido', logoUrl: null } }),
    );
    expect(marca.textContent).toContain('Sobres de Grido');
  });

  it('renderiza el sobre como elemento informativo, sin botón', () => {
    const el = montar(crearProgreso());
    expect(el.querySelector('app-sobre-marca')).not.toBeNull();
    expect(el.querySelector('button')).toBeNull();
  });
});
