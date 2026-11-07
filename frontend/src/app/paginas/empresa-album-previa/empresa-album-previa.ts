import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumesService } from '@servicios/albumes.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import {
  categoriaCartaDesdeNombre,
  ETIQUETA_RAREZA,
  type Carta,
  type RarezaCarta,
} from '@modelos/carta.model';
import { categoriaCuponDesdeCarta, type CuponDescuento } from '@modelos/cupon.model';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { EncabezadoPaso } from '@compartidos/componentes/controles/encabezado-paso/encabezado-paso';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { TarjetaCupon } from '@compartidos/componentes/cupones/tarjeta-cupon/tarjeta-cupon';

const RAREZAS: readonly RarezaCarta[] = ['comun', 'rara', 'epicarta', 'legendaria'];

interface CartaPrevia {
  /** Posición de la imagen en la grilla del paso 2 (es la clave de su rareza). */
  indice: number;
  carta: Carta;
}

/**
 * Paso 5 del alta: vista previa del álbum tal como lo van a ver los jugadores.
 * Cada imagen se muestra como carta y la empresa puede cambiar su tipo (rareza).
 * Al confirmar se crea el álbum.
 */
@Component({
  selector: 'app-empresa-album-previa',
  standalone: true,
  imports: [Boton, NgIcon, EncabezadoPaso, CartaComponent, TarjetaCupon],
  templateUrl: './empresa-album-previa.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumPrevia {
  protected readonly borrador = inject(AlbumBorrador);
  private readonly albumes = inject(AlbumesService);
  private readonly estado = inject(SuscripcionEstado);
  private readonly router = inject(Router);

  protected readonly rarezas = RAREZAS.map((valor) => ({ valor, etiqueta: ETIQUETA_RAREZA[valor] }));
  protected readonly enviando = signal(false);

  /** URLs locales de las imágenes subidas (una por casilla; null si está vacía). */
  private readonly urls = signal<(string | null)[]>([]);

  protected readonly cartas = computed<CartaPrevia[]>(() => {
    const categoria = categoriaCartaDesdeNombre(this.borrador.categoriaNombre());
    const urls = this.urls();
    const resultado: CartaPrevia[] = [];
    this.borrador.imagenes().forEach((archivo, indice) => {
      const url = urls[indice];
      if (!archivo || !url) return;
      resultado.push({
        indice,
        carta: {
          id: `previa-${indice}`,
          nombre: `Carta ${resultado.length + 1}`,
          imagenUrl: url,
          rareza: this.borrador.rarezaDe(indice),
          categoria,
          // Costo y poder los define el equipo de Falta Una; acá solo son de relleno.
          atributoIzquierdo: 10,
          atributoDerecho: 10,
          obtenida: true,
        },
      });
    });
    return resultado;
  });

  protected readonly logoUrl = signal<string | null>(null);

  protected readonly cupon = computed<CuponDescuento>(() => {
    const b = this.borrador;
    const porcentaje = Number(b.cuponDescuento());
    return {
      id: 0,
      marca: b.nombreMarca().trim(),
      categoria: categoriaCuponDesdeCarta(categoriaCartaDesdeNombre(b.categoriaNombre())),
      titulo: b.cuponNombre().trim(),
      descripcion: b.cuponDescripcion().trim(),
      detalles: `${porcentaje}% de descuento`,
      codigo: 'XXXX-XXXX-XXXX',
      vigenteHastaUtc: b.fechaFin(),
      estado: 'Disponible',
      enlace: null,
      porcentajeDescuento: porcentaje,
    };
  });

  constructor() {
    // Si recargó la página se pierden los archivos del paso 2: volver a empezar ahí.
    if (!this.borrador.marcaCompleta()) {
      this.router.navigate(['/empresa/album/crear/marca']);
    }

    effect((alLimpiar) => {
      if (typeof URL.createObjectURL !== 'function') return;
      const urls = this.borrador.imagenes().map((f) => (f ? URL.createObjectURL(f) : null));
      const logo = this.borrador.logo();
      const urlLogo = logo ? URL.createObjectURL(logo) : null;
      this.urls.set(urls);
      this.logoUrl.set(urlLogo);
      alLimpiar(() => {
        urls.forEach((u) => u && URL.revokeObjectURL(u));
        if (urlLogo) URL.revokeObjectURL(urlLogo);
      });
    });
  }

  protected cambiarRareza(indice: number, valor: string): void {
    this.borrador.cambiarRareza(indice, valor as RarezaCarta);
  }

  protected crearAlbum(): void {
    const b = this.borrador;
    const referencia = this.estado.ultimoPago()?.referenciaExterna ?? this.estado.referenciaGuardada();
    const logo = b.logo();
    const fotoLocal = b.fotoLocal();

    if (!logo || !fotoLocal || !referencia) {
      toast.error('Faltan datos de los pasos anteriores. Volvé a completarlos.');
      this.router.navigate(['/empresa/album/crear/marca']);
      return;
    }

    // Las rarezas viajan en el mismo orden que las imágenes que se envían.
    const subidas = b.imagenes().flatMap((archivo, indice) => (archivo ? [{ archivo, indice }] : []));

    this.enviando.set(true);
    this.albumes
      .crear({
        referenciaPago: referencia,
        nombreMarca: b.nombreMarca().trim(),
        logo,
        fotoLocal,
        imagenes: subidas.map((s) => s.archivo),
        rarezas: subidas.map((s) => b.rarezaDe(s.indice)),
        cupon: {
          nombre: b.cuponNombre().trim(),
          descripcion: b.cuponDescripcion().trim(),
          porcentajeDescuento: Number(b.cuponDescuento()),
        },
        descripcion: b.descripcion().trim(),
        redSocial: b.redSocial(),
        usuarioRedSocial: b.usuarioRedSocial().trim(),
        emailContacto: b.emailContacto().trim(),
        categoriaId: Number(b.categoria()),
        fechaInicio: b.fechaInicio(),
        fechaFin: b.fechaFin(),
      })
      .subscribe({
        next: () => {
          b.limpiar();
          // El alta quedó completa (álbum creado): el panel ya es accesible.
          this.estado.marcarAltaCompletada();
          // El pago quedó consumido (un pago = un álbum): se descarta para no volver a usarlo.
          this.estado.ultimoPago.set(null);
          this.router.navigate(['/empresa/album/crear/listo']);
        },
        error: (err) => {
          this.enviando.set(false);
          toast.error(this.motivoDelError(err));
        },
      });
  }

  /**
   * Arma el mensaje a partir de lo que devuelve el backend:
   *  - errores de negocio: `{ mensaje }` (ManejadorErroresMiddleware)
   *  - errores de validación del modelo (400): `{ errors: { Campo: ["texto"] } }`
   */
  private motivoDelError(err: unknown): string {
    const cuerpo = (err as { error?: { mensaje?: string; message?: string; errors?: Record<string, string[]> } })?.error;
    if (cuerpo?.mensaje) return cuerpo.mensaje;
    if (cuerpo?.message) return cuerpo.message;
    if (cuerpo?.errors) {
      const textos = Object.values(cuerpo.errors).flat();
      if (textos.length > 0) return textos.slice(0, 3).join(' ');
    }
    return 'No se pudo crear el álbum. Intentá de nuevo.';
  }
}