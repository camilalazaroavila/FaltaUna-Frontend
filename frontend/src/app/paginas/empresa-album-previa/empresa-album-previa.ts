import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumFlujo } from '@servicios/album-flujo.service';
import { PagosService } from '@servicios/pagos.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import type { Carta, RarezaCarta } from '@modelos/carta.model';
import { EncabezadoPaso } from '@compartidos/componentes/encabezado-paso/encabezado-paso';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';

import urlFondoComun from '@svgs/FondoCartaComun.svg';
import urlFondoRara from '@svgs/FondoCartaRara.svg';
import urlFondoEpicarta from '@svgs/FondoCartaEpicarta.svg';
import urlFondoLegendaria from '@svgs/FondoCartaLegendaria.svg';

const FONDOS: Record<RarezaCarta, string> = {
  comun: urlFondoComun,
  rara: urlFondoRara,
  epicarta: urlFondoEpicarta,
  legendaria: urlFondoLegendaria,
};

const ESTRELLAS_CANTIDAD: Record<RarezaCarta, number> = {
  comun: 1,
  rara: 2,
  epicarta: 3,
  legendaria: 4,
};

const RAREZAS_BASICO_12: RarezaCarta[] = [
  'comun',
  'comun',
  'comun',
  'comun',
  'comun',
  'rara',
  'rara',
  'rara',
  'rara',
  'epicarta',
  'epicarta',
  'legendaria',
];

export interface PreviaCartaItem {
  indice: number;
  rareza: RarezaCarta;
  fondoUrl: string;
  estrellas: number[];
  imagenUrl: string | null;
  nombre: string;
}

/**
 * Paso 4 del alta de empresa:
 * Visualización previa de los datos de marca, fotos (logo, local) y cartas cargadas.
 * Permite volver a editar mediante los botones de lápiz (✏️) conservando la información.
 * Al hacer click en "Finalizar", envía el borrador al backend y redirige a Mercado Pago.
 */
@Component({
  selector: 'app-empresa-album-previa',
  standalone: true,
  imports: [EncabezadoPaso, CartaComponent],
  templateUrl: './empresa-album-previa.html',
  styles: [`
    :host {
      display: block;
      overflow-x: hidden;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumPrevia {
  protected readonly borrador = inject(AlbumBorrador);
  private readonly flujo = inject(AlbumFlujo);
  private readonly pagos = inject(PagosService);
  private readonly estado = inject(SuscripcionEstado);
  private readonly router = inject(Router);

  protected readonly enviando = signal(false);
  protected readonly planNombre = computed(() => this.estado.planElegido()?.nombre ?? 'Básico');

  protected readonly logoUrl = signal<string | null>(null);
  protected readonly localUrl = signal<string | null>(null);
  private readonly cartasUrls = signal<(string | null)[]>([]);

  protected readonly cartas = computed<PreviaCartaItem[]>(() => {
    const urls = this.cartasUrls();
    const rarezas = this.borrador.rarezas();
    return Array.from({ length: 12 }, (_, i) => {
      const rareza = rarezas[i] ?? RAREZAS_BASICO_12[i % RAREZAS_BASICO_12.length];
      return {
        indice: i,
        rareza,
        fondoUrl: FONDOS[rareza],
        estrellas: Array.from({ length: ESTRELLAS_CANTIDAD[rareza] }, (_, idx) => idx),
        imagenUrl: urls[i] ?? null,
        nombre: this.borrador.nombreCartaDe(i),
      };
    });
  });

  protected cartaPara(item: PreviaCartaItem): Carta {
    return {
      id: String(item.indice),
      nombre: item.nombre || `Carta ${item.indice + 1}`,
      imagenUrl: item.imagenUrl ?? '',
      rareza: item.rareza,
      categoria: 'gastronomia',
      atributoIzquierdo: 0,
      atributoDerecho: 0,
      obtenida: true,
    };
  }

  constructor() {
    // Si faltan datos de pasos anteriores, redirigir donde corresponda
    if (!this.borrador.marcaCompleta()) {
      this.router.navigate(['/empresa/album/crear/marca']);
      return;
    }
    if (this.borrador.cantidadImagenes() < 2) {
      this.router.navigate(['/empresa/album/crear/album']);
      return;
    }

    effect((alLimpiar) => {
      let uLogo: string | null = null;
      let uLocal: string | null = null;
      const uCartas: (string | null)[] = [];

      const logo = this.borrador.logo();
      const local = this.borrador.fotoLocal();
      const imgs = this.borrador.imagenes();

      if (typeof URL.createObjectURL === 'function') {
        if (logo) uLogo = URL.createObjectURL(logo);
        if (local) uLocal = URL.createObjectURL(local);
        imgs.forEach((f) => {
          uCartas.push(f ? URL.createObjectURL(f) : null);
        });
      }

      this.logoUrl.set(uLogo);
      this.localUrl.set(uLocal);
      this.cartasUrls.set(uCartas);

      alLimpiar(() => {
        if (uLogo) URL.revokeObjectURL(uLogo);
        if (uLocal) URL.revokeObjectURL(uLocal);
        uCartas.forEach((u) => u && URL.revokeObjectURL(u));
      });
    });
  }

  protected editarPaso(paso: number): void {
    if (paso === 2) {
      this.router.navigate(['/empresa/album/crear/marca']);
    } else if (paso === 3) {
      this.router.navigate(['/empresa/album/crear/album']);
    }
  }

  protected finalizar(): void {
    if (this.enviando()) return;
    this.enviando.set(true);

    // Guarda el borrador del álbum y de las cartas en el backend
    this.flujo.guardarBorrador().subscribe({
      next: () => {
        // Inicia el pago atado a este borrador
        this.flujo.iniciarPago().subscribe({
          next: (res) => {
            this.enviando.set(false);
            this.pagos.redirigirACheckout(res.urlPago);
          },
          error: (err) => {
            this.enviando.set(false);
            toast.error(this.motivoDelError(err));
          },
        });
      },
      error: (err) => {
        this.enviando.set(false);
        toast.error(this.motivoDelError(err));
      },
    });
  }

  private motivoDelError(err: unknown): string {
    const cuerpo = (err as { error?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } })?.error;
    if (cuerpo?.mensaje) return cuerpo.mensaje;
    if (cuerpo?.message) return cuerpo.message;
    if (cuerpo?.errors) {
      const textos = Object.values(cuerpo.errors).flat();
      if (textos.length > 0) return textos.slice(0, 3).join(' ');
    }
    if (err instanceof Error && err.message) return err.message;
    return 'No se pudo conectar con Mercado Pago. Intentá de nuevo.';
  }
}
