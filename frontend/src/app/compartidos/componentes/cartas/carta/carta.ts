import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import type { Carta, RarezaCarta } from '@modelos/carta.model';
import {
  ESTRELLAS_POR_RAREZA,
  ETIQUETA_RAREZA,
  ETIQUETA_CATEGORIA,
  normalizarUrlImagen,
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
    '[class.carta--blanco-y-negro]': 'carta().blancoYNegro',
    '[class.carta--oculta]': 'carta().oculta',
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

  /** `true` cuando la imagen no carga: se muestra el fallback con la categoría y nombre. */
  protected readonly imagenRota = linkedSignal(() => {
    this.carta();
    return false;
  });

  protected alFallarImagen(): void {
    if (this.imagenRota()) {
      return;
    }
    this.imagenRota.set(true);
  }

  protected readonly urlImagen = computed(() =>
    normalizarUrlImagen(this.carta().imagenUrl),
  );


  protected readonly urlFondo = computed(
    () => FONDO_POR_RAREZA[this.carta().rareza],
  );
  protected readonly urlCuadrado = urlCuadradoNumero;

  protected readonly nombreVisible = computed(() =>
    this.carta().obtenida || this.carta().blancoYNegro ? this.carta().nombre : '???',
  );

  protected readonly estrellas = computed(() =>
    Array.from(
      { length: ESTRELLAS_POR_RAREZA[this.carta().rareza] },
      (_, i) => i,
    ),
  );

  protected readonly altImagen = computed(() =>
    this.carta().obtenida || this.carta().blancoYNegro ? this.carta().nombre : 'Carta no obtenida',
  );

  protected readonly ariaLabel = computed(() => {
    const c = this.carta();
    const rareza = ETIQUETA_RAREZA[c.rareza];
    const categoria = ETIQUETA_CATEGORIA[c.categoria];

    if (!c.obtenida && c.blancoYNegro) {
      return `Carta ${c.nombre}, ${rareza}, ${categoria}, todavía no obtenida`;
    }

    if (!c.obtenida) {
      return `Carta no obtenida, ${rareza}, ${categoria}`;
    }

    return `Carta ${c.nombre}, ${rareza}, ${categoria}, costo ${c.atributoIzquierdo}, poder ${c.atributoDerecho}, obtenida`;
  });
}