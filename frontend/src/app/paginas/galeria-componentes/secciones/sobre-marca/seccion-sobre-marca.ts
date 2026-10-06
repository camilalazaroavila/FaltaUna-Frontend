import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SobreMarca } from '../../../../compartidos/componentes/sobre-marca/sobre-marca';
import type { VarianteSobreMarca } from '../../../../compartidos/componentes/sobre-marca/sobre-marca';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import { RegistroEventos } from '../../registro-eventos/registro-eventos';
import { crearRegistroEventos } from '../../registro-eventos';
import { COLORES_SOBRE_MARCA } from '../../datos-tokens';
import { CATEGORIAS_SOBRE, ETIQUETAS_CATEGORIA } from '../../../../modelos/categoria.model';

/**
 * Logo vertical de muestra.
 *
 * Ninguna foto de `public/imagenes` es vertical (la mas apaisada es 1,66:1) y
 * la placa es casi cuadrada, asi que hace falta un caso real de contencion:
 * es el escenario donde un logo alto se reduce y deja aire a los lados. Es una
 * imagen, no una superficie de la app, asi que lleva su propio color en vez de
 * un token.
 */
const LOGO_VERTICAL_MUESTRA = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 200">' +
    '<rect x="2" y="2" width="36" height="196" rx="10" fill="#71717A"/>' +
    '<rect x="11" y="26" width="18" height="148" rx="6" fill="#FAFAFA"/>' +
    '</svg>',
)}`;

interface VarianteDeMuestra {
  readonly id: VarianteSobreMarca;
  /** Nombre del SVG de referencia del que sale la variante. */
  readonly origen: string;
  readonly detalle: string;
}

interface LogoDeMuestra {
  readonly marca: string;
  readonly logoUrl: string;
  /** Proporcion y medidas reales del archivo, para comparar de un vistazo. */
  readonly medidas: string;
}

@Component({
  selector: 'app-seccion-sobre-marca',
  imports: [SobreMarca, TarjetaMuestra, RegistroEventos],
  templateUrl: './seccion-sobre-marca.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionSobreMarca {
  private readonly eventos = crearRegistroEventos();

  protected readonly registros = this.eventos.registros;
  protected readonly registrar = (evento: string): void => this.eventos.registrar(evento);

  protected readonly tokens = COLORES_SOBRE_MARCA;

  /** La verde va primera porque es la variante por defecto del componente. */
  protected readonly variantes: readonly VarianteDeMuestra[] = [
    { id: 'oscuro', origen: 'Paquete1 (por defecto)', detalle: 'cuerpo verde, letras crema' },
    { id: 'claro', origen: 'Paquete2', detalle: 'cuerpo crema, letras tinta' },
  ];

  protected readonly tamanios = ['sm', 'md', 'lg'] as const;

  protected readonly categorias = CATEGORIAS_SOBRE;
  protected readonly etiquetasCategoria = ETIQUETAS_CATEGORIA;

  /**
   * Logos reales de `public/imagenes` con sus medidas exactas: la placa es casi
   * cuadrada y el logo entra con `meet`, asi que cada proporci��n queda
   * centerpieceada y recortada con las esquinas de la placa.
   */
  protected readonly logos: readonly LogoDeMuestra[] = [
    { marca: 'Sprite', logoUrl: 'imagenes/Sprite.png', medidas: '1,66:1 × 713×429' },
    { marca: 'Coca-Cola', logoUrl: 'imagenes/cocacola.jpg', medidas: '1,43:1 × 500×350' },
    { marca: 'Zara', logoUrl: 'imagenes/zara.jpg', medidas: '1,43:1 × 1000×700' },
    { marca: 'Zara', logoUrl: 'imagenes/zara.png', medidas: '1,43:1 × 662×463' },
    { marca: 'McDonalds', logoUrl: 'imagenes/McDonalds.jpg', medidas: '1:1 × 447×447' },
    { marca: 'Sony', logoUrl: 'imagenes/sony.png', medidas: '1:1 × 447×447' },
    { marca: 'Lego', logoUrl: 'imagenes/lego.png', medidas: '1:1 × 225×225 — PNG con alfa' },
    { marca: 'Google', logoUrl: 'imagenes/google.jpg', medidas: '1:1 × 900×900' },
    { marca: 'Vertical (muestra)', logoUrl: LOGO_VERTICAL_MUESTRA, medidas: '0,2:1 — SVG' },
  ];
}