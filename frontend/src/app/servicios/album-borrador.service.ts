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
  // Paso 2 · marca
  readonly nombreMarca = signal('');
  readonly logo = signal<File | null>(null);
  readonly fotoLocal = signal<File | null>(null);
  readonly imagenes = signal<(File | null)[]>([]);

  // Paso 3 · identidad
  readonly descripcion = signal('');
  readonly redSocial = signal('Instagram');
  readonly usuarioRedSocial = signal('');
  readonly emailContacto = signal('');
  readonly categoria = signal('');
  /** Nombre visible de la categoría elegida (lo usa la vista previa). */
  readonly categoriaNombre = signal('');

  // Paso 4 · cupón y vigencia
  readonly cuponNombre = signal('');
  readonly cuponDescripcion = signal('');
  /** Texto tal cual lo escribe la empresa; se valida y convierte a número al continuar. */
  readonly cuponDescuento = signal('');
  readonly fechaInicio = signal('');
  readonly fechaFin = signal('');

  // Paso 5 · vista previa. Rareza por casilla de imagen (vacía = común).
  readonly rarezas = signal<RarezaCarta[]>([]);

  // Conexión con el back: el borrador se crea al terminar el paso 4 (cupón).
  /** Id del álbum borrador en el back; null hasta que se crea. */
  readonly albumId = signal<number | null>(null);
  /** Id de imagen en el back por casilla de la grilla (para cambiar rarezas en la vista previa). */
  readonly imagenIdPorCasilla = signal<Record<number, number>>({});
  /** Última rareza que quedó guardada en el back por casilla (para enviar solo lo que cambió). */
  readonly rarezaEnBack = signal<Record<number, RarezaCarta>>({});
  /** Huella de las imágenes ya subidas: si cambian al volver atrás, se re-suben. */
  readonly firmaImagenesEnBack = signal('');

  readonly cantidadImagenes = computed(() => this.imagenes().filter((i) => !!i).length);
  readonly marcaCompleta = computed(
    () => !!this.nombreMarca().trim() && !!this.logo() && !!this.fotoLocal(),
  );

  rarezaDe(indice: number): RarezaCarta {
    return this.rarezas()[indice] ?? 'comun';
  }

  cambiarRareza(indice: number, rareza: RarezaCarta): void {
    const copia = this.imagenes().map((_, i) => this.rarezaDe(i));
    copia[indice] = rareza;
    this.rarezas.set(copia);
  }

  limpiar(): void {
    this.nombreMarca.set('');
    this.logo.set(null);
    this.fotoLocal.set(null);
    this.imagenes.set([]);
    this.descripcion.set('');
    this.redSocial.set('Instagram');
    this.usuarioRedSocial.set('');
    this.emailContacto.set('');
    this.categoria.set('');
    this.categoriaNombre.set('');
    this.cuponNombre.set('');
    this.cuponDescripcion.set('');
    this.cuponDescuento.set('');
    this.fechaInicio.set('');
    this.fechaFin.set('');
    this.rarezas.set([]);
    this.albumId.set(null);
    this.imagenIdPorCasilla.set({});
    this.rarezaEnBack.set({});
    this.firmaImagenesEnBack.set('');
  }
}