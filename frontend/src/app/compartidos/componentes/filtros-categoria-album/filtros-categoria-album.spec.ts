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

  const botonDisparador = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button[aria-haspopup="listbox"]')!;

  const opcionesBotones = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('ul[role="listbox"] button'));

  const montar = (categoriaActiva: number | null = null, abrirMenu = true): void => {
    fixture.componentRef.setInput('categorias', CATEGORIAS);
    fixture.componentRef.setInput('categoriaActiva', categoriaActiva);
    if (abrirMenu) {
      fixture.componentInstance.abrir();
    }
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FiltrosCategoriaAlbum],
      providers: [
        provideIcons({
          phosphorStackFill: ICONO,
          phosphorCaretDownFill: ICONO,
        }),
      ],
    });

    fixture = TestBed.createComponent(FiltrosCategoriaAlbum);
  });

  it('muestra el disparador cerrado inicialmente con texto Categorías', () => {
    montar(null, false);

    expect(botonDisparador().textContent?.trim()).toContain('Categorías');
    expect(opcionesBotones()).toHaveLength(0);
  });

  it('muestra "Todas" y solo las categorías que tienen icono al abrir', () => {
    montar();

    const textos = opcionesBotones().map((boton) => boton.textContent?.trim());
    expect(textos[0]).toBe('Todas');
    expect(textos).toContain('Gastronomía');
    expect(textos).toContain('Cosméticos');
    expect(textos).not.toContain('Desconocida');
    expect(opcionesBotones()).toHaveLength(3);
  });

  it('marca "Todas" como activa cuando no hay categoría elegida', () => {
    montar(null);

    expect(opcionesBotones()[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('muestra la categoría activa en el botón disparador', () => {
    montar(4, false);

    expect(botonDisparador().textContent?.trim()).toContain('Categoría: Gastronomía');
  });

  it('emite el id de la categoría al elegirla y cierra el menú', () => {
    const emitidos: (number | null)[] = [];
    fixture.componentInstance.cambiar.subscribe((id) => emitidos.push(id));
    montar();

    opcionesBotones()[1].click();
    fixture.detectChanges();

    expect(emitidos).toEqual([4]);
    expect(opcionesBotones()).toHaveLength(0);
  });

  it('emite null al elegir "Todas" y cierra el menú', () => {
    const emitidos: (number | null)[] = [];
    fixture.componentInstance.cambiar.subscribe((id) => emitidos.push(id));
    montar(4);

    opcionesBotones()[0].click();
    fixture.detectChanges();

    expect(emitidos).toEqual([null]);
    expect(opcionesBotones()).toHaveLength(0);
  });

  it('desactiva la categoría activa al volver a tocarla', () => {
    const emitidos: (number | null)[] = [];
    fixture.componentInstance.cambiar.subscribe((id) => emitidos.push(id));
    montar(4);

    expect(opcionesBotones()[1].getAttribute('aria-pressed')).toBe('true');
    opcionesBotones()[1].click();

    expect(emitidos).toEqual([null]);
  });
});
