import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import {
  CARTAS_POR_ALBUM,
  MAX_KB_IMAGEN,
  MINIMO_IMAGENES,
  TOPE_CARTAS_ALBUM,
} from '@modelos/album.model';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { CampoTexto } from '@compartidos/componentes/controles/campo-texto/campo-texto';
import { EncabezadoPaso } from '@compartidos/componentes/controles/encabezado-paso/encabezado-paso';
import { EtiquetaCampo } from '@compartidos/componentes/controles/etiqueta-campo/etiqueta-campo';
import { GrillaImagenes } from '@compartidos/componentes/controles/grilla-imagenes/grilla-imagenes';
import { SubidaImagen } from '@compartidos/componentes/controles/subida-imagen/subida-imagen';

/** Paso 2 del alta: nombre de la marca, logo, foto del local y las imágenes del álbum. */
@Component({
  selector: 'app-empresa-album-marca',
  standalone: true,
  imports: [FormsModule, Boton, NgIcon, CampoTexto, EncabezadoPaso, EtiquetaCampo, GrillaImagenes, SubidaImagen],
  templateUrl: './empresa-album-marca.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumMarca {
  protected readonly borrador = inject(AlbumBorrador);
  private readonly estado = inject(SuscripcionEstado);
  private readonly router = inject(Router);

  /** Casillas de imagen según el plan pagado (12 / 20 / 30), con un tope visual. */
  protected readonly cantidad = computed(() => {
    const delPlan = this.estado.ultimoPago()?.plan?.maxCartas;
    return delPlan && delPlan > 0 ? Math.min(delPlan, TOPE_CARTAS_ALBUM) : CARTAS_POR_ALBUM;
  });
  protected readonly minimo = MINIMO_IMAGENES;
  protected readonly maxKb = MAX_KB_IMAGEN;
  protected readonly intentado = signal(false);

  constructor() {
    // Asegura el largo de la grilla la primera vez que se entra.
    const cantidad = this.cantidad();
    if (this.borrador.imagenes().length !== cantidad) {
      this.borrador.imagenes.set(
        Array.from({ length: cantidad }, (_, i) => this.borrador.imagenes()[i] ?? null),
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
    if (!this.borrador.fotoLocal()) {
      toast.error('Subí una foto de tu local.');
      return;
    }
    if (this.borrador.cantidadImagenes() < this.minimo) {
      toast.error(
        `Subí al menos ${this.minimo} imágenes para tu álbum (podés subir hasta ${this.cantidad()}).`,
      );
      return;
    }
    this.router.navigate(['/empresa/album/crear/identidad']);
  }
}