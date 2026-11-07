import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { categoriaCartaDesdeNombre } from '@modelos/carta.model';
import { categoriaCuponDesdeCarta, type CuponDescuento } from '@modelos/cupon.model';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { CalendarioMensual } from '@compartidos/componentes/controles/calendario-mensual/calendario-mensual';
import { CampoTexto } from '@compartidos/componentes/controles/campo-texto/campo-texto';
import { EncabezadoPaso } from '@compartidos/componentes/controles/encabezado-paso/encabezado-paso';
import { EtiquetaCampo } from '@compartidos/componentes/controles/etiqueta-campo/etiqueta-campo';
import { TarjetaCupon } from '@compartidos/componentes/cupones/tarjeta-cupon/tarjeta-cupon';
import { aIso } from '@compartidos/utilidades/fechas';

type Errores = Partial<Record<
  'nombre' | 'descripcion' | 'descuento' | 'fechaInicio' | 'fechaFin',
  string
>>;

const SOLO_NUMEROS = /^\d{1,3}$/;

/**
 * Paso 4 del alta: el cupón que gana el jugador al completar el álbum y las
 * fechas en que el álbum está disponible. Muestra el cupón en vivo mientras se escribe.
 */
@Component({
  selector: 'app-empresa-album-cupon',
  standalone: true,
  imports: [
    FormsModule,
    Boton,
    NgIcon,
    CalendarioMensual,
    CampoTexto,
    EncabezadoPaso,
    EtiquetaCampo,
    TarjetaCupon,
  ],
  templateUrl: './empresa-album-cupon.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumCupon {
  protected readonly borrador = inject(AlbumBorrador);
  private readonly router = inject(Router);

  protected readonly hoy = aIso(new Date());
  protected readonly intentado = signal(false);

  /** Cupón tal como lo va a ver el jugador, armado con lo que la empresa escribió. */
  protected readonly cuponPrevia = computed<CuponDescuento>(() => {
    const b = this.borrador;
    const porcentaje = Number(b.cuponDescuento());
    return {
      id: 0,
      marca: b.nombreMarca().trim() || 'Tu marca',
      categoria: categoriaCuponDesdeCarta(categoriaCartaDesdeNombre(b.categoriaNombre())),
      titulo: b.cuponNombre().trim(),
      descripcion: b.cuponDescripcion().trim(),
      detalles: Number.isFinite(porcentaje) && porcentaje > 0 ? `${porcentaje}% de descuento` : '',
      codigo: 'XXXX-XXXX-XXXX',
      vigenteHastaUtc: b.fechaFin(),
      estado: 'Disponible',
      enlace: null,
      porcentajeDescuento: SOLO_NUMEROS.test(b.cuponDescuento()) && porcentaje > 0 ? porcentaje : undefined,
    };
  });

  constructor() {
    // Si recargó la página se pierden los archivos del paso 2: volver a empezar ahí.
    if (!this.borrador.marcaCompleta()) {
      this.router.navigate(['/empresa/album/crear/marca']);
    }
  }

  protected errores(): Errores {
    if (!this.intentado()) return {};
    const b = this.borrador;
    const e: Errores = {};
    if (!b.cuponNombre().trim()) e.nombre = 'Ponele un nombre a tu cupón.';
    if (!b.cuponDescripcion().trim()) e.descripcion = 'Contá qué incluye el cupón.';

    const descuento = b.cuponDescuento().trim();
    if (!SOLO_NUMEROS.test(descuento) || Number(descuento) < 1 || Number(descuento) > 100) {
      e.descuento = 'Ingresá un porcentaje entre 1 y 100.';
    }

    if (!b.fechaInicio()) e.fechaInicio = 'Elegí la fecha de inicio.';
    else if (b.fechaInicio() < this.hoy) e.fechaInicio = 'La fecha de inicio no puede ser pasada.';
    if (!b.fechaFin()) e.fechaFin = 'Elegí la fecha de fin.';
    else if (b.fechaInicio() && b.fechaFin() < b.fechaInicio()) {
      e.fechaFin = 'El fin tiene que ser posterior al inicio.';
    }
    return e;
  }

  protected siguiente(): void {
    this.intentado.set(true);
    if (Object.keys(this.errores()).length > 0) {
      toast.error('Revisá los campos marcados.');
      return;
    }
    this.router.navigate(['/empresa/album/crear/vista-previa']);
  }
}