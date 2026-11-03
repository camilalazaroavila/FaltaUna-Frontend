import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Header } from '@compartidos/componentes/layout/header/header';
import { TarjetaUsuario } from '@compartidos/componentes/intercambio/tarjeta-usuario/tarjeta-usuario';
import {
  CategoriaOpcion,
  ColeccionOpcion,
  IntercambioService,
} from '@servicios/intercambio.service';
import type { Coleccionista } from '@modelos/intercambio.model';

@Component({
  selector: 'app-intercambio-coleccionistas',
  standalone: true,
  imports: [Header, RouterLink, TarjetaUsuario],
  templateUrl: './intercambio-coleccionistas.html',
  styleUrl: './intercambio-coleccionistas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntercambioColeccionistas implements OnInit {
  private readonly intercambioService = inject(IntercambioService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly coleccionistas = signal<readonly Coleccionista[]>([]);

  // Opciones cargadas dinámicamente desde el backend
  protected readonly categorias = signal<readonly CategoriaOpcion[]>([]);
  protected readonly colecciones = signal<readonly ColeccionOpcion[]>([]);

  // Filtros seleccionados (IDs seleccionados o null)
  protected readonly categoriaSeleccionadaId = signal<number | null>(null);
  protected readonly coleccionSeleccionadaId = signal<number | null>(null);

  // Estados de retracción/colapso de secciones de filtros
  // En desktop (>= 1024px) inician expandidos; el usuario puede retraerlos
  protected readonly categoriasRetraidas = signal(false);
  protected readonly albumesRetraidos = signal(false);

  // En pantallas pequeñas (<= 768px / < 1024px) inician colapsados por defecto para no molestar la vista
  protected readonly filtrosMobileAbiertos = signal(false);

  protected readonly etiquetaCategoria = computed(() => {
    const id = this.categoriaSeleccionadaId();
    if (!id) return 'Categoría';
    const cat = this.categorias().find((c) => c.id === id);
    return cat ? cat.nombre : 'Categoría';
  });

  protected readonly etiquetaColeccion = computed(() => {
    const id = this.coleccionSeleccionadaId();
    if (!id) return 'Álbum';
    const col = this.colecciones().find((c) => c.id === id);
    return col ? col.nombre : 'Álbum';
  });

  protected readonly hayFiltrosActivos = computed(
    () => this.categoriaSeleccionadaId() !== null || this.coleccionSeleccionadaId() !== null,
  );

  protected readonly cantidadFiltrosActivos = computed(() => {
    let cant = 0;
    if (this.categoriaSeleccionadaId() !== null) cant++;
    if (this.coleccionSeleccionadaId() !== null) cant++;
    return cant;
  });

  ngOnInit(): void {
    this.cargarFiltros();
    this.cargarColeccionistas();
  }

  cargarFiltros(): void {
    this.intercambioService.obtenerCategorias().subscribe({
      next: (cats) => this.categorias.set(cats),
    });

    this.intercambioService.obtenerColecciones().subscribe({
      next: (cols) => this.colecciones.set(cols),
    });
  }

  cargarColeccionistas(): void {
    this.cargando.set(true);
    this.intercambioService
      .obtenerColeccionistas({
        categoriaId: this.categoriaSeleccionadaId(),
        coleccionId: this.coleccionSeleccionadaId(),
      })
      .subscribe({
        next: (lista) => {
          this.coleccionistas.set(lista);
          this.cargando.set(false);
        },
        error: () => {
          this.coleccionistas.set([]);
          this.cargando.set(false);
        },
      });
  }

  toggleFiltrosMobile(): void {
    this.filtrosMobileAbiertos.update((v) => !v);
  }

  toggleCategoriasRetraidas(): void {
    this.categoriasRetraidas.update((v) => !v);
  }

  toggleAlbumesRetraidos(): void {
    this.albumesRetraidos.update((v) => !v);
  }

  toggleFiltroCategoria(id: number): void {
    if (this.categoriaSeleccionadaId() === id) {
      this.seleccionarCategoria(null);
    } else {
      this.seleccionarCategoria(id);
    }
  }

  toggleFiltroColeccion(id: number): void {
    if (this.coleccionSeleccionadaId() === id) {
      this.seleccionarColeccion(null);
    } else {
      this.seleccionarColeccion(id);
    }
  }

  seleccionarCategoria(id: number | null): void {
    this.categoriaSeleccionadaId.set(id);
    this.cargarColeccionistas();
  }

  seleccionarColeccion(id: number | null): void {
    this.coleccionSeleccionadaId.set(id);
    this.cargarColeccionistas();
  }

  limpiarFiltros(): void {
    this.categoriaSeleccionadaId.set(null);
    this.coleccionSeleccionadaId.set(null);
    this.cargarColeccionistas();
  }

  iniciarIntercambio(coleccionista: Coleccionista): void {
    this.intercambioService.seleccionarColeccionista(coleccionista);
    this.router.navigate(['/usuario/intercambio/ofrecer', coleccionista.id]);
  }
}
