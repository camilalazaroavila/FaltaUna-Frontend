import { Injectable, computed, signal } from '@angular/core';
import type { RarezaCarta } from '@modelos/carta.model';

/**
 * Borrador del álbum mientras la empresa completa los pasos 2 a 5 del alta.
 * Los archivos viven en memoria hasta que se crea el borrador en el back (paso 4);
 * desde ahí `albumId` apunta al álbum en estado Borrador.
 * Vive en memoria (los archivos no se pueden persistir en sessionStorage);
 * se limpia al finalizar.
 */
@Injectable({ providedIn: 'root' })
export class AlbumBorrador {
  // Paso 2 · Tu marca
  readonly nombreMarca = signal('');
  readonly descripcion = signal('');
  readonly redSocial = signal('Instagram');
  readonly usuarioRedSocial = signal('');
  readonly emailContacto = signal('');
  readonly categoria = signal('');
  /** Nombre visible de la categoría elegida (lo usa la vista previa). */
  readonly categoriaNombre = signal('');
  readonly logo = signal<File | null>(null);
  readonly fotoLocal = signal<File | null>(null);

  // Paso 3 · Tu primer álbum (cartas y rarezas)
  readonly imagenes = signal<(File | null)[]>([]);
  readonly rarezas = signal<RarezaCarta[]>([]);
  readonly nombresCartas = signal<string[]>([]);

  // Conexión con el back: el borrador se crea antes de pagar.
  /** Id del álbum borrador en el back; null hasta que se crea. */
  readonly albumId = signal<number | null>(null);
  /** Id de imagen en el back por casilla de la grilla. */
  readonly imagenIdPorCasilla = signal<Record<number, number>>({});
  /** Última rareza que quedó guardada en el back por casilla. */
  readonly rarezaEnBack = signal<Record<number, RarezaCarta>>({});
  /** Huella de las imágenes ya subidas: si cambian al volver atrás, se re-suben. */
  readonly firmaImagenesEnBack = signal('');

  readonly cantidadImagenes = computed(() => this.imagenes().filter((i) => !!i).length);
  readonly marcaCompleta = computed(
    () =>
      !!this.nombreMarca().trim() &&
      !!this.descripcion().trim() &&
      !!this.emailContacto().trim() &&
      !!this.categoria() &&
      !!this.logo() &&
      !!this.fotoLocal(),
  );

  rarezaDe(indice: number): RarezaCarta {
    return this.rarezas()[indice] ?? 'comun';
  }

  nombreCartaDe(indice: number): string {
    return this.nombresCartas()[indice] ?? '';
  }

  establecerNombreCarta(indice: number, nombre: string): void {
    const total = Math.max(this.nombresCartas().length, indice + 1);
    const copia = Array.from({ length: total }, (_, i) => this.nombresCartas()[i] ?? '');
    copia[indice] = (nombre || '').slice(0, 15);
    this.nombresCartas.set(copia);
  }

  cambiarRareza(indice: number, rareza: RarezaCarta): void {
    const copia = this.imagenes().map((_, i) => this.rarezaDe(i));
    copia[indice] = rareza;
    this.rarezas.set(copia);
  }

  limpiar(): void {
    this.nombreMarca.set('');
    this.descripcion.set('');
    this.redSocial.set('Instagram');
    this.usuarioRedSocial.set('');
    this.emailContacto.set('');
    this.categoria.set('');
    this.categoriaNombre.set('');
    this.logo.set(null);
    this.fotoLocal.set(null);
    this.imagenes.set([]);
    this.rarezas.set([]);
    this.nombresCartas.set([]);
    this.albumId.set(null);
    this.imagenIdPorCasilla.set({});
    this.rarezaEnBack.set({});
    this.firmaImagenesEnBack.set('');
  }
}