import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import {
  ESCALA_FEEDBACK,
  PALETA_SEMANTICA,
  RADIOS,
  SOMBRAS,
  TIPOGRAFIAS,
} from '../../datos-tokens';

@Component({
  selector: 'app-seccion-tokens',
  imports: [TarjetaMuestra],
  templateUrl: './seccion-tokens.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionTokens {
  protected readonly paleta = PALETA_SEMANTICA;
  protected readonly feedback = ESCALA_FEEDBACK;
  protected readonly tipografias = TIPOGRAFIAS;
  protected readonly radios = RADIOS;
  protected readonly sombras = SOMBRAS;

  /** Contenido de relleno para demostrar el scroll de los contenedores. */
  protected readonly lineas = Array.from({ length: 30 }, (_, indice) => indice + 1);
}