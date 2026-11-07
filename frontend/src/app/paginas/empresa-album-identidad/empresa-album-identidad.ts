import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumesService } from '@servicios/albumes.service';
import { AuthService } from '@servicios/auth.service';
import { CATEGORIAS_RESPALDO, CategoriaApi, REDES_SOCIALES } from '@modelos/album.model';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { CampoSelect, OpcionSelect } from '@compartidos/componentes/controles/campo-select/campo-select';
import { CampoTexto } from '@compartidos/componentes/controles/campo-texto/campo-texto';
import { EncabezadoPaso } from '@compartidos/componentes/controles/encabezado-paso/encabezado-paso';

type Errores = Partial<Record<
  'descripcion' | 'usuarioRedSocial' | 'emailContacto' | 'categoria',
  string
>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Paso 3 del alta: descripción, contacto, redes y categoría de la marca. */
@Component({
  selector: 'app-empresa-album-identidad',
  standalone: true,
  imports: [FormsModule, Boton, NgIcon, CampoSelect, CampoTexto, EncabezadoPaso],
  templateUrl: './empresa-album-identidad.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumIdentidad {
  protected readonly borrador = inject(AlbumBorrador);
  private readonly albumes = inject(AlbumesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly redes = REDES_SOCIALES;
  protected readonly categorias = signal<OpcionSelect[]>([]);

  protected readonly intentado = signal(false);

  constructor() {
    this.albumes.obtenerCategorias().subscribe({
      next: (lista) => this.mostrarCategorias(lista),
      // Backend sin el endpoint de categorías: se usa la lista de respaldo.
      error: () => this.mostrarCategorias(CATEGORIAS_RESPALDO),
    });

    // Si recargó la página se pierden los archivos del paso 2: volver a empezar ahí.
    if (!this.borrador.marcaCompleta()) {
      this.router.navigate(['/empresa/album/crear/marca']);
      return;
    }

    // El mail de contacto arranca con el de la cuenta; la empresa puede cambiarlo.
    if (!this.borrador.emailContacto()) {
      this.borrador.emailContacto.set(this.auth.usuarioActual()?.email ?? '');
    }
  }

  private mostrarCategorias(lista: CategoriaApi[]): void {
    this.categorias.set(lista.map((c) => ({ valor: String(c.id), etiqueta: c.nombre })));
  }

  protected elegirCategoria(valor: string): void {
    this.borrador.categoria.set(valor);
    this.borrador.categoriaNombre.set(
      this.categorias().find((c) => c.valor === valor)?.etiqueta ?? '',
    );
  }

  protected errores(): Errores {
    if (!this.intentado()) return {};
    const b = this.borrador;
    const e: Errores = {};
    if (!b.descripcion().trim()) e.descripcion = 'Contanos qué hace tu marca.';
    if (!b.usuarioRedSocial().trim()) e.usuarioRedSocial = 'Ingresá tu usuario o link.';
    if (!EMAIL.test(b.emailContacto().trim())) e.emailContacto = 'Ingresá un mail de contacto válido.';
    if (!b.categoria()) e.categoria = 'Elegí una categoría.';
    return e;
  }

  protected siguiente(): void {
    this.intentado.set(true);
    if (Object.keys(this.errores()).length > 0) {
      toast.error('Revisá los campos marcados.');
      return;
    }
    this.router.navigate(['/empresa/album/crear/cupon']);
  }
}