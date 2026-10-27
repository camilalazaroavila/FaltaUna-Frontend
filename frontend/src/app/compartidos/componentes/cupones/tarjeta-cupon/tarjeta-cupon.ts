import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { CuponDescuento } from '@modelos/cupon.model';

/**
 * Componente de tarjeta de cupón con diseño de sello postal.
 * Muestra la marca, porcentaje/etiqueta de descuento y estado (si no está disponible).
 */
@Component({
  selector: 'app-tarjeta-cupon',
  standalone: true,
  templateUrl: './tarjeta-cupon.html',
  styleUrl: './tarjeta-cupon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class TarjetaCupon {
  readonly cupon = input.required<CuponDescuento>();

  readonly seleccionar = output<MouseEvent>();

  /** Texto de la franja inferior del sello: "20% OFF" o "Ver cupón". */
  protected readonly etiquetaDescuento = computed(() => {
    const c = this.cupon();
    const porcentaje =
      c.porcentajeDescuento ??
      Number(
        /(\d{1,3})\s*%/.exec(
          `${c.titulo} ${c.detalles} ${c.descripcion}`,
        )?.[1],
      );

    return Number.isFinite(porcentaje) && porcentaje > 0
      ? `${porcentaje}% OFF`
      : 'Ver cupón';
  });

  protected alHacerClick(evento: MouseEvent): void {
    this.seleccionar.emit(evento);
  }
}
