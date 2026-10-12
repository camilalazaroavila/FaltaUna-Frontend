import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from 'ngx-sonner';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumesService } from '@servicios/albumes.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import { CATEGORIAS_RESPALDO, CategoriaApi, REDES_SOCIALES } from '@modelos/album.model';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { CalendarioMensual } from '@compartidos/componentes/calendario-mensual/calendario-mensual';
import { CampoSelect, OpcionSelect } from '@compartidos/componentes/controles/campo-select/campo-select';
import { CampoTexto } from '@compartidos/componentes/controles/campo-texto/campo-texto';
import { EncabezadoPaso } from '@compartidos/componentes/encabezado-paso/encabezado-paso';
import { EtiquetaCampo } from '@compartidos/componentes/etiqueta-campo/etiqueta-campo';
import { aIso } from '@compartidos/utilidades/fechas';

type Errores = Partial<Record<
  'descripcion' | 'usuarioRedSocial' | 'emailContacto' | 'categoria' | 'fechaInicio' | 'fechaFin',
  string
>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Paso 4 del alta: datos de identidad de la marca y fechas del álbum. Al finalizar crea el álbum. */
@Component({
  selector: 'app-empresa-album-identidad',
  standalone: true,
  imports: [FormsModule, Boton, NgIcon, CalendarioMensual, CampoSelect, CampoTexto, EncabezadoPaso, EtiquetaCampo],
  templateUrl: './empresa-album-identidad.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaAlbumIdentidad {
  protected readonly borrador = inject(AlbumBorrador);
  private readonly albumes = inject(AlbumesService);
  private readonly estado = inject(SuscripcionEstado);
  private readonly router = inject(Router);

  protected readonly redes = REDES_SOCIALES;
  protected readonly categorias = signal<OpcionSelect[]>([]);
  protected readonly hoy = aIso(new Date());

  protected readonly intentado = signal(false);
  protected readonly enviando = signal(false);

  constructor() {
    this.albumes.obtenerCategorias().subscribe({
      next: (lista) => this.mostrarCategorias(lista),
      // Backend sin el endpoint de categorías: se usa la lista de respaldo.
      error: () => this.mostrarCategorias(CATEGORIAS_RESPALDO),
    });

    // Si recargó la página se pierden los archivos del paso 3: volver a empezar ahí.
    if (!this.borrador.marcaCompleta()) {
      this.router.navigate(['/empresa/album/crear/marca']);
    }
  }

  private mostrarCategorias(lista: CategoriaApi[]): void {
    this.categorias.set(lista.map((c) => ({ valor: String(c.id), etiqueta: c.nombre })));
  }

  protected errores(): Errores {
    if (!this.intentado()) return {};
    const b = this.borrador;
    const e: Errores = {};
    if (!b.descripcion().trim()) e.descripcion = 'Contanos qué hace tu marca.';
    if (!b.usuarioRedSocial().trim()) e.usuarioRedSocial = 'Ingresá tu usuario o link.';
    if (!EMAIL.test(b.emailContacto().trim())) e.emailContacto = 'Ingresá un mail de contacto válido.';
    if (!b.categoria()) e.categoria = 'Elegí una categoría.';
    if (!b.fechaInicio()) e.fechaInicio = 'Elegí la fecha de inicio.';
    else if (b.fechaInicio() < this.hoy) e.fechaInicio = 'La fecha de inicio no puede ser pasada.';
    if (!b.fechaFin()) e.fechaFin = 'Elegí la fecha de fin.';
    else if (b.fechaInicio() && b.fechaFin() < b.fechaInicio()) {
      e.fechaFin = 'El fin tiene que ser posterior al inicio.';
    }
    return e;
  }

  protected finalizar(): void {
    this.intentado.set(true);
    const b = this.borrador;
    const referencia = this.estado.ultimoPago()?.referenciaExterna ?? this.estado.referenciaGuardada();

    if (Object.keys(this.errores()).length > 0) {
      toast.error('Revisá los campos marcados.');
      return;
    }
    const logo = b.logo();
    if (!logo || !referencia) {
      toast.error('Faltan datos del paso anterior. Volvé a completarlo.');
      this.router.navigate(['/empresa/album/crear/marca']);
      return;
    }

    this.enviando.set(true);
    this.albumes
      .crear({
        referenciaPago: referencia,
        nombreMarca: b.nombreMarca().trim(),
        logo,
        imagenes: b.imagenes().filter((i): i is File => !!i),
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