import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PasoNumero } from '../paso-numero/paso-numero';

const FORMA_PATHS: Record<1 | 2 | 3, string> = {
  1: 'M58,22 C76,22 86,34 98,34 C110,34 126,22 144,22 C168,22 186,46 186,80 C186,116 165,148 130,158 C98,166 64,162 42,142 C20,120 14,88 20,60 C26,40 38,22 58,22 Z',
  2: 'M112,18 C138,18 165,36 178,64 C188,88 188,118 172,142 C152,164 120,166 84,164 C50,162 18,146 18,116 C18,86 36,68 62,62 C82,58 94,18 112,18 Z',
  3: 'M102,18 C134,18 166,32 180,56 C192,76 182,96 166,108 C152,118 165,136 174,146 C182,156 162,166 134,166 C98,166 54,162 34,140 C14,116 14,74 38,46 C56,26 78,18 102,18 Z',
};

/**
 * Ajuste fino de la imagen dentro de cada forma, en unidades del viewBox
 * (200x180). Positivo en x = a la derecha; positivo en y = hacia abajo.
 * Sirve para centrar ópticamente la imagen en siluetas asimétricas.
 */
const IMAGEN_OFFSET: Record<1 | 2 | 3, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 7, y: 9 },
  3: { x: 0, y: 0 },
};

@Component({
  selector: 'app-paso-forma',
  standalone: true,
  imports: [PasoNumero],
  templateUrl: './paso-forma.html',
  styleUrl: './paso-forma.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasoForma {
  readonly numero = input<number | string>();
  readonly imagenUrl = input<string>();
  readonly altTexto = input<string>('');
  readonly variante = input<'claro' | 'oscuro'>('claro');
  readonly forma = input<1 | 2 | 3>(1);

  readonly svgPath = computed(() => FORMA_PATHS[this.forma()]);

  /** Posición de la imagen: base (46, 42) más el ajuste de la forma. */
  readonly imagenX = computed(() => 46 + IMAGEN_OFFSET[this.forma()].x);
  readonly imagenY = computed(() => 42 + IMAGEN_OFFSET[this.forma()].y);

  readonly clipId = computed(
    () => `clip-paso-${this.numero() ?? 'x'}-${this.variante()}`
  );

  readonly fillColor = computed(() =>
    this.variante() === 'claro' ? '#F9F9B2' : '#0D3B40'
  );

  readonly strokeColor = computed(() =>
    this.variante() === 'claro' ? '#0D3B40' : '#072326'
  );
}