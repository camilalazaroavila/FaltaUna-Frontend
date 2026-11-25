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
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import {
  CARTAS_POR_ALBUM,
  MAX_KB_IMAGEN,
  MINIMO_IMAGENES,
  TOPE_CARTAS_ALBUM,
  rarezasPorPlan,
} from '@modelos/album.model';
import { FormsModule } from '@angular/forms';
import { EncabezadoPaso } from '@compartidos/componentes/encabezado-paso/encabezado-paso';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import type { Carta, RarezaCarta } from '@modelos/carta.model';

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


export interface CasillaCarta {
  indice: number;
  rareza: RarezaCarta;
  fondoUrl: string;
  estrellas: number[];
}

/**
 * Paso 3 del alta de empresa:
 * Grilla de cartas de la colección con marcos temáticos por rareza (estrellas y fondos).
 * Ranura central blanca con signo + que aloja la foto subida adaptada a la carta.
 */
@Component({
  selector: 'app-empresa-album-cartas',
  standalone: true,
  imports: [FormsModule, EncabezadoPaso, CartaComponent],
  templateUrl: './empresa-album-cartas.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumCartas {
  protected readonly borrador = inject(AlbumBorrador);
  private readonly estado = inject(SuscripcionEstado);
  private readonly router = inject(Router);

  protected readonly minimo = MINIMO_IMAGENES; // 2 para la demo
  protected readonly maxKb = MAX_KB_IMAGEN;

  /** Total de cartas permitido por el plan elegido (12 para el Plan Básico) */
  protected readonly cantidad = computed(() => {
    const delPlan = this.estado.planElegido()?.maxCartas;
    return delPlan && delPlan > 0 ? Math.min(delPlan, TOPE_CARTAS_ALBUM) : CARTAS_POR_ALBUM;
  });

  protected readonly cantidadSubidas = computed(() => this.borrador.cantidadImagenes());

  /** URLs de vista previa de los archivos locales */
  protected readonly previews = signal<(string | null)[]>([]);

  protected readonly casillas = computed<CasillaCarta[]>(() => {
    const total = this.cantidad();
    const distribucion = rarezasPorPlan(total);
    return Array.from({ length: total }, (_, i) => {
      const rareza = distribucion[i] ?? 'comun';
      const cantidadEstrellas = ESTRELLAS_CANTIDAD[rareza];
      return {
        indice: i,
        rareza,
        fondoUrl: FONDOS[rareza],
        estrellas: Array.from({ length: cantidadEstrellas }, (_, idx) => idx),
      };
    });
  });

  constructor() {
    // Si no completó los datos de la marca, volver al paso 2
    if (!this.borrador.marcaCompleta()) {
      this.router.navigate(['/empresa/album/crear/marca']);
      return;
    }

    const cantidad = this.cantidad();
    if (this.borrador.imagenes().length !== cantidad) {
      this.borrador.imagenes.set(
        Array.from({ length: cantidad }, (_, i) => this.borrador.imagenes()[i] ?? null),
      );
    }

    // Inicializar rarezas predeterminadas en el borrador si están vacías
    if (this.borrador.rarezas().length !== cantidad) {
      this.borrador.rarezas.set(rarezasPorPlan(cantidad));
    }

    effect((alLimpiar) => {
      const archivos = this.borrador.imagenes();
      const urls: (string | null)[] = [];

      archivos.forEach((f) => {
        if (f && typeof URL.createObjectURL === 'function') {
          urls.push(URL.createObjectURL(f));
        } else {
          urls.push(null);
        }
      });

      this.previews.set(urls);

      alLimpiar(() => {
        urls.forEach((u) => u && URL.revokeObjectURL(u));
      });
    });
  }

  protected cartaPara(casilla: CasillaCarta): Carta {
    return {
      id: String(casilla.indice),
      nombre: this.borrador.nombreCartaDe(casilla.indice) || `Carta ${casilla.indice + 1}`,
      imagenUrl: this.previews()[casilla.indice] ?? '',
      rareza: casilla.rareza,
      categoria: 'gastronomia',
      atributoIzquierdo: 0,
      atributoDerecho: 0,
      obtenida: true,
    };
  }

  protected actualizarNombreCarta(indice: number, evento: Event): void {
    const valor = (evento.target as HTMLInputElement)?.value ?? '';
    this.borrador.establecerNombreCarta(indice, valor);
  }

  protected seleccionarArchivo(indice: number, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen (PNG, JPG o WEBP).');
      return;
    }
    if (archivo.size > this.maxKb * 1024) {
      toast.error(`La imagen no puede superar los ${this.maxKb} KB.`);
      return;
    }

    const copia = [...this.borrador.imagenes()];
    copia[indice] = archivo;
    this.borrador.imagenes.set(copia);
  }

  protected quitarImagen(indice: number, evento: MouseEvent): void {
    evento.stopPropagation();
    const copia = [...this.borrador.imagenes()];
    copia[indice] = null;
    this.borrador.imagenes.set(copia);
  }

  protected siguiente(): void {
    if (this.cantidadSubidas() < this.minimo) {
      toast.error(
        `Subí al menos ${this.minimo} imágenes para tu álbum (podés subir hasta ${this.cantidad()}).`,
      );
      return;
    }

    this.router.navigate(['/empresa/album/crear/vista-previa']);
  }
}
