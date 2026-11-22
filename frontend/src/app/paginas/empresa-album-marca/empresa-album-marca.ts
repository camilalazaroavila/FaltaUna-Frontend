import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumesService } from '@servicios/albumes.service';
import { AuthService } from '@servicios/auth.service';
import { PagosService } from '@servicios/pagos.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import {
  CATEGORIAS_RESPALDO,
  CategoriaApi,
  MAX_KB_IMAGEN,
  REDES_SOCIALES,
} from '@modelos/album.model';
import { EncabezadoPaso } from '@compartidos/componentes/encabezado-paso/encabezado-paso';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CategoriaOpcion {
  id: string;
  nombre: string;
}

/**
 * Paso 2 del alta de empresa:
 * Formulario unificado de Tu Marca (nombre, descripción, redes, email, categoría, logo y foto del local).
 * Al continuar, muestra el modal de confirmación: "Omitir y pagar" vs "Ir a crear álbum".
 */
@Component({
  selector: 'app-empresa-album-marca',
  standalone: true,
  imports: [FormsModule, EncabezadoPaso],
  templateUrl: './empresa-album-marca.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumMarca {
  protected readonly borrador = inject(AlbumBorrador);
  private readonly estado = inject(SuscripcionEstado);
  private readonly auth = inject(AuthService);
  private readonly albumes = inject(AlbumesService);
  private readonly pagos = inject(PagosService);
  private readonly router = inject(Router);

  protected readonly redes = REDES_SOCIALES;
  protected readonly categorias = signal<CategoriaOpcion[]>([]);
  protected readonly maxKb = MAX_KB_IMAGEN;

  protected readonly intentado = signal(false);
  protected readonly modalAbierto = signal(false);
  protected readonly guardando = signal(false);

  protected readonly logoPreviewUrl = signal<string | null>(null);
  protected readonly localPreviewUrl = signal<string | null>(null);

  constructor() {
    // Si no eligió un plan, regresar al paso 1
    if (!this.estado.planElegido()) {
      this.router.navigate(['/empresa']);
      return;
    }

    // Prefill de email si no fue ingresado aún
    if (!this.borrador.emailContacto()) {
      this.borrador.emailContacto.set(this.auth.usuarioActual()?.email ?? '');
    }

    // Cargar categorías disponibles
    this.albumes.obtenerCategorias().subscribe({
      next: (lista) => this.mapearCategorias(lista),
      error: () => this.mapearCategorias(CATEGORIAS_RESPALDO),
    });

    // Mantener sincronizadas las URLs de preview de archivos
    effect((alLimpiar) => {
      const logo = this.borrador.logo();
      const local = this.borrador.fotoLocal();

      let urlLogo: string | null = null;
      let urlLocal: string | null = null;

      if (logo && typeof URL.createObjectURL === 'function') {
        urlLogo = URL.createObjectURL(logo);
      }
      if (local && typeof URL.createObjectURL === 'function') {
        urlLocal = URL.createObjectURL(local);
      }

      this.logoPreviewUrl.set(urlLogo);
      this.localPreviewUrl.set(urlLocal);

      alLimpiar(() => {
        if (urlLogo) URL.revokeObjectURL(urlLogo);
        if (urlLocal) URL.revokeObjectURL(urlLocal);
      });
    });
  }

  private mapearCategorias(lista: CategoriaApi[]): void {
    const mapeadas = lista.map((c) => ({ id: String(c.id), nombre: c.nombre }));
    this.categorias.set(mapeadas);

    if (mapeadas.length > 0 && !this.borrador.categoria()) {
      this.elegirCategoria(mapeadas[0].id);
    }
  }

  protected elegirCategoria(id: string): void {
    this.borrador.categoria.set(id);
    const cat = this.categorias().find((c) => c.id === id);
    this.borrador.categoriaNombre.set(cat ? cat.nombre : '');
  }

  protected seleccionarLogo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      toast.error('El logo debe ser una imagen (PNG, JPG o WEBP).');
      return;
    }
    if (archivo.size > this.maxKb * 1024) {
      toast.error(`El logo no puede superar los ${this.maxKb} KB.`);
      return;
    }
    this.borrador.logo.set(archivo);
  }

  protected quitarLogo(evento: MouseEvent): void {
    evento.stopPropagation();
    this.borrador.logo.set(null);
  }

  protected seleccionarFotoLocal(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      toast.error('La foto del local debe ser una imagen (PNG, JPG o WEBP).');
      return;
    }
    if (archivo.size > this.maxKb * 1024) {
      toast.error(`La foto del local no puede superar los ${this.maxKb} KB.`);
      return;
    }
    this.borrador.fotoLocal.set(archivo);
  }

  protected quitarFotoLocal(evento: MouseEvent): void {
    evento.stopPropagation();
    this.borrador.fotoLocal.set(null);
  }

  protected validarFormulario(): boolean {
    const b = this.borrador;
    if (!b.nombreMarca().trim()) {
      toast.error('Ingresá el nombre de tu marca.');
      return false;
    }
    if (!b.descripcion().trim()) {
      toast.error('Ingresá la descripción de tu marca.');
      return false;
    }
    if (!b.usuarioRedSocial().trim()) {
      toast.error('Ingresá el link o usuario de tu red social.');
      return false;
    }
    if (!b.emailContacto().trim() || !EMAIL_REGEX.test(b.emailContacto().trim())) {
      toast.error('Ingresá un mail de contacto válido.');
      return false;
    }
    if (!b.categoria()) {
      toast.error('Seleccioná la categoría a la que pertenece tu marca.');
      return false;
    }
    if (!b.logo()) {
      toast.error('Subí el logo de tu marca.');
      return false;
    }
    if (!b.fotoLocal()) {
      toast.error('Subí una foto del local de tu marca.');
      return false;
    }
    return true;
  }

  protected siguiente(): void {
    this.intentado.set(true);
    if (!this.validarFormulario()) return;

    // Despliega el popup modal
    this.modalAbierto.set(true);
  }

  protected irACrearAlbum(): void {
    this.modalAbierto.set(false);
    this.router.navigate(['/empresa/album/crear/album']);
  }

  protected omitirYPagar(): void {
    const plan = this.estado.planElegido();
    if (!plan) {
      toast.error('Seleccioná un plan antes de pagar.');
      this.router.navigate(['/empresa']);
      return;
    }

    if (this.guardando()) return;
    this.guardando.set(true);

    const b = this.borrador;
    // Persistimos primero los datos de la marca en el backend para que la cuenta quede creada
    this.albumes
      .guardarMarca({
        nombreMarca: b.nombreMarca().trim(),
        descripcion: b.descripcion().trim(),
        emailContacto: b.emailContacto().trim(),
        redSocial: b.redSocial(),
        usuarioRedSocial: b.usuarioRedSocial().trim(),
        categoriaId: Number(b.categoria()),
        logo: b.logo(),
        fotoLocal: b.fotoLocal(),
      })
      .subscribe({
        next: () => {
          // Tras guardar la marca, se inicia el pago del plan en Mercado Pago
          this.pagos.iniciarPago(plan.backendId).subscribe({
            next: (res) => {
              this.guardando.set(false);
              this.modalAbierto.set(false);
              this.pagos.redirigirACheckout(res.urlPago);
            },
            error: (err) => {
              this.guardando.set(false);
              toast.error(err?.error?.mensaje ?? 'Error al iniciar el pago con Mercado Pago.');
            },
          });
        },
        error: (err) => {
          this.guardando.set(false);
          toast.error(err?.error?.mensaje ?? 'Error al registrar los datos de la marca.');
        },
      });
  }
}
