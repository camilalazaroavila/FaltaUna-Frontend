import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { Carta, RarezaCarta } from '@modelos/carta.model';
import {
  ESTRELLAS_POR_RAREZA,
  ETIQUETA_RAREZA,
  ETIQUETA_CATEGORIA,
} from '@modelos/carta.model';

import urlFondoComun from '@svgs/FondoCartaComun.svg';
import urlFondoRara from '@svgs/FondoCartaRara.svg';
import urlFondoEpicarta from '@svgs/FondoCartaEpicarta.svg';
import urlFondoLegendaria from '@svgs/FondoCartaLegendaria.svg';
import urlCuadradoNumero from '@svgs/CuadradoNumero.svg';

import { IconoCategoriaComponent } from '@compartidos/componentes/cartas/icono-categoria/icono-categoria.component';
import { EstrellaRarezaComponent } from '@compartidos/componentes/cartas/estrella-rareza/estrella-rareza.component';
import { IndicadorCategoriasHabilidad } from '@compartidos/componentes/cartas/indicador-categorias-habilidad/indicador-categorias-habilidad';

const FONDO_POR_RAREZA: Record<RarezaCarta, string> = {
  comun: urlFondoComun,
  rara: urlFondoRara,
  epicarta: urlFondoEpicarta,
  legendaria: urlFondoLegendaria,
};

@Component({
  selector: 'app-carta',
  standalone: true,
  imports: [
    IconoCategoriaComponent,
    EstrellaRarezaComponent,
    IndicadorCategoriasHabilidad,
  ],
  templateUrl: './carta.html',
  styleUrl: './carta.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.carta--no-obtenida]': '!carta().obtenida',
    '[class.carta--legendaria]': 'carta().rareza === "legendaria"',
    '[attr.aria-label]': 'ariaLabel()',
    role: 'article',
  },
})
export class CartaComponent {
  readonly carta = input.required<Carta>();

  protected readonly efectosCategoria = computed(
    () => this.carta().efectosCategoria ?? [],
  );
  protected readonly tieneEfectosCategoria = computed(
    () => !this.carta().oculta && this.efectosCategoria().length > 0,
  );

  /** `true` cuando la imagen no carga: se oculta y queda el marco de la carta. */
  protected readonly imagenRota = signal(false);

  protected alFallarImagen(): void {
    this.imagenRota.set(true);
  }

  protected readonly urlFondo = computed(
    () => FONDO_POR_RAREZA[this.carta().rareza],
  );
  protected readonly urlCuadrado = urlCuadradoNumero;

  protected readonly nombreVisible = computed(() =>
    this.carta().obtenida ? this.carta().nombre : '???',
  );

  protected readonly estrellas = computed(() =>
    Array.from(
      { length: ESTRELLAS_POR_RAREZA[this.carta().rareza] },
      (_, i) => i,
    ),
  );

  protected readonly altImagen = computed(() =>
    this.carta().obtenida ? this.carta().nombre : 'Carta no obtenida',
  );

  protected readonly poderActual = computed(() => this.carta().atributoDerecho);
  protected readonly poderBase = computed(() => this.carta().poderBase);
  protected readonly diferenciaPoder = computed(() => {
    const actual = this.poderActual();
    const base = this.poderBase();
    if (base === undefined || base === null) {
      return null;
    }
    if (actual === base) {
      return null;
    }
    return actual - base;
  });
  protected readonly muestraDiferencia = computed(() => this.diferenciaPoder() !== null);
  protected readonly esPositivo = computed(() => (this.diferenciaPoder() ?? 0) > 0);
  protected readonly esNegativo = computed(() => (this.diferenciaPoder() ?? 0) < 0);
  protected readonly etiquetaDiferencia = computed(() => {
    const diff = this.diferenciaPoder();
    if (diff === null) {
      return '';
    }
    return diff > 0 ? `+${diff}` : String(diff);
  });

  protected readonly ariaLabel = computed(() => {
    const c = this.carta();
    const rareza = ETIQUETA_RAREZA[c.rareza];
    const categoria = ETIQUETA_CATEGORIA[c.categoria];

    if (!c.obtenida) {
      return `Carta no obtenida, ${rareza}, ${categoria}`;
    }

    const diff = this.diferenciaPoder();
    const extra =
      diff !== null ? `, poder actual ${c.atributoDerecho}, ${diff > 0 ? 'aumento' : 'reducción'} ${Math.abs(diff)}` : '';

    return `Carta ${c.nombre}, ${rareza}, ${categoria}, costo ${c.atributoIzquierdo}, poder ${c.atributoDerecho}${extra}, obtenida`;
  });
}