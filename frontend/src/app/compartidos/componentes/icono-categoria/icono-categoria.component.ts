import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { CategoriaCarta } from '../../../modelos/carta.model';

import iconCosme from '../../SVGs/Icon_CosmeInv.svg';
import iconDeco from '../../SVGs/Icon_DecoInv.svg';
import iconEntretenimiento from '../../SVGs/Icon_EntretenimientoInv.svg';
import iconGastro from '../../SVGs/Icon_GastroInv.svg';
import iconIndumentaria from '../../SVGs/Icon_IndumentariaInv.svg';
import iconMusica from '../../SVGs/Icon_MusicaINV.svg';
import iconTecno from '../../SVGs/Icon_TecnoInv.svg';

@Component({
  selector: 'app-icono-categoria',
  standalone: true,
  templateUrl: './icono-categoria.html',
  styleUrl: './icono-categoria.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconoCategoriaComponent {
  readonly categoria = input.required<CategoriaCarta>();

  private readonly mapaIcono: Record<CategoriaCarta, string> = {
    gastronomia: iconGastro,
    cosmeticos: iconCosme,
    decoracion: iconDeco,
    indumentaria: iconIndumentaria,
    entretenimiento: iconEntretenimiento,
    musica: iconMusica,
    tecnologia: iconTecno,
  };

  readonly urlIcono = computed(() => this.mapaIcono[this.categoria()]);
}

