import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type VarianteEsqueleto =
  | 'bloque'
  | 'texto'
  | 'circulo'
  | 'pildora'
  | 'barra'
  | 'tarjeta'
  | 'sobre'
  | 'cupon'
  | 'carta';

/**
 * Átomo base de esqueleto de carga (Skeleton loader).
 *
 * Emite una silueta visual con efecto de brillo (shimmer) y pulso suave,
 * respetando `prefers-reduced-motion` y los tokens semánticos de la aplicación.
 */
@Component({
  selector: 'app-esqueleto',
  templateUrl: './esqueleto.html',
  styleUrl: './esqueleto.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'esqueleto block select-none',
    '[class.esqueleto--brillo]': 'brillo()',
    '[class.esqueleto--pulso]': 'pulso()',
    '[class.rounded-pildora]': 'esPildoraOTesto()',
    '[class.rounded-circulo]': 'variante() === "circulo"',
    '[class.rounded-md]': 'esRedondeadoMedio()',
    '[class.rounded-lg]': 'variante() === "tarjeta" || variante() === "cupon"',
    '[class.h-4]': 'variante() === "texto" && !alto()',
    '[class.aspect-square]': 'variante() === "circulo" && !alto()',
    '[class.aspect-[3/4]]': 'variante() === "sobre" && !alto()',
    '[class.aspect-[4/3]]': 'variante() === "cupon" && !alto()',
    '[class.aspect-[5/7]]': 'variante() === "carta" && !alto()',
    '[class.rounded-xl]': 'variante() === "carta"',
    '[style.width]': 'ancho()',
    '[style.height]': 'alto()',
    role: 'status',
    'aria-busy': 'true',
  },
})
export class Esqueleto {
  readonly variante = input<VarianteEsqueleto>('bloque');
  readonly ancho = input<string | null>(null);
  readonly alto = input<string | null>(null);
  readonly brillo = input<boolean>(true);
  readonly pulso = input<boolean>(true);
  readonly etiqueta = input<string>('Cargando…');

  protected readonly esPildoraOTesto = computed(() => {
    const v = this.variante();
    return v === 'texto' || v === 'pildora' || v === 'barra';
  });

  protected readonly esRedondeadoMedio = computed(() => {
    const v = this.variante();
    return v === 'bloque' || v === 'sobre';
  });
}
