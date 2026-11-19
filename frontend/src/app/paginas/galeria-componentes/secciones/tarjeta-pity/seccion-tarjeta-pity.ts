import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TarjetaPity } from '@compartidos/componentes/usuario/tarjeta-pity/tarjeta-pity';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';
import type { ProgresoPity } from '@modelos/misiones.model';

type ModoBloque = 'jugador' | 'empresa';

interface MuestraPity {
  readonly etiqueta: string;
  readonly progreso: ProgresoPity;
}

/**
 * Sección de galería de `app-tarjeta-pity`.
 *
 * Muestra la tarjeta en sus 3 estados:
 * 1. En progreso: "Faltan N sobres para la garantía".
 * 2. Cerca: contador al 75%+ con badge "¡Casi!".
 * 3. Garantizada: halo legendario, sobre holográfico y botón "Abrir sobre".
 */
@Component({
  selector: 'app-seccion-tarjeta-pity',
  imports: [TarjetaPity, TarjetaMuestra],
  templateUrl: './seccion-tarjeta-pity.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionTarjetaPity {
  protected readonly modos: readonly ModoBloque[] = ['jugador', 'empresa'];

  protected readonly muestras: readonly MuestraPity[] = [
    {
      etiqueta: 'General · En progreso',
      progreso: {
        tipo: 'GENERAL',
        contador: 15,
        umbral: 40,
        sobresRestantes: 25,
        garantizada: false,
      },
    },
    {
      etiqueta: 'Categoría · Cerca (>= 75%)',
      progreso: {
        tipo: 'CATEGORIA',
        contador: 16,
        umbral: 20,
        sobresRestantes: 4,
        garantizada: false,
      },
    },
    {
      etiqueta: 'Marca · Garantizada',
      progreso: {
        tipo: 'MARCA',
        contador: 10,
        umbral: 10,
        sobresRestantes: 0,
        garantizada: true,
      },
    },
  ];
}
