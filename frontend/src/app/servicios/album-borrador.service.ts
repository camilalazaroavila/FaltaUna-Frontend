import { Injectable, computed, signal } from '@angular/core';

/**
 * Borrador del álbum mientras la empresa completa los pasos 3 y 4.
 * Vive en memoria (los archivos no se pueden persistir en sessionStorage);
 * se limpia al finalizar.
 */
@Injectable({ providedIn: 'root' })
export class AlbumBorrador {
  // Paso 3 · marca
  readonly nombreMarca = signal('');
  readonly logo = signal<File | null>(null);
  readonly imagenes = signal<(File | null)[]>([]);

  // Paso 4 · identidad
  readonly descripcion = signal('');
  readonly redSocial = signal('Instagram');
  readonly usuarioRedSocial = signal('');
  readonly emailContacto = signal('');
  readonly categoria = signal('');
  readonly fechaInicio = signal('');
  readonly fechaFin = signal('');

  readonly cantidadImagenes = computed(() => this.imagenes().filter((i) => !!i).length);
  readonly marcaCompleta = computed(() => !!this.nombreMarca().trim() && !!this.logo());

  limpiar(): void {
    this.nombreMarca.set('');
    this.logo.set(null);
    this.imagenes.set([]);
    this.descripcion.set('');
    this.redSocial.set('Instagram');
    this.usuarioRedSocial.set('');
    this.emailContacto.set('');
    this.categoria.set('');
    this.fechaInicio.set('');
    this.fechaFin.set('');
  }
}