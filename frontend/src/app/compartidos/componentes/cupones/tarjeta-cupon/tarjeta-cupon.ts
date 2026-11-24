import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { CuponDescuento } from '@modelos/cupon.model';

/**
 * Tarjeta de cupón de descuento con diseño de sello postal.
 *
 * Muestra el logo de la marca (con fallback a iniciales si falla la carga),
 * el nombre en banda sólida, el descuento destacado, el estado y la fecha.
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

  /** Texto de la franja de descuento: "20% OFF" o "Ver cupón". */
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

  protected readonly logoUrl = computed(() => this.cupon().marcaLogoUrl ?? null);
  protected readonly logoError = signal(false);
  protected readonly iniciales = computed(() => this.calcularIniciales(this.cupon().marca));
  protected readonly vencimientoCorto = computed(() => {
    const fecha = this.cupon().vigenteHastaUtc;
    if (!fecha) {
      return null;
    }
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'UTC',
    });
  });

  protected readonly claseBadgeEstado = computed(() => {
    switch (this.cupon().estado) {
      case 'Disponible':
        return 'badge-estado--disponible';
      case 'Usado':
        return 'badge-estado--usado';
      case 'Vencido':
        return 'badge-estado--vencido';
      default:
        return 'badge-estado--usado';
    }
  });

  protected readonly noDisponible = computed(() => this.cupon().estado !== 'Disponible');

  protected alHacerClick(evento: MouseEvent): void {
    this.seleccionar.emit(evento);
  }

  protected alErrorImagen(): void {
    this.logoError.set(true);
  }

  private calcularIniciales(marca: string): string {
    const palabras = marca
      .trim()
      .split(/\s+/)
      .filter((p) => p.length > 0);

    if (palabras.length === 0) {
      return '?';
    }

    if (palabras.length === 1) {
      return palabras[0].slice(0, 2).toUpperCase();
    }

    return palabras
      .slice(0, 3)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }
}