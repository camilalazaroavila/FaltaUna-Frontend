import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { Header } from '../../compartidos/componentes/header/header';
import { CuponesService } from '../../servicios/cupones.service';
import {
  BeneficioPublico,
  CategoriaCupon,
  CuponDescuento,
  EstadoCupon,
} from '../../modelos/cupon.model';

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
 * Pantalla de cupones del usuario.
 * Incluye los cupones propios con QR y una pestaña separada de beneficios públicos.
 */
@Component({
  selector: 'app-usuario-cupones',
  standalone: true,
  imports: [RouterLink, DatePipe, Header],
  templateUrl: './usuario-cupones.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'cerrarCupon(); cerrarMenu()',
    '(document:click)': 'cerrarMenu()',
  },
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
  private readonly ruta = inject(ActivatedRoute);

  protected readonly categorias: readonly FiltroCategoria[] = [
    { id: 'gastronomia', nombre: 'Gastronomía', urlIcono: urlIconoGastro },
    { id: 'deco', nombre: 'Deco', urlIcono: urlIconoDeco },
    { id: 'cosmetica', nombre: 'Cosmética', urlIcono: urlIconoCosme },
    {
      id: 'indumentaria',
      nombre: 'Indumentaria',
      urlIcono: urlIconoIndumentaria,
    },
    {
      id: 'entretenimiento',
      nombre: 'Entretenimiento',
      urlIcono: urlIconoEntretenimiento,
    },
    { id: 'musica', nombre: 'Música', urlIcono: urlIconoMusica },
    { id: 'tecnologia', nombre: 'Tecnología', urlIcono: urlIconoTecno },
  ];

  protected readonly vistaActiva = signal<'mis-cupones' | 'beneficios'>(
    'mis-cupones',
  );

  protected readonly cupones = signal<CuponDescuento[]>([]);
  protected readonly beneficiosPublicos = signal<BeneficioPublico[]>([]);
  protected readonly beneficiosCargando = signal(false);
  protected readonly beneficiosError = signal<string | null>(null);

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly categoriaActiva = signal<CategoriaCupon>('gastronomia');

  /** Texto del buscador. */
  protected readonly busqueda = signal('');

  /** Estado elegido en el filtro; null significa todos. */
  protected readonly estadoActivo = signal<EstadoCupon | null>(null);
  protected readonly estados: readonly EstadoCupon[] = [
    'Disponible',
    'Usado',
    'Vencido',
  ];

  protected readonly menuAbierto = signal(false);

  protected readonly hayFiltros = computed(
    () => this.busqueda().trim() !== '' || this.estadoActivo() !== null,
  );

  protected readonly cuponSeleccionado = signal<CuponDescuento | null>(null);
  protected readonly urlQr = signal<string | null>(null);
  protected readonly tokenQr = signal<string | null>(null);
  protected readonly qrCargando = signal(false);
  protected readonly qrError = signal(false);

  protected readonly cuponesFiltrados = computed(() => {
    const categoria = this.categoriaActiva();
    const estado = this.estadoActivo();
    const texto = this.busqueda().trim().toLowerCase();

    return this.cupones().filter((c) => {
      if (c.categoria !== categoria) {
        return false;
      }

      if (estado !== null && c.estado !== estado) {
        return false;
      }

      if (texto !== '') {
        const marca = (c.marca || '').toLowerCase();
        const titulo = (c.titulo || '').toLowerCase();
        const descripcion = (c.descripcion || '').toLowerCase();
        const codigo = (c.codigo || '').toLowerCase();
        const detalles = (c.detalles || '').toLowerCase();

        const coincide =
          marca.includes(texto) ||
          titulo.includes(texto) ||
          descripcion.includes(texto) ||
          codigo.includes(texto) ||
          detalles.includes(texto);

        if (!coincide) {
          return false;
        }
      }

      return true;
    });
  });

  /** Beneficios públicos filtrados por el buscador. No tienen QR de FaltaUna. */
  protected readonly beneficiosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();

    return this.beneficiosPublicos().filter((beneficio) => {
      if (!texto) {
        return true;
      }

      return [
        beneficio.marca,
        beneficio.titulo,
        beneficio.descripcion,
        beneficio.codigo,
      ].some((valor) => (valor || '').toLowerCase().includes(texto));
    });
  });

  /** Categorías con cupones que coinciden con los filtros actuales. */
  protected readonly categoriasConResultados = computed(() => {
    const estado = this.estadoActivo();
    const texto = this.busqueda().trim().toLowerCase();

    if (!this.hayFiltros()) {
      return new Set<CategoriaCupon>();
    }

    const encontradas = new Set<CategoriaCupon>();

    for (const c of this.cupones()) {
      if (estado !== null && c.estado !== estado) {
        continue;
      }

      if (texto !== '') {
        const marca = (c.marca || '').toLowerCase();
        const titulo = (c.titulo || '').toLowerCase();
        const descripcion = (c.descripcion || '').toLowerCase();
        const codigo = (c.codigo || '').toLowerCase();
        const detalles = (c.detalles || '').toLowerCase();

        const coincide =
          marca.includes(texto) ||
          titulo.includes(texto) ||
          descripcion.includes(texto) ||
          codigo.includes(texto) ||
          detalles.includes(texto);

        if (!coincide) {
          continue;
        }
      }

      encontradas.add(c.categoria);
    }

    return encontradas;
  });

  /** Solo un cupón disponible tiene QR para mostrar. */
  protected readonly cuponUtilizable = computed(
    () => this.cuponSeleccionado()?.estado === 'Disponible',
  );

  constructor() {
    const destruir = inject(DestroyRef);

    destruir.onDestroy(() => this.liberarQr());

    this.escucharCategoriaDesdeUrl(destruir);
    this.cargarCupones();
    this.cargarBeneficiosPublicos();

    // Espera un instante después de escribir antes de consultar de nuevo.
    toObservable(this.busqueda)
      .pipe(
        skip(1),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(destruir),
      )
      .subscribe(() => {
        if (this.vistaActiva() === 'mis-cupones') {
          this.cargarCupones();
        }
      });
  }

  /**
   * Preselecciona la categoría indicada por ?categoria=.
   */
  private escucharCategoriaDesdeUrl(destruir: DestroyRef): void {
    this.ruta.queryParamMap
      .pipe(takeUntilDestroyed(destruir))
      .subscribe((params) => {
        const categoria = params.get('categoria');

        if (categoria && this.categorias.some((c) => c.id === categoria)) {
          this.categoriaActiva.set(categoria as CategoriaCupon);
        }
      });
  }

  /** Cambia entre los cupones propios y los beneficios públicos. */
  protected cambiarVista(
    vista: 'mis-cupones' | 'beneficios',
  ): void {
    this.vistaActiva.set(vista);
    this.menuAbierto.set(false);

    if (vista === 'mis-cupones') {
      this.cargarCupones();
    } else {
      this.cerrarCupon();
    }
  }

  /** Obtiene los beneficios informativos desde el catálogo del backend. */
  protected cargarBeneficiosPublicos(): void {
    this.beneficiosCargando.set(true);
    this.beneficiosError.set(null);

    this.cuponesService.obtenerBeneficiosPublicos().subscribe({
      next: (beneficios) => {
        this.beneficiosPublicos.set(beneficios);
        this.beneficiosCargando.set(false);
      },
      error: () => {
        this.beneficiosError.set(
          'No pudimos cargar los beneficios públicos. Verificá que el backend esté disponible.',
        );
        this.beneficiosCargando.set(false);
      },
    });
  }

  protected cargarCupones(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.cuponesService
      .obtenerMisCupones({
        buscar: this.busqueda(),
        estado: this.estadoActivo(),
      })
      .subscribe({
        next: (cupones) => {
          this.cupones.set(cupones);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set(
            'No pudimos cargar tus cupones. Probá de nuevo en un rato.',
          );
          this.cargando.set(false);
        },
      });
  }

  protected elegirCategoria(id: CategoriaCupon): void {
    this.categoriaActiva.set(id);
  }

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected escribirBusqueda(texto: string): void {
    this.busqueda.set(texto);
  }

  /** Volver a tocar el estado activo lo desactiva. */
  protected elegirEstado(estado: EstadoCupon): void {
    this.estadoActivo.set(
      this.estadoActivo() === estado ? null : estado,
    );
    this.menuAbierto.set(false);
    this.cargarCupones();
  }

  protected limpiarFiltros(): void {
    this.busqueda.set('');
    this.estadoActivo.set(null);
    this.menuAbierto.set(false);
    this.cargarCupones();
  }

  protected abrirCupon(cupon: CuponDescuento): void {
    this.liberarQr();
    this.cuponSeleccionado.set(cupon);
    this.qrError.set(false);

    if (cupon.estado !== 'Disponible') {
      return;
    }

    this.qrCargando.set(true);

    this.cuponesService.obtenerQr(cupon.id).subscribe({
      next: ({ imagen, token }) => {
        // Si se cerró o cambió el cupón, se descarta la respuesta.
        if (this.cuponSeleccionado()?.id !== cupon.id) {
          return;
        }

        this.tokenQr.set(token);
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

    if (!url || !cupon) {
      return;
    }

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `cupon-${cupon.marca
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-${cupon.codigo}.png`;
    enlace.click();
  }

  private liberarQr(): void {
    const url = this.urlQr();

    if (url) {
      URL.revokeObjectURL(url);
    }

    this.urlQr.set(null);
    this.tokenQr.set(null);
  }
}