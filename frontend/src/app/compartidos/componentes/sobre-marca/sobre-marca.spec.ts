import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SobreMarca, ETIQUETA_SOBRE_POR_DEFECTO } from './sobre-marca';

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

  /** Aplica inputs y renderiza, que es el "When" de todos los casos. */
  const renderizar = (
    inputs: Partial<{
      logoUrl: string | null;
      nombre: string | null;
      variante: 'oscuro' | 'claro';
      tamanio: 'sm' | 'md' | 'lg';
      clickeable: boolean;
    }> = {},
  ): void => {
    fixture.componentRef.setInput('logoUrl', inputs.logoUrl ?? null);
    fixture.componentRef.setInput('nombre', inputs.nombre ?? null);
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

  it('Dado un sobre con logo, Cuando se renderiza, Entonces la placa es un rectángulo redondeado y no un círculo', () => {
    // Given / When
    renderizar({ logoUrl: '/imagenes/lego.png' });

    // Then: el sello circular quedo reemplazado por una etiqueta de esquinas
    // redondeadas, que es lo que evita el aspecto de sticker pegado.
    expect(svg().querySelectorAll('circle').length).toBe(0);

    const placa = svg().querySelector('.sobre__placa');
    expect(placa?.tagName.toLowerCase()).toBe('rect');
    expect(Number(placa?.getAttribute('rx'))).toBeGreaterThan(0);
  });

  it('Dado un sobre con logo, Cuando se renderiza, Entonces el logo se recorta con las mismas esquinas de la placa', () => {
    // Given / When
    renderizar({ logoUrl: '/imagenes/cocacola.jpg' });

    // Then: el recorte apunta a un <clipPath> propio, y su rect es el mismo
    // rectángulo que la placa: asi el logo no puede asomar por las esquinas.
    const referencia = imagen()?.getAttribute('clip-path') ?? '';
    const id = referencia.match(/^url\(#(.+)\)$/)?.[1];
    expect(id).toBeTruthy();

    const clip = svg().querySelector('clipPath');
    expect(clip?.getAttribute('id')).toBe(id);

    const recorte = clip?.querySelector('rect');
    const placa = svg().querySelector('.sobre__placa');
    expect(recorte?.getAttribute('width')).toBe(placa?.getAttribute('width'));
    expect(recorte?.getAttribute('height')).toBe(placa?.getAttribute('height'));
    expect(recorte?.getAttribute('rx')).toBe(placa?.getAttribute('rx'));
    expect(Number(recorte?.getAttribute('rx'))).toBeGreaterThan(0);
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