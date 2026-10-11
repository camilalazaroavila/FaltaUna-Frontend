import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { Boton } from '../boton/boton';
import urlLogo from '../../SVGs/Imagotipo_Alt.svg';
import urlLogoEmpresa from '../../SVGs/Imagotipo_Empresa.svg';
import urlCosme from '../../SVGs/Icon_CosmeInv.svg';
import urlEntretenimiento from '../../SVGs/Icon_EntretenimientoInv.svg';
import urlGastro from '../../SVGs/Icon_GastroInv.svg';
import urlIndumentaria from '../../SVGs/Icon_IndumentariaInv.svg';
import urlMusica from '../../SVGs/Icon_MusicaINV.svg';
import urlTecno from '../../SVGs/Icon_TecnoInv.svg';

/** Envuelve un asset en `url(...)` para reutilizarlo como máscara CSS. */
const comoMascara = (url: string): string => `url("${url}")`;

/**
 * Siluetas de categoría (variante invertida) que rota el abanico del hero.
 * Son las categorías reales de sobre, así el abanico nunca muestra algo que no
 * exista en el catálogo.
 */
const CATEGORIAS = [
  urlTecno,
  urlCosme,
  urlEntretenimiento,
  urlGastro,
  urlIndumentaria,
  urlMusica,
].map(comoMascara);

/** Posiciones del abanico: cada slot tiene su clase de posición. */
const CLASES_SLOT = [
  'categorias-fan__slot--a',
  'categorias-fan__slot--b',
  'categorias-fan__slot--c',
];

/**
 * Desfasaje entre slots para que nunca muestren la misma categoría a la vez:
 * con 6 categorías, saltar de a 2 deja siempre tres índices distintos.
 */
const DESFASE_SLOT = 2;

/**
 * Milisegundos entre cada cambio de categoría. Marca el ritmo general: cada slot
 * cambia una vez por intervalo. El SCSS reparte ese intervalo entre las tres
 * posiciones con `transition-delay` para que no cambien los tres a la vez.
 */
const INTERVALO_CATEGORIA = 2000;

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [NgIcon, Boton],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  private readonly documento = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly urlLogo = urlLogo;
  protected readonly urlLogoEmpresa = urlLogoEmpresa;

  /** Categorías listas para usarse como `mask-image`. */
  protected readonly categorias = CATEGORIAS;

  /** Contador que avanza con el tiempo para rotar las categorías del abanico. */
  private readonly paso = signal(0);

  /**
   * Slot visible del abanico: su clase de posición y el índice de la categoría
   * que le toca en este momento. Los tres slots muestran categorías distintas.
   */
  protected readonly slots = computed(() => {
    const paso = this.paso();
    return CLASES_SLOT.map((clase, slot) => ({
      clase,
      categoriaActiva: (paso + slot * DESFASE_SLOT) % this.categorias.length,
    }));
  });

  constructor() {
    const view = this.documento.defaultView;
    const reduce = view?.matchMedia('(prefers-reduced-motion: reduce)').matches ?? false;
    if (!view || reduce) {
      return;
    }

    const id = view.setInterval(() => this.paso.update((valor) => valor + 1), INTERVALO_CATEGORIA);
    this.destroyRef.onDestroy(() => view.clearInterval(id));
  }

  protected irAPlanes(): void {
    const seccion = this.documento.getElementById('planes');
    if (!seccion) {
      return;
    }
    const reduce = this.documento.defaultView?.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    seccion.scrollIntoView({ behavior: reduce?.matches ? 'auto' : 'smooth' });
  }
}
