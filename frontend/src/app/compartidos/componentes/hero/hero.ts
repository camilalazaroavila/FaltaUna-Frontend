import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { Boton } from '../boton/boton';
import urlLogo from '../../SVGs/Imagotipo_Alt.svg';
import urlLogoEmpresa from '../../SVGs/Imagotipo_Empresa.svg';
import urlGastro from '../../SVGs/Icon_GastroInv.svg';
import urlMusica from '../../SVGs/Icon_MusicaINV.svg';
import urlIndumentaria from '../../SVGs/Icon_IndumentariaInv.svg';

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

  protected readonly urlLogo = urlLogo;
  protected readonly urlLogoEmpresa = urlLogoEmpresa;
  protected readonly urlGastro = urlGastro;
  protected readonly urlMusica = urlMusica;
  protected readonly urlIndumentaria = urlIndumentaria;

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
