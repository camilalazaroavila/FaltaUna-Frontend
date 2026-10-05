import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CATEGORIAS_SOBRE } from '../../../modelos/categoria.model';
import type { CategoriaSobre } from '../../../modelos/categoria.model';
import { ICONOS_CATEGORIA } from './iconos-categoria';
import { SobreMarca, ETIQUETA_SOBRE_POR_DEFECTO } from './sobre-marca';
import type { TamanioSobreMarca } from './sobre-marca';

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
    { nombre: 'Coca-Cola', logoUrl: 'imagenes/cocacola.jpg' },
    { nombre: 'Google', logoUrl: 'imagenes/google.jpg' },
    { nombre: 'Sin logo', logoUrl: null },
  ]);
}

/** Dos sobres clickeables con icono, para verificar que los `id` no se pisan. */
@Component({
  standalone: true,
  imports: [SobreMarca],
  template: `
    <app-sobre-marca [categoria]="'tecnologia'" [tamanio]="'md'" [clickeable]="true" />
    <app-sobre-marca [categoria]="'musica'" [tamanio]="'md'" [clickeable]="true" />
  `,
})
class TestIconosHost {}

describe('SobreMarca', () => {
  let fixture: ComponentFixture<SobreMarca>;

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const svg = (): SVGElement => host().querySelector('svg') as SVGElement;
  const letras = (): SVGGElement | null => svg()?.querySelector('.sobre__letras');
  const imagen = (): SVGImageElement | null =>
    svg()?.querySelector('image') ?? null;
  const grupoIcono = (): SVGGElement | null =>
    svg()?.querySelector('.sobre__icono') ?? null;
  const placa = (): SVGRectElement | null => svg()?.querySelector('.sobre__placa') ?? null;
  const boton = (): HTMLButtonElement | null => host().querySelector('button');
  const controlVisual = (): HTMLElement | null =>
    host().querySelector('div[role="img"]');

  /** Aplica inputs y renderiza, que es el "When" de todos los casos. */
  const renderizar = (
    inputs: Partial<{
      logoUrl: string | null;
      nombre: string | null;
      categoria: CategoriaSobre | null;
      variante: 'oscuro' | 'claro';
      tamanio: TamanioSobreMarca;
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
      imports: [SobreMarca, TestListaHost, TestIconosHost],
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
      ['xs', 'w-14'],
      ['sm', 'w-20'],
      ['md', 'w-28'],
      ['lg', 'w-44'],
      ['xl', 'w-60'],
      ['fluid', 'w-full'],
    ] as const) {
      // Given / When
      renderizar({ tamanio });

      // Then: el SVG escala por `viewBox`, asi que el ancho es lo unico que cambia.
      expect(controlVisual()?.classList.contains(ancho)).toBe(true);
    }
  });

  it('Dado los seis tamaños, Cuando se renderiza, Entonces todos producen un sobre con la misma proporción', () => {
    for (const tamanio of ['xs', 'sm', 'md', 'lg', 'xl', 'fluid'] as const) {
      // Given / When
      renderizar({ tamanio });

      // Then: la altura sale sola del `viewBox`; el tamaño no la toca.
      expect(svg()?.getAttribute('viewBox')).toBe('0 0 208.67 340.93');
    }
  });

  it('Dado un tamaño chico, Cuando se renderiza, Entonces el nombre no se dibuja porque sería ilegible', () => {
    for (const tamanio of ['xs', 'sm'] as const) {
      // Given / When
      renderizar({ tamanio, logoUrl: '/imagenes/lego.png', nombre: 'Complejo Deportivo' });

      // Then: a 56 px el nombre mide ~4 px y a 80 px ~5,7 px. Dibujarlo seria
      // una mancha, no un nombre.
      expect(svg()?.querySelector('.sobre__nombre')).toBeNull();
    }
  });

  it('Dado un tamaño chico con nombre, Cuando se renderiza, Entonces el nombre completo sigue en el aria-label', () => {
    // Given / When: no se dibuja, pero no se pierde.
    renderizar({ tamanio: 'xs', logoUrl: '/imagenes/lego.png', nombre: 'Complejo Deportivo' });

    // Then
    expect(controlVisual()?.getAttribute('aria-label')).toBe('Sobre de Complejo Deportivo');
  });

  it('Dado un tamaño grande, Cuando se renderiza, Entonces el nombre se dibuja recortado a 16 caracteres', () => {
    // Given / When
    renderizar({ tamanio: 'md', logoUrl: '/imagenes/lego.png', nombre: 'Complejo Deportivo Noroeste' });

    // Then
    const texto = svg()?.querySelector('.sobre__nombre')?.textContent?.trim();
    expect(texto).toBe('Complejo Deport…');
    expect(texto).toHaveLength(16);
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

  it('Dado un sobre con logo, Cuando se renderiza, Entonces el logo se recorta con un margen interior parejo', () => {
    // Given / When
    renderizar({ logoUrl: '/imagenes/cocacola.jpg' });

    // Then: el recorte apunta a un <clipPath> propio y su rect es la placa
    //MENOS un margen parejo en los cuatro lados. Con el recorte igual a la placa
    // el logo podia tocar el borde y las esquinas redondeadas le muerdian la
    // marca, que era justo el defecto del margen cero.
    const referencia = imagen()?.getAttribute('clip-path') ?? '';
    const id = referencia.match(/^url\(#(.+)\)$/)?.[1];
    expect(id).toBeTruthy();

    const clip = svg().querySelector('clipPath');
    expect(clip?.getAttribute('id')).toBe(id);

    const recorte = clip?.querySelector('rect');
    const placa = svg().querySelector('.sobre__placa');

    // El margen se mide hacia adentro en los cuatro lados: arriba e izquierda
      // restando desde el origen, abajo y derecha desde el borde opuesto.
      const margen = {
      arriba: Number(recorte?.getAttribute('y')) - Number(placa?.getAttribute('y')),
      izquierda: Number(recorte?.getAttribute('x')) - Number(placa?.getAttribute('x')),
      abajo:
        Number(placa?.getAttribute('y')) +
        Number(placa?.getAttribute('height')) -
        (Number(recorte?.getAttribute('y')) + Number(recorte?.getAttribute('height'))),
      derecha:
        Number(placa?.getAttribute('x')) +
        Number(placa?.getAttribute('width')) -
        (Number(recorte?.getAttribute('x')) + Number(recorte?.getAttribute('width'))),
    };

    expect(margen.izquierda).toBeGreaterThan(0);
    expect(margen).toEqual({
      arriba: margen.izquierda,
      izquierda: margen.izquierda,
      abajo: margen.izquierda,
      derecha: margen.izquierda,
    });
    expect(Number(recorte?.getAttribute('rx'))).toBeGreaterThan(0);
  });

  it('Dado un sobre con logo, Cuando se renderiza, Entonces el logo ocupa el area util, no la placa entera', () => {
    // Given / When
    renderizar({ logoUrl: '/imagenes/cocacola.jpg' });

    // Then: la <image> y el recorte comparten medidas exactas, para que el
    // recorte sea el del area util y no el de la imagen.
    const recorte = svg().querySelector('clipPath rect');
    expect(imagen()?.getAttribute('x')).toBe(recorte?.getAttribute('x'));
    expect(imagen()?.getAttribute('y')).toBe(recorte?.getAttribute('y'));
    expect(imagen()?.getAttribute('width')).toBe(recorte?.getAttribute('width'));
    expect(imagen()?.getAttribute('height')).toBe(recorte?.getAttribute('height'));
    expect(imagen()?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
  });

  describe('icono de categoría', () => {
    it('Dado un sobre con categoría y sin logo, Cuando se renderiza, Entonces pinta el icono y oculta las letras', () => {
      // Given / When
      renderizar({ categoria: 'tecnologia' });

      // Then
      expect(grupoIcono()).not.toBeNull();
      expect(grupoIcono()?.querySelectorAll('path').length).toBeGreaterThan(0);
      // Las letras ocupan el frente entero: no conviven con el icono.
      expect(letras()).toBeNull();
      // Sin logo no hay <image>, y por lo tanto tampoco hay placa con imagen.
      expect(imagen()).toBeNull();
    });

    it('Dado cada categoría del catálogo, Cuando se renderiza, Entonces aparece su propio icono', () => {
      // Given / When / Then: las seis categorías deben pintar algo distinto. El
      // `icono()` resuelve el nombre a datos, así que un valor válido que no
      // llegara a dibujar sería un hueco silencioso del catálogo.
      const vistos = new Set<string>();

      for (const categoria of CATEGORIAS_SOBRE) {
        renderizar({ categoria });

        const trazados = Array.from(
          grupoIcono()?.querySelectorAll('path') ?? [],
        )
          .map((p) => p.getAttribute('d') ?? '')
          .join('|');

        expect(trazados.length).toBeGreaterThan(0);
        vistos.add(trazados);
      }

      expect(vistos.size).toBe(CATEGORIAS_SOBRE.length);
    });

    it('Dado un sobre con logo y categoría, Cuando se renderiza, Entonces el logo le gana al icono', () => {
      // Given / When: la marca subio su logo y ademas paso una categoría.
      renderizar({ logoUrl: '/imagenes/zara.png', categoria: 'moda-falsa' as never });

      // Then: el logo es la fuente de verdad de la identidad.
      expect(imagen()?.getAttribute('href')).toBe('/imagenes/zara.png');
      expect(grupoIcono()).toBeNull();
    });

    it('Dado un logo que falla y una categoría presente, Cuando el logo cae, Entonces el icono toma su lugar', () => {
      // Given: un logo en vuelo con categoría de respaldo.
      renderizar({ logoUrl: '/imagenes/roto.png', categoria: 'gastronomia' });

      // When
      imagen()?.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      // Then: el fallback no es el sobre genérico si hay algo mejor que pintar.
      expect(grupoIcono()).not.toBeNull();
      expect(grupoIcono()?.querySelectorAll('path').length).toBeGreaterThan(0);
      expect(letras()).toBeNull();
    });

    it('Dado un icono, Cuando se renderiza, Entonces sus trazados coinciden con los del catálogo', () => {
      // Given / When
      renderizar({ categoria: 'musica' });

      // Then: el componente no inventa ni recorta geometría.
      const esperados = ICONOS_CATEGORIA.musica.trazos;
      const dibujados = Array.from(grupoIcono()?.querySelectorAll('path') ?? []);

      expect(dibujados.map((p) => p.getAttribute('d'))).toEqual([...esperados]);
    });

    it('Dado un icono, Cuando se renderiza, Entonces el transform lo centra y lo escala sin deformarlo', () => {
      // Given: dos iconos de viewBox muy distintos.
      renderizar({ categoria: 'tecnologia' });
      const transformTecnologia = grupoIcono()?.getAttribute('transform') ?? '';

      renderizar({ categoria: 'entretenimiento' });
      const transformEntretenimiento = grupoIcono()?.getAttribute('transform') ?? '';

      // Then: cada uno lleva su propia escala, y en los dos casos la
      // translacion central es la del centro de la placa (26 + 157/2 = 104,5).
      expect(transformTecnologia).not.toBe(transformEntretenimiento);
      expect(transformTecnologia).toContain('translate(104.5 157)');
      expect(transformEntretenimiento).toContain('translate(104.5 157)');

      // Ningun icono puede desbordar la placa, y todos miden lo mismo de ancho o de
      // alto: la caja es cuadrada y `min(ancho, alto)` preserva la proporcion
      // (si usara un solo eje, el icono panoramico se deformaria).
      const placa = svg().querySelector('.sobre__placa');
      const area = {
        x: Number(placa?.getAttribute('x')),
        y: Number(placa?.getAttribute('y')),
        ancho: Number(placa?.getAttribute('width')),
        alto: Number(placa?.getAttribute('height')),
      };

      for (const [categoria, datos] of Object.entries(ICONOS_CATEGORIA)) {
        renderizar({ categoria: categoria as CategoriaSobre });

        const escala = Math.min(104 / datos.ancho, 104 / datos.alto);
        const caja = {
          ancho: datos.ancho * escala,
          alto: datos.alto * escala,
        };

        // La caja resultante cabe entera dentro de la placa.
        expect(caja.ancho).toBeLessThanOrEqual(area.ancho);
        expect(caja.alto).toBeLessThanOrEqual(area.alto);

        // Y el lado que manda es el grande del viewBox: el otro queda holgado. La
        // tolerancia absorbe el error de punto flotante de la escala.
        const holgura =
          Math.abs(caja.ancho - 104) < 0.01 || Math.abs(caja.alto - 104) < 0.01;
        expect(holgura).toBe(true);
      }
    });

    it('Dado un icono, Cuando se renderiza, Entonces los paths no traen fill propio', () => {
      // Given / When
      renderizar({ categoria: 'cosmetica' });

      // Then: el color sale del token, no de un atributo por cada archivo.
      const fills = Array.from(grupoIcono()?.querySelectorAll('path') ?? []).map((p) =>
        p.getAttribute('fill'),
      );

      expect(fills.length).toBeGreaterThan(0);
      expect(fills.every((fill) => fill === null)).toBe(true);
    });

    it('Dado un sobre con categoría y sin nombre de marca, Cuando se renderiza, Entonces el aria-label nombra la categoría', () => {
      // Given / When
      renderizar({ categoria: 'indumentaria' });

      // Then: el sobre sigue siendo identificable sin ver el dibujo.
      expect(controlVisual()?.getAttribute('aria-label')).toBe('Sobre de Indumentaria');
    });

    it('Dado un nombre de marca y una categoría, Cuando se renderiza, Entonces el aria-label prioriza el nombre de la marca', () => {
      // Given / When
      renderizar({ logoUrl: '/imagenes/sony.png', nombre: 'Sony', categoria: 'tecnologia' });

      // Then
      expect(controlVisual()?.getAttribute('aria-label')).toBe('Sobre de Sony');
    });
  });

  describe('aura del sobre', () => {
    it('Dado un sobre clickeable, Cuando se renderiza, Entonces el aura existe, es decorativa y tiene tres anillos', () => {
      // Given / When
      renderizar({ clickeable: true });

      // Then: `aria-hidden` en el grupo alcanza para todo lo que contiene. Sin
      // esto el nombre accesible seria "Sobre de Falta UNA" tres veces mas.
      const aura = svg().querySelector('.sobre__aura');
      expect(aura?.getAttribute('aria-hidden')).toBe('true');
      expect(aura?.querySelectorAll('.sobre__aura-anillo')).toHaveLength(3);
    });

    it('Dado un sobre no clickeable, Cuando se renderiza, Entonces no hay aura', () => {
      // Given / When
      renderizar({});

      // Then: no hay control al que colgar un hover ni un foco, asi que el halo
      // no tendria con quien encenderse.
      expect(svg().querySelector('.sobre__aura')).toBeNull();
      expect(svg().querySelector('use')).toBeNull();
    });

    it('Dado un sobre clickeable con logo, Cuando se renderiza, Entonces el aura esta y sigue la silueta del sobre', () => {
      // Given / When: el aura es del envelope completo, no del icono, asi que
      // el logo no la apaga.
      renderizar({ clickeable: true, logoUrl: '/imagenes/lego.png', nombre: 'Lego' });

      // Then
      expect(svg().querySelector('.sobre__aura')).not.toBeNull();
    });

    it('Dado un sobre clickeable, Cuando se renderiza, Entonces los tres anillos arrancan escalonados', () => {
      // Given / When
      renderizar({ clickeable: true });

      // Then: los tres comparten una sola animacion y se separan en el tiempo,
      // que es lo que produce el latido en vez de tres anillos en fase. Con
      // retardo 0 el anillo se dibuja pegado al cuerpo y no se ve: los otros
      // dos tienen que arrancar mas tarde.
      const retardos = Array.from(svg().querySelectorAll('.sobre__aura-anillo')).map(
        (anillo) => Number((anillo as HTMLElement).style.animationDelay.replace('ms', '')),
      );

      expect(retardos).toEqual([0, 800, 1600]);
      expect(new Set(retardos).size).toBe(3);
    });

    it('Dado un sobre clickeable, Cuando se renderiza, Entonces el aura va detras del cuerpo', () => {
      // Given / When
      renderizar({ clickeable: true });

      // Then: el orden del markup es el orden de pintado. Si el aura viniera
      // despues, el halo taparia el sobre en vez de asomar por detras.
      const orden = Array.from(svg().querySelectorAll('g')).map((g) =>
        g.classList.contains('sobre__aura')
          ? 'aura'
          : g.classList.contains('sobre__cuerpo')
            ? 'cuerpo'
            : 'otro',
      );

      expect(orden.indexOf('aura')).toBeGreaterThanOrEqual(0);
      expect(orden.indexOf('aura')).toBeLessThan(orden.indexOf('cuerpo'));
    });

    it('Dado un sobre clickeable, Cuando se renderiza, Entonces la silueta del aura tiene los cuatro paneles del cuerpo', () => {
      // Given / When
      renderizar({ clickeable: true });

      // Then: el halo se construye con `CUERPO_SOBRE`, la misma constante que
      // dibuja el sobre. Si la silueta fuera una copia pegada, un retoque del
      // arte dejaria el halo desalineado sin que nada lo delatara.
      const silueta = svg().querySelector(`defs > g[id="${svg().querySelector('use')?.getAttribute('href')?.slice(1)}"]`);

      expect(silueta?.querySelectorAll('path')).toHaveLength(4);
      expect(Array.from(silueta?.querySelectorAll('path') ?? []).map((p) => p.getAttribute('d'))).toEqual(
        Array.from(svg().querySelectorAll('.sobre__cuerpo path')).map((p) => p.getAttribute('d')),
      );
    });

    it('Dado un sobre clickeable, Cuando se renderiza, Entonces el hueco entre paneles se cierra solo dentro del aura', () => {
      // Given / When
      renderizar({ clickeable: true });

      // Then: el arte fuente deja ~5,8u de separacion entre los cuatro paneles,
      // por la que se veria el halo cortando el sobre en tiras. El rect de cierre
      // usa las lineas interiores de la banda (7,79 / 200,88 / 25 / 287,4) y no
      // se escala, asi que su contorno coincide con el de un panel y no puede
      // asomar por un borde recto.
      const cierre = svg().querySelector('.sobre__aura-cierre');

      expect(cierre?.getAttribute('x')).toBe('7.79');
      expect(cierre?.getAttribute('y')).toBe('25');
      expect(cierre?.getAttribute('width')).toBe('193.09');
      expect(cierre?.getAttribute('height')).toBe('262.4');
      expect(cierre?.getAttribute('transform')).toBeNull();
    });

    it('Dado varios sobres clickeables en pantalla, Cuando se renderizan, Entonces cada silueta tiene su propio id', () => {
      // Given / When
      const lista = TestBed.createComponent(TestIconosHost);
      lista.detectChanges();

      // Then: un `url(#id)` compartido resolveria siempre al primer sobre de la
      // pantalla, y el aura de uno se dibujaria en todos.
      const raiz = lista.nativeElement as HTMLElement;
      const siluetas = Array.from(raiz.querySelectorAll('defs > g[id]')).map((g) =>
        g.getAttribute('id'),
      );

      expect(siluetas).toHaveLength(2);
      expect(new Set(siluetas).size).toBe(2);
      expect(siluetas.every((id) => id?.startsWith('sobre-marca-silueta-'))).toBe(true);

      const uses = Array.from(raiz.querySelectorAll('use')).map((u) =>
        (u.getAttribute('href') ?? '').replace(/^#/, ''),
      );
      expect(uses).toHaveLength(6);
      expect(new Set(uses)).toEqual(new Set(siluetas));

      lista.destroy();
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