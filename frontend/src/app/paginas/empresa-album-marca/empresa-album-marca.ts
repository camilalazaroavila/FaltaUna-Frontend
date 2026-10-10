import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import { AlbumBorrador } from '../../servicios/album-borrador.service';
import { CARTAS_POR_ALBUM, MAX_KB_IMAGEN } from '../../modelos/album.model';
import { Boton } from '../../compartidos/componentes/boton/boton';
import { CampoTexto } from '../../compartidos/componentes/campo-texto/campo-texto';
import { EncabezadoPaso } from '../../compartidos/componentes/encabezado-paso/encabezado-paso';
import { EtiquetaCampo } from '../../compartidos/componentes/etiqueta-campo/etiqueta-campo';
import { GrillaImagenes } from '../../compartidos/componentes/grilla-imagenes/grilla-imagenes';
import { SubidaImagen } from '../../compartidos/componentes/subida-imagen/subida-imagen';

/** Paso 3 del alta: nombre de la marca, logo y las imágenes del álbum. */
@Component({
  selector: 'app-empresa-album-marca',
  standalone: true,
  imports: [FormsModule, Boton, NgIcon, CampoTexto, EncabezadoPaso, EtiquetaCampo, GrillaImagenes, SubidaImagen],
  templateUrl: './empresa-album-marca.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumMarca {
  protected readonly borrador = inject(AlbumBorrador);
  private readonly router = inject(Router);

  protected readonly cantidad = CARTAS_POR_ALBUM;
  protected readonly maxKb = MAX_KB_IMAGEN;
  protected readonly intentado = signal(false);

  constructor() {
    // Asegura el largo de la grilla la primera vez que se entra.
    if (this.borrador.imagenes().length !== this.cantidad) {
      this.borrador.imagenes.set(
        Array.from({ length: this.cantidad }, (_, i) => this.borrador.imagenes()[i] ?? null),
      );
    }
  }

  protected errorNombre(): string | null {
    return this.intentado() && !this.borrador.nombreMarca().trim()
      ? 'Ingresá el nombre de tu marca.'
      : null;
  }

  protected avisarRechazo(motivo: string): void {
    toast.error(motivo);
  }

  protected siguiente(): void {
    this.intentado.set(true);
    if (!this.borrador.nombreMarca().trim()) {
      toast.error('Ingresá el nombre de tu marca.');
      return;
    }
    if (!this.borrador.logo()) {
      toast.error('Subí el logo de tu marca.');
      return;
    }
    if (this.borrador.cantidadImagenes() < this.cantidad) {
      toast.error(
        `Subí las ${this.cantidad} imágenes de tu álbum (${this.borrador.cantidadImagenes()}/${this.cantidad}).`,
      );
      return;
    }
    this.router.navigate(['/empresa/album/crear/identidad']);
  }
}