import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  DesplegableSeleccion,
  type OpcionDesplegable,
} from '@compartidos/componentes/controles/desplegable-seleccion/desplegable-seleccion';
import { Header } from '@compartidos/componentes/layout/header/header';
import { TarjetaPity } from '@compartidos/componentes/usuario/tarjeta-pity/tarjeta-pity';
import { CATEGORIAS_SOBRE, ETIQUETAS_CATEGORIA } from '@modelos/categoria.model';
import {
  categoriaDeSobre,
  faltantesPity,
  type ProgresoPity,
} from '@modelos/misiones.model';
import { MisionesService } from '@servicios/mision.services';

type CriterioOrdenPity = 'cercania' | 'nombre';

/**
 * Vista independiente de PT System (`/usuario/misiones/pity`): muestra el progreso
 * hacia la carta legendaria garantizada por tipo de sobre, con filtros y orden.
 */
@Component({
  selector: 'app-misiones-pity',
  imports: [DesplegableSeleccion, TarjetaPity, Header, RouterLink],
  templateUrl: './misiones-pity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisionesPity implements OnInit {
  private readonly servicio = inject(MisionesService);

  protected readonly cargando = this.servicio.cargando;
  protected readonly error = this.servicio.error;

  protected readonly categoriaPity = signal<string | null>(null);
  protected readonly marcaPity = signal<string | null>(null);
  protected readonly ordenPity = signal<CriterioOrdenPity>('cercania');
  protected readonly modalPityAbierto = signal<boolean>(false);

  protected readonly opcionesOrden: readonly OpcionDesplegable[] = [
    { valor: 'cercania', etiqueta: 'Más cerca de legendaria' },
    { valor: 'nombre', etiqueta: 'Nombre' },
  ];

  protected readonly opcionesCategoria: readonly OpcionDesplegable[] = CATEGORIAS_SOBRE.map(
    (categoria) => ({ valor: categoria, etiqueta: ETIQUETAS_CATEGORIA[categoria] }),
  );

  protected readonly opcionesMarca = computed<readonly OpcionDesplegable[]>(() => {
    const vistas = new Set<string>();
    const opciones: OpcionDesplegable[] = [];
    for (const progreso of this.servicio.pity()) {
      if (progreso.sobre.tipo === 'marca' && !vistas.has(progreso.sobre.nombre)) {
        vistas.add(progreso.sobre.nombre);
        opciones.push({ valor: progreso.sobre.nombre, etiqueta: progreso.sobre.nombre });
      }
    }
    return opciones.sort((a, b) => a.etiqueta.localeCompare(b.etiqueta, 'es'));
  });

  protected readonly hayFiltrosPity = computed(
    () => this.categoriaPity() !== null || this.marcaPity() !== null,
  );

  protected readonly pityFiltrado = computed<readonly ProgresoPity[]>(() => {
    let lista = [...this.servicio.pity()];

    const categoria = this.categoriaPity();
    if (categoria) {
      lista = lista.filter((p) => categoriaDeSobre(p.sobre) === categoria);
    }

    const marca = this.marcaPity();
    if (marca) {
      lista = lista.filter((p) => p.sobre.tipo === 'marca' && p.sobre.nombre === marca);
    }

    const orden = this.ordenPity();
    return lista.sort((a, b) =>
      orden === 'cercania'
        ? faltantesPity(a) - faltantesPity(b)
        : this.etiquetaDeSobre(a).localeCompare(this.etiquetaDeSobre(b), 'es'),
    );
  });

  ngOnInit(): void {
    if (this.servicio.pity().length === 0) {
      this.cargar();
    }
  }

  protected cargar(): void {
    this.servicio.cargarMisiones().subscribe({
      error: () => {
        // El servicio expone `error()` para mostrar el estado con reintento.
      },
    });
  }

  private etiquetaDeSobre(progreso: ProgresoPity): string {
    const sobre = progreso.sobre;
    if (sobre.tipo === 'categoria') return ETIQUETAS_CATEGORIA[sobre.categoria];
    if (sobre.tipo === 'marca') return sobre.nombre;
    return 'Sobres generales';
  }

  protected cambiarCategoria(valor: string | null): void {
    this.categoriaPity.set(valor);
  }

  protected cambiarMarca(valor: string | null): void {
    this.marcaPity.set(valor);
  }

  protected cambiarOrden(valor: string | null): void {
    this.ordenPity.set(valor === 'nombre' ? 'nombre' : 'cercania');
  }

  protected limpiarFiltrosPity(): void {
    this.categoriaPity.set(null);
    this.marcaPity.set(null);
  }

  protected abrirModalPity(): void {
    this.modalPityAbierto.set(true);
  }

  protected cerrarModalPity(): void {
    this.modalPityAbierto.set(false);
  }
}

