import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Carta, RarezaCarta } from '../../../modelos/carta.model';
import {
  ESTRELLAS_POR_RAREZA,
  ETIQUETA_RAREZA,
  ETIQUETA_CATEGORIA,
} from '../../../modelos/carta.model';

import urlFondoComun from '../../SVGs/FondoCartaComun.svg';
import urlFondoRara from '../../SVGs/FondoCartaRara.svg';
import urlFondoEpicarta from '../../SVGs/FondoCartaEpicarta.svg';
import urlFondoLegendaria from '../../SVGs/FondoCartaLegendaria.svg';
import urlCuadradoNumero from '../../SVGs/CuadradoNumero.svg';

import { IconoCategoriaComponent } from '../icono-categoria/icono-categoria.component';
import { EstrellaRarezaComponent } from '../estrella-rareza/estrella-rareza.component';

const FONDO_POR_RAREZA: Record<RarezaCarta, string> = {
  comun: urlFondoComun,
  rara: urlFondoRara,
  epicarta: urlFondoEpicarta,
  legendaria: urlFondoLegendaria,
};

@Component({
  selector: 'app-carta',
  standalone: true,
  imports: [IconoCategoriaComponent, EstrellaRarezaComponent],
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

  protected readonly ariaLabel = computed(() => {
    const c = this.carta();
    const rareza = ETIQUETA_RAREZA[c.rareza];
    const categoria = ETIQUETA_CATEGORIA[c.categoria];

    if (!c.obtenida) {
      return `Carta no obtenida, ${rareza}, ${categoria}`;
    }

    return `Carta ${c.nombre}, ${rareza}, ${categoria}, obtenida`;
  });
}