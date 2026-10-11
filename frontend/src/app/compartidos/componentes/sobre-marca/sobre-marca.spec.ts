import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  SobreMarca,
  ETIQUETA_SOBRE_POR_DEFECTO,
  ZONA_LOGO,
  CAJA_ZONA_LOGO,
  calcularCajaLogo,
  construirTrazoPlaca,
} from './sobre-marca';
import { ETIQUETAS_CATEGORIA } from '../../../modelos/categoria.model';
import type { CategoriaSobre } from '../../../modelos/categoria.model';

interface MarcaDePrueba {
  readonly nombre: string;
  readonly logoUrl: string | null;
}

@Component({
  standalone: true,
  imports: [SobreMarca],
  template: `
    @for (marca of marcas(); track marca.nombre) {
      <app-sobre-marca
        [logoUrl]="marca.logoUrl"
        [nombre]="marca.nombre"
        [tamanio]="'md'"
      />
    }
  `,
})
class TestListaHost {
  readonly marcas = signal<readonly MarcaDePrueba[]>([
    { nombre: 'Coca-Cola', logoUrl: '/imagenes/cocacola.jpg' },
    { nombre: 'Google', logoUrl: '/imagenes/google.jpg' },
    { nombre: 'Sin logo', logoUrl: null },
  ]);
}

