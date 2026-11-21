import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import type { ProgresoPity } from '@modelos/misiones.model';
import { MisionesService } from '@servicios/mision.services';
import { MisionesPity } from './misiones-pity';

const PITY_MOCK: readonly ProgresoPity[] = [
  {
    id: 1,
    sobre: { tipo: 'generico' },
    abiertos: 7,
    meta: 10,
  },
  {
    id: 2,
    sobre: { tipo: 'categoria', categoria: 'gastronomia' },
    abiertos: 3,
    meta: 10,
  },
];

describe('MisionesPity', () => {
  let fixture: ComponentFixture<MisionesPity>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MisionesPity],
      providers: [
        provideRouter([]),
        {
          provide: MisionesService,
          useValue: {
            cargando: signal(false),
            error: signal<string | null>(null),
            pity: signal(PITY_MOCK),
            cargarMisiones: () => of(void 0),
          },
        },
      ],
    });
    fixture = TestBed.createComponent(MisionesPity);
    fixture.detectChanges();
  });

  it('renderiza el h1 PT SYSTEM, enlace Volver a /usuario/misiones y las tarjetas pity', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('PT SYSTEM');
    expect(el.querySelector('a[href="/usuario/misiones"]')).not.toBeNull();
    expect(el.querySelectorAll('app-tarjeta-pity').length).toBe(2);
  });

  it('abre y cierra el modal explicativo del Pity System', () => {
    const el = fixture.nativeElement as HTMLElement;
    const boton = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('¿Qué es el pity system?'),
    )!;
    boton.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).not.toBeNull();

    const cerrar = el.querySelector('[aria-label="Cerrar modal"]') as HTMLButtonElement;
    cerrar.click();
    fixture.detectChanges();
    expect(el.querySelector('[role="dialog"]')).toBeNull();
  });

  it('muestra app-esqueleto-pity mientras carga', () => {
    const service = TestBed.inject(MisionesService) as unknown as { cargando: { set: (v: boolean) => void } };
    service.cargando.set(true);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-esqueleto-pity')).not.toBeNull();
    expect(el.textContent).toContain('Cargando PT System…');
  });
});

