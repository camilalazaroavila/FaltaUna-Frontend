import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import type { ProgresoPity } from '@modelos/misiones.model';
import { MisionesService } from '@servicios/mision.services';
import { MisionesPity } from './misiones-pity';

const PITY_MOCK: readonly ProgresoPity[] = [
  {
    tipo: 'GENERAL',
    contador: 20,
    umbral: 40,
    sobresRestantes: 20,
    garantizada: false,
  },
  {
    tipo: 'CATEGORIA',
    contador: 15,
    umbral: 20,
    sobresRestantes: 5,
    garantizada: false,
  },
  {
    tipo: 'MARCA',
    contador: 10,
    umbral: 10,
    sobresRestantes: 0,
    garantizada: true,
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
            cargandoPity: signal(false),
            errorPity: signal<string | null>(null),
            pity: signal(PITY_MOCK),
            cargarPity: () => of(PITY_MOCK),
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
    expect(el.querySelectorAll('app-tarjeta-pity').length).toBe(3);
  });

  it('el botón "¿Qué es el pity system?" usa app-boton con variante primaria', () => {
    const el = fixture.nativeElement as HTMLElement;
    const boton = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('¿Qué es el pity system?'),
    )!;
    expect(boton.hasAttribute('app-boton')).toBe(true);
    expect(boton.classList.contains('bg-btn-primario-bg')).toBe(true);
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
    const service = TestBed.inject(MisionesService) as unknown as { cargandoPity: { set: (v: boolean) => void } };
    service.cargandoPity.set(true);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-esqueleto-pity')).not.toBeNull();
    expect(el.textContent).toContain('Cargando PT System…');
  });
});
