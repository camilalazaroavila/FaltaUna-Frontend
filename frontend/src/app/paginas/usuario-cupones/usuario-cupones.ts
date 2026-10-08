import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CuponesService } from '../../servicios/cupones.service';
import { CategoriaCupon, CuponDescuento } from '../../modelos/cupon.model';

import urlIconoGastro from '../../compartidos/SVGs/Icon_GastroInv.svg';
import urlIconoDeco from '../../compartidos/SVGs/Icon_DecoInv.svg';
import urlIconoCosme from '../../compartidos/SVGs/Icon_CosmeInv.svg';
import urlIconoIndumentaria from '../../compartidos/SVGs/Icon_IndumentariaInv.svg';
import urlIconoEntretenimiento from '../../compartidos/SVGs/Icon_EntretenimientoInv.svg';
import urlIconoMusica from '../../compartidos/SVGs/Icon_MusicaINV.svg';
import urlIconoTecno from '../../compartidos/SVGs/Icon_TecnoInv.svg';

interface FiltroCategoria {
  readonly id: CategoriaCupon;
  readonly nombre: string;
  readonly urlIcono: string;
}

/**
 * "Mis cupones" del jugador: grilla de sellos filtrable por categoría. Al elegir un
 * cupón disponible se muestra su QR y el código para que lo valide el empleado.
 */
@Component({
  selector: 'app-usuario-cupones',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './usuario-cupones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'cerrarCupon()' },
  styles: `
    .sello {
      --perforacion: var(--btn-juego-bg);
      background-color: var(--color-teal-profundo);
      background-image:
        radial-gradient(circle at 6px 0, var(--perforacion) 3.5px, transparent 4px),
        radial-gradient(circle at 6px 8px, var(--perforacion) 3.5px, transparent 4px),
        radial-gradient(circle at 0 6px, var(--perforacion) 3.5px, transparent 4px),
        radial-gradient(circle at 8px 6px, var(--perforacion) 3.5px, transparent 4px);
      background-size: 12px 8px, 12px 8px, 8px 12px, 8px 12px;
      background-position: 0 0, 0 100%, 0 0, 100% 0;
      background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
    }
    .zona-scroll {
      scrollbar-width: auto;
      scrollbar-color: var(--color-teal-profundo) transparent;
    }
  `,
})
export class UsuarioCupones {
  private readonly cuponesService = inject(CuponesService);

  protected readonly categorias: readonly FiltroCategoria[] = [
    { id: 'gastronomia', nombre: 'Gastronomía', urlIcono: urlIconoGastro },
    { id: 'deco', nombre: 'Deco', urlIcono: urlIconoDeco },
    { id: 'cosmetica', nombre: 'Cosmética', urlIcono: urlIconoCosme },
    { id: 'indumentaria', nombre: 'Indumentaria', urlIcono: urlIconoIndumentaria },
    { id: 'entretenimiento', nombre: 'Entretenimiento', urlIcono: urlIconoEntretenimiento },
    { id: 'musica', nombre: 'Música', urlIcono: urlIconoMusica },
    { id: 'tecnologia', nombre: 'Tecnología', urlIcono: urlIconoTecno },
  ];

  protected readonly cupones = signal<CuponDescuento[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categoriaActiva = signal<CategoriaCupon>('gastronomia');

  protected readonly cuponSeleccionado = signal<CuponDescuento | null>(null);
  protected readonly urlQr = signal<string | null>(null);
  protected readonly qrCargando = signal(false);
  protected readonly qrError = signal(false);

  protected readonly cuponesFiltrados = computed(() =>
    this.cupones().filter((c) => c.categoria === this.categoriaActiva()),
  );

  /** Solo un cupón disponible tiene QR para mostrar. */
  protected readonly cuponUtilizable = computed(
    () => this.cuponSeleccionado()?.estado === 'Disponible',
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.liberarQr());
    this.cargarCupones();
  }

  protected cargarCupones(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.cuponesService.obtenerMisCupones().subscribe({
      next: (cupones) => {
        this.cupones.set(cupones);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tus cupones. Probá de nuevo en un rato.');
        this.cargando.set(false);
      },
    });
  }

  protected elegirCategoria(id: CategoriaCupon): void {
    this.categoriaActiva.set(id);
  }

  protected abrirCupon(cupon: CuponDescuento): void {
    this.liberarQr();
    this.cuponSeleccionado.set(cupon);
    this.qrError.set(false);

    if (cupon.estado !== 'Disponible') return;

    this.qrCargando.set(true);
    this.cuponesService.obtenerQr(cupon.codigo).subscribe({
      next: (imagen) => {
        // Si el usuario ya cerró o cambió de cupón, se descarta la respuesta.
        if (this.cuponSeleccionado()?.codigo !== cupon.codigo) return;
        this.urlQr.set(URL.createObjectURL(imagen));
        this.qrCargando.set(false);
      },
      error: () => {
        this.qrError.set(true);
        this.qrCargando.set(false);
      },
    });
  }

  protected cerrarCupon(): void {
    this.cuponSeleccionado.set(null);
    this.qrCargando.set(false);
    this.liberarQr();
  }

  protected descargarQr(): void {
    const url = this.urlQr();
    const cupon = this.cuponSeleccionado();
    if (!url || !cupon) return;

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `cupon-${cupon.marca.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${cupon.codigo}.png`;
    enlace.click();
  }

  private liberarQr(): void {
    const url = this.urlQr();
    if (url) URL.revokeObjectURL(url);
    this.urlQr.set(null);
  }
}