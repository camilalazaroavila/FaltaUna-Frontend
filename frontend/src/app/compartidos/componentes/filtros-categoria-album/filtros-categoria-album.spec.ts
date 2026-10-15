import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideIcons } from '@ng-icons/core';

import { FiltrosCategoriaAlbum } from './filtros-categoria-album';
import type { CategoriaAlbum } from '@modelos/album-jugador.model';

const ICONO = '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"/></svg>';

const CATEGORIAS: readonly CategoriaAlbum[] = [
  { id: 4, nombre: 'Gastronomía', categoria: 'gastronomia' },
  { id: 7, nombre: 'Desconocida', categoria: null },
  { id: 2, nombre: 'Cosméticos', categoria: 'cosmeticos' },
];

describe('FiltrosCategoriaAlbum', () => {
  let fixture: ComponentFixture<FiltrosCategoriaAlbum>;

  const botones = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('button'));

  const montar = (categoriaActiva: number | null = null): void => {
    fixture.componentRef.setInput('categorias', CATEGORIAS);
    fixture.componentRef.setInput('categoriaActiva', categoriaActiva);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FiltrosCategoriaAlbum],
      providers: [provideIcons({ phosphorStackFill: ICONO })],
    });

    fixture = TestBed.createComponent(FiltrosCategoriaAlbum);
  });

  it('muestra "Todas" y solo las categorías que tienen icono', () => {
    montar();

    const textos = botones().map((boton) => boton.textContent?.trim());
    expect(textos[0]).toBe('Todas');
    expect(textos).toContain('Gastronomía');
    expect(textos).toContain('Cosméticos');
    expect(textos).not.toContain('Desconocida');
    expect(botones()).toHaveLength(3);
  });

  it('el icono de "Todas" tiene su propio ajuste de tamaño, igual que las categorías', () => {
    montar();

    const iconoTodas = botones()[0].querySelector('ng-icon')!;
    const iconoCategoria = botones()[1].querySelector('app-icono-categoria')!;
    const cajaCategoria = iconoCategoria.parentElement!;

    expect(iconoTodas.className).toContain('icono-todas');
    expect(cajaCategoria.className).toContain('size-6');
  });

  it('marca "Todas" como activa cuando no hay categoría elegida', () => {
    montar(null);

    expect(botones()[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('emite el id de la categoría al elegirla', () => {
    const emitidos: (number | null)[] = [];
    fixture.componentInstance.cambiar.subscribe((id) => emitidos.push(id));
    montar();

    botones()[1].click();

    expect(emitidos).toEqual([4]);
  });

  it('emite null al elegir "Todas"', () => {
    const emitidos: (number | null)[] = [];
    fixture.componentInstance.cambiar.subscribe((id) => emitidos.push(id));
    montar(4);

    botones()[0].click();

    expect(emitidos).toEqual([null]);
  });

  it('desactiva la categoría activa al volver a tocarla', () => {
    const emitidos: (number | null)[] = [];
    fixture.componentInstance.cambiar.subscribe((id) => emitidos.push(id));
    montar(4);

    expect(botones()[1].getAttribute('aria-pressed')).toBe('true');
    botones()[1].click();

    expect(emitidos).toEqual([null]);
  });
});
