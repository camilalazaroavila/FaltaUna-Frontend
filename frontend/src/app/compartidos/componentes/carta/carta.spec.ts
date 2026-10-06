import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { Carta, CategoriaCarta, RarezaCarta } from '../../../modelos/carta.model';
import { ESTRELLAS_POR_RAREZA } from '../../../modelos/carta.model';
import { CartaComponent } from './carta';

const cartaComun: Carta = {
  id: 'c-001',
  nombre: 'Danonino',
  imagenUrl: 'imagenes/grido.jpg',
  rareza: 'comun',
  categoria: 'gastronomia',
  atributoIzquierdo: 12,
  atributoDerecho: 8,
  obtenida: true,
};

const cartaLegendaria: Carta = {
  id: 'c-009',
  nombre: 'Coca-Cola Zero',
  imagenUrl: 'imagenes/cocacola.jpg',
  rareza: 'legendaria',
  categoria: 'gastronomia',
  atributoIzquierdo: 30,
  atributoDerecho: 32,
  obtenida: false,
};

const CATEGORIAS: readonly CategoriaCarta[] = [
  'gastronomia',
  'cosmeticos',
  'decoracion',
  'indumentaria',
  'entretenimiento',
  'musica',
  'tecnologia',
];

const RAREZAS: readonly RarezaCarta[] = ['comun', 'rara', 'epicarta', 'legendaria'];

@Component({
  standalone: true,
  imports: [CartaComponent],
  template: `
    <app-carta id="obtenida" [carta]="obtenida" />
    <app-carta id="bloqueada" [carta]="bloqueada" />
  `,
})
class TestHostComponent {
  readonly obtenida = cartaComun;
  readonly bloqueada = cartaLegendaria;
}

describe('CartaComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  const carta = (id: string) =>
    fixture.debugElement.query(By.css(`#${id}`)).nativeElement as HTMLElement;

  beforeAll(() => {
    const original = console.warn.bind(console);
    jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('sanitizing unsafe URL value')) {
        return;
      }
      original(...(args as []));
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, CartaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('debe renderizar fondo, imagen y los dos atributos con sus números', () => {
    const cartaEl = carta('obtenida');

    const fondo = cartaEl.querySelector<HTMLImageElement>('.carta__fondo');
    expect(fondo?.getAttribute('src')).toBeTruthy();

    const imagen = cartaEl.querySelector<HTMLImageElement>('.carta__imagen');
    expect(imagen?.getAttribute('src')).toBe('imagenes/grido.jpg');
    expect(imagen?.getAttribute('alt')).toBe('Danonino');

    const numeros = cartaEl.querySelectorAll('.carta__numero');
    expect(numeros.length).toBe(2);
    expect(numeros[0].textContent?.trim()).toBe('12');
    expect(numeros[1].textContent?.trim()).toBe('8');
  });

  it('debe ubicar los atributos en las esquinas superiores y el icono de categoría bajo el derecho', () => {
    const cartaEl = carta('obtenida');

    expect(cartaEl.querySelector('.carta__atributo--izq')).not.toBeNull();
    expect(cartaEl.querySelector('.carta__atributo--der')).not.toBeNull();
    expect(cartaEl.querySelector('.carta__categoria')).not.toBeNull();

    // CuadradoNumero (izq + der + categoría) e icono de categoría
    expect(
      cartaEl.querySelectorAll(
        '.carta__cuadrado, .carta__cuadrado-der, .carta__cuadrado--izq',
      ).length,
    ).toBe(3);
    const icono = cartaEl.querySelector<HTMLElement>('.carta__icono-categoria');
    expect(icono).not.toBeNull();
  });

  it('debe mostrar una estrella por unidad de rareza', () => {
    expect(ESTRELLAS_POR_RAREZA['comun']).toBe(1);

    const estrellas = carta('obtenida').querySelectorAll('.carta__estrella');
    expect(estrellas.length).toBe(ESTRELLAS_POR_RAREZA['comun']);
    expect((estrellas[0] as HTMLElement).getAttribute('src')).toBeTruthy();

    expect(carta('bloqueada').querySelectorAll('.carta__estrella').length).toBe(
      ESTRELLAS_POR_RAREZA['legendaria'],
    );
  });

  it('debe ocultar el nombre de la carta no obtenida y marcar el estado en el host', () => {
    const bloqueada = carta('bloqueada');

    expect(bloqueada.querySelector('.carta__nombre')?.textContent?.trim()).toBe('???');
    expect(bloqueada.classList.contains('carta--no-obtenida')).toBe(true);
    expect(bloqueada.classList.contains('carta--legendaria')).toBe(true);
    expect(bloqueada.getAttribute('role')).toBe('article');

    const obtenida = carta('obtenida');
    expect(obtenida.querySelector('.carta__nombre')?.textContent?.trim()).toBe('Danonino');
    expect(obtenida.classList.contains('carta--no-obtenida')).toBe(false);
  });

  it('debe describir la carta en el aria-label sin filtrar el nombre si no está obtenida', () => {
    expect(carta('obtenida').getAttribute('aria-label')).toBe(
      'Carta Danonino, Común, Gastronomía, obtenida',
    );
    expect(carta('bloqueada').getAttribute('aria-label')).toBe(
      'Carta no obtenida, Legendaria, Gastronomía',
    );
  });
});

describe('CartaComponent · mapeo de assets por rareza y categoría', () => {
  let fixture: ComponentFixture<CartaComponent>;

  const conCarta = (carta: Carta): CartaComponent => {
    fixture.componentRef.setInput('carta', carta);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CartaComponent);
    fixture.componentRef.setInput('carta', cartaComun);
    fixture.detectChanges();
  });

  it('debe asignar un fondo distinto a cada rareza', () => {
    const fondos = RAREZAS.map((rareza) => conCarta({ ...cartaComun, rareza })['urlFondo']());

    for (const fondo of fondos) {
      expect(fondo).toBeTruthy();
    }
    // Los cuatro fondos SVG son distintos entre sí
    expect(new Set(fondos).size).toBe(RAREZAS.length);
  });

  it('debe asignar un icono distinto a cada categoría', () => {
    const iconos = CATEGORIAS.map((categoria) => {
      conCarta({ ...cartaComun, categoria });
      const img = (fixture.nativeElement as HTMLElement).querySelector<HTMLImageElement>(
        '.carta__icono-categoria',
      );

      return img?.getAttribute('src');
    });

    for (const icono of iconos) {
      expect(icono).toBeTruthy();
    }
    expect(new Set(iconos).size).toBe(CATEGORIAS.length);
  });

  it('debe renderizar la cantidad de estrellas que corresponde a la rareza recibida', () => {
    for (const rareza of RAREZAS) {
      conCarta({ ...cartaComun, rareza });
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelectorAll('.carta__estrella').length).toBe(ESTRELLAS_POR_RAREZA[rareza]);
    }
  });
});
