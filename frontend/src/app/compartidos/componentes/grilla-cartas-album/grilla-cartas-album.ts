import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CartaDeAlbum } from '../../../modelos/album-progreso';
import { CartaComponent } from '../carta/carta';

/** Grilla de cartas de un álbum. En modo favoritas, cada carta se vuelve un botón para marcarla. */
@Component({
  selector: 'app-grilla-cartas-album',
  imports: [CartaComponent],
  templateUrl: './grilla-cartas-album.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GrillaCartasAlbum {
  readonly cartas = input.required<readonly CartaDeAlbum[]>();
  readonly modoFavoritas = input(false);
  readonly alternarFavorita = output<CartaDeAlbum>();
}