describe('SobreMarca', () => {
  let fixture: ComponentFixture<SobreMarca>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const svg = (): SVGElement => host().querySelector('svg') as SVGElement;
  const letras = (): SVGGElement | null => svg()?.querySelector('.sobre__letras');
  const imagen = (): SVGImageElement | null =>
    svg()?.querySelector('image') ?? null;
  const boton = (): HTMLButtonElement | null => host().querySelector('button');
  const controlVisual = (): HTMLElement | null =>
    host().querySelector('div[role="img"]');
  const iconoCategoria = (): SVGSVGElement | null =>
    svg()?.querySelector('svg.sobre__icono-marco') ?? null;

  /** Aplica inputs y renderiza, que es el "When" de todos los casos. */
  const renderizar = (
    inputs: Partial<{
      logoUrl: string | null;
      nombre: string | null;
      categoria: CategoriaSobre | null;
      variante: 'oscuro' | 'claro';
      tamanio: 'sm' | 'md' | 'lg';
      clickeable: boolean;
    }> = {},
  ): void => {
    fixture.componentRef.setInput('logoUrl', inputs.logoUrl ?? null);
    fixture.componentRef.setInput('nombre', inputs.nombre ?? null);
    fixture.componentRef.setInput('categoria', inputs.categoria ?? null);
    fixture.componentRef.setInput('variante', inputs.variante ?? 'oscuro');
    fixture.componentRef.setInput('tamanio', inputs.tamanio ?? 'md');
    fixture.componentRef.setInput('clickeable', inputs.clickeable ?? false);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SobreMarca, TestListaHost],
    }).compileComponents();

    fixture = TestBed.createComponent(SobreMarca);
  });

  it('Dado un sobre sin logo, Cuando se renderiza, Entonces muestra las letras "FALTA UNA" y ningun elemento de imagen', () => {
    // Given: la marca no paso logo.
    // When
    renderizar();

    // Then: las nueve siluetas del grafotipo original, y ningun <image>.
    expect(letras()).not.toBeNull();
    expect(letras()?.querySelectorAll('path').length).toBe(9);
    expect(imagen()).toBeNull();
  });

  it('Dado un sobre con URL de logo, Cuando se renderiza, Entonces muestra la imagen con esa URL y oculta las letras', () => {
    // Given
    const url = '/imagenes/lego.png';

    // When
    renderizar({ logoUrl: url });

    // Then
    expect(imagen()?.getAttribute('href')).toBe(url);
    // Las letras ocupan todo el frente: no pueden convivir con el logo.
    expect(letras()).toBeNull();
  });

  it('Dado un sobre con logo y nombre, Cuando se renderiza, Entonces el nombre se dibuja recortado y el aria-label lo incluye completo', () => {
    // Given: un nombre mas largo que el frente del sobre.
    const nombre = 'Complejo Deportivo Noroeste';

    // When
    renderizar({ logoUrl: '/imagenes/grido.jpg', nombre });

    // Then
    const texto = svg().querySelector('.sobre__nombre')?.textContent?.trim() ?? '';
    expect(texto).toBe('Complejo Deport…');
    // El nombre completo nunca se pierde: vive en el nombre accesible.
    expect(controlVisual()?.getAttribute('aria-label')).toBe(`Sobre de ${nombre}`);
  });

  it('Dado un sobre sin nombre, Cuando se renderiza, Entonces el aria-label usa el texto por defecto', () => {
    // Given / When
    renderizar({ logoUrl: '/imagenes/sony.png' });

    // Then
    expect(controlVisual()?.getAttribute('aria-label')).toBe(ETIQUETA_SOBRE_POR_DEFECTO);
    expect(svg().querySelector('.sobre__nombre')).toBeNull();
  });

  it('Dado cada variante de color, Cuando se renderiza, Entonces se aplica su modificador y no el de la otra', () => {
    // Given / When: la variante oscura.
    renderizar({ variante: 'oscuro' });

    // Then
    expect(host().classList.contains('sobre-marca--oscuro')).toBe(true);
    expect(host().classList.contains('sobre-marca--claro')).toBe(false);

    // When: la variante clara.
    renderizar({ variante: 'claro' });

    // Then
    expect(host().classList.contains('sobre-marca--claro')).toBe(true);
    expect(host().classList.contains('sobre-marca--oscuro')).toBe(false);
  });

  it('Dado cada tamaño disponible, Cuando se renderiza, Entonces el control toma el ancho correspondiente', () => {
    for (const [tamanio, ancho] of [
      ['sm', 'w-20'],
      ['md', 'w-28'],
      ['lg', 'w-44'],
    ] as const) {
      // Given / When
      renderizar({ tamanio });

      // Then: el SVG escala por `viewBox`, asi que el ancho es lo unico que cambia.
      expect(controlVisual()?.classList.contains(ancho)).toBe(true);
    }
  });

  it('Dado un sobre clickeable, Cuando se renderiza, Entonces el control es un boton nativo que el teclado ya puede operar', () => {
    // Given / When
    renderizar({ clickeable: true });

    // Then: `<button type="button">` real, sin tabindex que lo saque del recorrido.
    const control = boton();
    expect(control).not.toBeNull();
    expect(control?.tagName).toBe('BUTTON');
    expect(control?.getAttribute('type')).toBe('button');
    expect(control?.getAttribute('tabindex')).toBeNull();
    expect(control?.getAttribute('aria-label')).toBe(ETIQUETA_SOBRE_POR_DEFECTO);
  });

  it('Given un sobre clickeable, When el usuario hace click, Then emite la accion una sola vez', () => {
    // Given
    const emissions: number[] = [];
    fixture.componentInstance.accion.subscribe(() => emissions.push(1));
    renderizar({ clickeable: true, nombre: 'Grido' });

    // When
    boton()?.click();

    // Then
    expect(emissions).toHaveLength(1);
  });

  it('Dado un sobre no clickeable, Cuando el usuario hace click, Entonces no emite nada y no se expone como boton', () => {
    // Given
    const emissions: number[] = [];
    fixture.componentInstance.accion.subscribe(() => emissions.push(1));
    renderizar({ clickeable: false });

    // When
    controlVisual()?.click();

    // Then: pieza visual, no control.
    expect(emissions).toHaveLength(0);
    expect(boton()).toBeNull();
    expect(controlVisual()?.tagName).toBe('DIV');
    expect(controlVisual()?.getAttribute('tabindex')).toBeNull();
  });

  it('Dado un logo que falla al cargar, Cuando ocurre el error de carga, Entonces se muestra el fallback con las letras', () => {
    // Given: un logo en vuelo.
    renderizar({ logoUrl: '/imagenes/roto.png', nombre: 'Marca rota' });
    const elemento = imagen();
    expect(elemento).not.toBeNull();

    // When: la URL no resuelve.
    elemento?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    // Then: cae al envoltorio generico en vez de dejar el recuadro vacio.
    expect(imagen()).toBeNull();
    expect(letras()).not.toBeNull();
    // El nombre de la marca sigue accesible aunque no se dibuje.
    expect(controlVisual()?.getAttribute('aria-label')).toBe('Sobre de Marca rota');
  });

  it('Dado un logo que fallo, Cuando el padre cambia la URL, Entonces el sobre vuelve a intentar la carga', () => {
    // Given: una URL que ya fallo.
    renderizar({ logoUrl: '/imagenes/roto.png' });
    imagen()?.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(imagen()).toBeNull();

    // When: el padre reutiliza la instancia para otra marca (el caso de un `@for`).
    renderizar({ logoUrl: '/imagenes/lego.png' });

    // Then: el error anterior no queda pegado a la instancia.
    expect(imagen()?.getAttribute('href')).toBe('/imagenes/lego.png');
    expect(letras()).toBeNull();
  });

  it('Dado un logo que termina de cargar, Cuando ocurre el evento load, Entonces el logo deja de estar oculto', () => {
    // Given: en vuelo, el logo todavia no se pinta.
    renderizar({ logoUrl: '/imagenes/lego.png' });
    expect(imagen()?.classList.contains('sobre__logo--oculto')).toBe(true);

    // When
    imagen()?.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    // Then
    expect(imagen()?.classList.contains('sobre__logo--oculto')).toBe(false);
  });

  it('Dado un sobre sin props, Cuando se renderiza por primera vez, Entonces la variante por defecto es la verde de Paquete1', () => {
    // Given: el padre no pasa ninguna prop, asi que aplica el valor por defecto.
    // When
    fixture.detectChanges();

    // Then: Paquete1 (cuerpo verde, detalle crema) es la principal.
    expect(host().classList.contains('sobre-marca--oscuro')).toBe(true);
    expect(host().classList.contains('sobre-marca--claro')).toBe(false);
  });

  it('Dado un sobre con logo, Cuando se renderiza, Entonces la placa es un path con borde cartoon y sombra solida', () => {
    // Given / When
    renderizar({ logoUrl: '/imagenes/lego.png' });

    // Then: no hay circulo, la placa es una silueta irregular y su sombra
    // desplazada es una copia solida de la misma silueta.
    expect(svg().querySelectorAll('circle').length).toBe(0);

    const placa = svg().querySelector('.sobre__placa--marca');
    expect(placa?.tagName.toLowerCase()).toBe('path');
    expect(placa?.getAttribute('d')).toBeTruthy();

    const sombra = svg().querySelector('.sobre__placa-sombra');
    expect(sombra).not.toBeNull();
    expect(sombra?.tagName.toLowerCase()).toBe('path');
    expect(sombra?.getAttribute('transform')).toContain('translate(9 9)');
  });

  it('Dado un sobre con logo, Cuando se renderiza, Entonces el logo se recorta con la misma silueta de la placa', () => {
    // Given / When
    renderizar({ logoUrl: '/imagenes/cocacola.jpg' });

    // Then: el recorte apunta a un <clipPath> propio y su path es el mismo
    // que pinta la placa, asi el logo no puede asomar por los cortes.
    const referencia = imagen()?.getAttribute('clip-path') ?? '';
    const id = referencia.match(/^url\(#(.+)\)$/)?.[1];
    expect(id).toBeTruthy();

    const clip = svg().querySelector('clipPath');
    expect(clip?.getAttribute('id')).toBe(id);

    const recorte = clip?.querySelector('path');
    const placa = svg().querySelector('.sobre__placa--marca');
    expect(recorte?.getAttribute('d')).toBe(placa?.getAttribute('d'));
  });

  it('Dado un logo horizontal, Cuando mide su proporcion, Entonces la caja y el trazo usan esa proporcion y no la cuadrada', () => {
    // Given: la proporcion medida de un logo apaisado (1,66:1).
    const caja = calcularCajaLogo(1.66);

    // Then: entrada y salida usan el ancho maximo, el alto sale de la proporcion
    // y la silueta hereda esa caja.
    expect(caja.ancho).toBeCloseTo(ZONA_LOGO.ancho, 5);
    expect(caja.alto).toBeCloseTo(ZONA_LOGO.ancho / 1.66, 5);
    expect(caja.alto).toBeLessThanOrEqual(ZONA_LOGO.alto);

    const trazo = construirTrazoPlaca(caja);
    expect(trazo.endsWith('Z')).toBe(true);
    expect(trazo).toContain(`${caja.x + caja.ancho}`);
  });

  it('Dado un logo vertical, Cuando mide su proporcion, Entonces la caja ocupa el alto maximo y centra el ancho', () => {
    // Given: la proporcion medida de un logo vertical (0,2:1).
    const caja = calcularCajaLogo(0.2);

    // Then
    expect(caja.alto).toBeCloseTo(ZONA_LOGO.alto, 5);
    expect(caja.ancho).toBeCloseTo(ZONA_LOGO.alto * 0.2, 5);
    expect(caja.x + caja.ancho / 2).toBeCloseTo(ZONA_LOGO.centroX, 5);
    expect(caja.y + caja.alto / 2).toBeCloseTo(ZONA_LOGO.centroY, 5);
  });

  describe('construirTrazoPlaca', () => {
    it('Dada una caja, Genera una silueta cerrada con cortes en las cuatro esquinas', () => {
      // Given / When
      const d = construirTrazoPlaca(CAJA_ZONA_LOGO);

      // Then: empieza en el borde superior, tiene arcos para las esquinas y
      // cierra sobre el inicio.
      expect(d.startsWith('M ')).toBe(true);
      expect(d.endsWith('Z')).toBe(true);
      expect(d).toContain(' A ');
    });

    it('Dadas proporciones distintas, Genera siluetas distintas pero siempre finitas', () => {
      // Given / When
      const apaisado = construirTrazoPlaca(calcularCajaLogo(1.66));
      const cuadrado = construirTrazoPlaca(calcularCajaLogo(1));
      const vertical = construirTrazoPlaca(calcularCajaLogo(0.2));

      // Then: ninguna cae en valores invalidos y no son identicas entre si.
      for (const trazo of [apaisado, cuadrado, vertical]) {
        expect(trazo).not.toMatch(/NaN|Infinity/);
      }
      expect(apaisado).not.toBe(cuadrado);
      expect(cuadrado).not.toBe(vertical);
    });
  });

  describe('sobre de categoria', () => {
    it('Dado un sobre con categoria, Cuando se renderiza, Entonces no hay placa, sombra ni recorte de placa', () => {
      // Given / When
      renderizar({ categoria: 'tecnologia' });

      // Then: el icono va directo sobre el cuerpo; nada de la placa de marca.
      expect(host().classList.contains('sobre-marca--categoria')).toBe(true);
      expect(svg().querySelector('.sobre__placa--marca')).toBeNull();
      expect(svg().querySelector('.sobre__placa-sombra')).toBeNull();
      expect(svg().querySelector('clipPath')).toBeNull();
      expect(svg().querySelectorAll('.sobre__icono').length).toBeGreaterThan(0);
    });

    it('Dado un sobre con categoria, Cuando se renderiza, Entonces el icono ocupa la zona central completa con meet', () => {
      // Given / When
      renderizar({ categoria: 'cosmetica' });

      // Then: el marco del icono es exactamente la zona que dejo la placa.
      const marco = iconoCategoria();
      expect(marco).not.toBeNull();
      expect(marco?.getAttribute('x')).toBe(String(CAJA_ZONA_LOGO.x));
      expect(marco?.getAttribute('y')).toBe(String(CAJA_ZONA_LOGO.y));
      expect(marco?.getAttribute('width')).toBe(String(CAJA_ZONA_LOGO.ancho));
      expect(marco?.getAttribute('height')).toBe(String(CAJA_ZONA_LOGO.alto));
      expect(marco?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    });

    it('Dado un sobre con categoria, Cuando se renderiza, Entonces el nombre visible es la etiqueta de la categoria', () => {
      // Given / When
      renderizar({ categoria: 'musica' });

      // Then
      expect(svg().querySelector('.sobre__nombre')?.textContent?.trim()).toBe(
        ETIQUETAS_CATEGORIA['musica'],
      );
      expect(controlVisual()?.getAttribute('aria-label')).toBe(
        `Sobre de ${ETIQUETAS_CATEGORIA['musica']}`,
      );
    });

    it('Dado un sobre con categoria, Cuando cambia la variante, Entonces sigue siendo categoria y no reusa la placa', () => {
      // Given / When: la variante clara no debe tocar la rama amarilla.
      renderizar({ categoria: 'gastronomia', variante: 'claro' });

      // Then
      expect(host().classList.contains('sobre-marca--categoria')).toBe(true);
      expect(svg().querySelector('.sobre__placa--marca')).toBeNull();
    });
  });

  describe('dentro de un listado', () => {
    it('Dado varios sobres en pantalla, Cuando se renderizan, Entonces cada recorte tiene su propio id', () => {
      // Given: tres sobres en la misma pantalla.
      const lista = TestBed.createComponent(TestListaHost);
      lista.detectChanges();

      // Then: los ids no se repiten y solo los sobres con logo declararon uno.
      const ids = Array.from(
        (lista.nativeElement as HTMLElement).querySelectorAll('clipPath'),
      ).map((clip) => clip.getAttribute('id') ?? '');

      expect(ids).toHaveLength(2);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.every((id) => id.startsWith('sobre-marca-placa-'))).toBe(true);

      lista.destroy();
    });
  });
});