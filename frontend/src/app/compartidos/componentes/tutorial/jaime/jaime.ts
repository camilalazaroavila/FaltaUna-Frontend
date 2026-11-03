import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type PoseJaime = 'senalando' | 'si' | 'no';
export type MiradaJaime = 'izquierda' | 'derecha';
export type TamanioJaime = 'sm' | 'lg';

/** Rutas reales de los stickers en public/imagenes/gatito/. */
const IMAGENES: Record<PoseJaime, string> = {
  senalando: '/imagenes/gatito/gatito señalando.jpg',
  si: '/imagenes/gatito/jaime diciendo si.png',
  no: '/imagenes/gatito/jaime diciendo no.png',
};

/** AJUSTAR: hacia dónde apunta el sticker original (sin voltear). */
const MIRADA_NATIVA: MiradaJaime = 'derecha';

const CLASES_TAMANIO: Record<TamanioJaime, string> = {
  sm: 'h-20',
  lg: 'h-[clamp(6rem,24dvh,11rem)]',
};

/**
 * Mascota del tutorial. Solo "señalando" se voltea según hacia dónde mira;
 * "sí" y "no" van siempre de frente. Es decorativo: el texto del globo lleva
 * el mensaje, por eso la imagen no tiene alt.
 */
@Component({
  selector: 'app-jaime',
  templateUrl: './jaime.html',
  styleUrl: './jaime.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'clases()', 'aria-hidden': 'true' },
})
export class Jaime {
  readonly pose = input<PoseJaime>('senalando');
  readonly mirada = input<MiradaJaime>('derecha');
  readonly tamanio = input<TamanioJaime>('sm');

  protected readonly imagen = computed(() => IMAGENES[this.pose()]);
  protected readonly volteado = computed(
    () => this.pose() === 'senalando' && this.mirada() !== MIRADA_NATIVA,
  );
  protected readonly clases = computed(() => `inline-block shrink-0 ${CLASES_TAMANIO[this.tamanio()]}`);
}