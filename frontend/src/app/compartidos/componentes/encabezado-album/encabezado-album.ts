import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AlbumConProgreso } from '../../../modelos/album-progreso';
import { BarraProgreso } from '../barra-progreso/barra-progreso';
@Component({
  selector: 'app-encabezado-album',
  imports: [BarraProgreso],
  templateUrl: './encabezado-album.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncabezadoAlbum {
  readonly album = input.required<AlbumConProgreso>();
  readonly obtenidas = input.required<number>();
  readonly total = input.required<number>();
}