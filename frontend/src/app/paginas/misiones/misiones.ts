import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from 'ngx-sonner';

import { DesplegableSeleccion, type OpcionDesplegable } from '../../compartidos/componentes/desplegable-seleccion/desplegable-seleccion';
import { FlujoAperturaSobres, type SobreInicialApertura } from '../../compartidos/componentes/flujo-apertura-sobres/flujo-apertura-sobres';
import { PanelMisiones, type SeccionMisiones } from '../../compartidos/componentes/panel-misiones/panel-misiones';
import { Header } from '../../compartidos/componentes/header/header';
import { TarjetaMision } from '../../compartidos/componentes/tarjeta-mision/tarjeta-mision';
import { TarjetaPity } from '../../compartidos/componentes/tarjeta-pity/tarjeta-pity';
import { CATEGORIAS_SOBRE, ETIQUETAS_CATEGORIA } from '../../modelos/categoria.model';
import {
  ETIQUETAS_PERIODICIDAD,
  PERIODICIDADES,
  categoriaDeSobre,
  faltantesPity,
  type Mision,
  type Periodicidad,
  type ProgresoPity,
  type SobreReferencia,
} from '../../modelos/misiones.model';
import type { SobreRespuesta } from '../../modelos/sobre.model';
import { AuthService } from '../../servicios/auth.service';
import { MisionesService } from '../../servicios/mision.services';
import { SobresService } from '../../servicios/sobres.service';

type CriterioOrdenPity = 'cercania' | 'nombre';

/**
 * Vista de Misiones del jugador: una sección de misiones (con pestañas por
 * periodicidad) y una de PT System (con filtros y orden). El panel lateral
 * alterna entre ambas.
 */
@Component({
  selector: 'app-misiones',
  imports: [NgIcon, DesplegableSeleccion, PanelMisiones, TarjetaMision, TarjetaPity, Header, FlujoAperturaSobres],
  templateUrl: './misiones.html',
  styleUrl: './misiones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Misiones implements OnInit {
  private readonly servicio = inject(MisionesService);
  private readonly sobresService = inject(SobresService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly periodicidades = PERIODICIDADES;
  protected readonly etiquetasPeriodicidad = ETIQUETAS_PERIODICIDAD;

  protected readonly seccionActiva = signal<SeccionMisiones>('misiones');
  protected readonly periodicidadActiva = signal<Periodicidad>('diaria');

  protected readonly categoriaPity = signal<string | null>(null);
  protected readonly marcaPity = signal<string | null>(null);
  protected readonly ordenPity = signal<CriterioOrdenPity>('cercania');

  /** Id de la misión cuyo reclamo está en vuelo; evita el doble clic. */
  private readonly reclamando = signal<number | null>(null);

  protected readonly opcionesOrden: readonly OpcionDesplegable[] = [
    { valor: 'cercania', etiqueta: 'Más cerca de la legendaria' },
    { valor: 'nombre', etiqueta: 'Nombre (A-Z)' },
  ];

  /** Catálogo de sobres del backend para el modal de apertura (puede quedar vacío). */
  protected readonly sobresCatalogo = signal<SobreRespuesta[]>([]);
  protected readonly modalAperturaAbierto = signal(false);
  /** Sobre con el que abrir el modal tras reclamar (lo resuelve el modal contra el catálogo). */
  protected readonly sobreReclamado = signal<SobreInicialApertura | null>(null);

  ngOnInit(): void {
    this.cargarSobres();
  }

  private cargarSobres(): void {
    this.sobresService.obtenerSobres().subscribe({
      next: (sobres) => this.sobresCatalogo.set(sobres),
      error: () => {
        // Si el backend no responde, el modal cae al sobre genérico.
      },
    });
  }

  protected misionesDe(periodicidad: Periodicidad): readonly Mision[] {
    return this.servicio.misionesDe(periodicidad);
  }

  /**
   * Resumen "N de M completadas" por pestaña. Cuenta como completada toda
   * misión en estado `completada` o `reclamada`; las misiones no disponibles
   * ("Próximamente") no suman ni al numerador ni al total.
   */
  protected resumenDe(periodicidad: Periodicidad): { completadas: number; total: number } {
    const disponibles = this.misionesDe(periodicidad).filter((mision) => mision.disponible);
    const completadas = disponibles.filter(
      (mision) => mision.estado === 'completada' || mision.estado === 'reclamada',
    ).length;
    return { completadas, total: disponibles.length };
  }

  /** Todas las categorías del catálogo (no solo las que tienen fila en el PT). */
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
      // El filtro por categoría incluye la fila de esa categoría y las marcas
      // que pertenecen a ella; los sobres genéricos quedan afuera.
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

  private etiquetaDeSobre(progreso: ProgresoPity): string {
    const sobre = progreso.sobre;
    if (sobre.tipo === 'categoria') return ETIQUETAS_CATEGORIA[sobre.categoria];
    if (sobre.tipo === 'marca') return sobre.nombre;
    return 'Sobres generales';
  }

  protected cambiarSeccion(seccion: SeccionMisiones): void {
    this.seccionActiva.set(seccion);
  }

  protected cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  protected cambiarPeriodicidad(periodicidad: Periodicidad): void {
    this.periodicidadActiva.set(periodicidad);
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

  protected reclamarMision(id: number): void {
    if (this.reclamando() !== null) return;
    this.reclamando.set(id);

    this.servicio.reclamar(id).subscribe({
      next: (mision) => {
        this.reclamando.set(null);
        toast.success('¡Recompensa reclamada! Ya está en tu colección.');
        this.abrirAperturaDeMision(mision);
      },
      error: (error: Error) => {
        this.reclamando.set(null);
        toast.error(error.message ?? 'No pudimos reclamar la recompensa.');
      },
    });
  }

  /**
   * Abre el modal de apertura sobre la recompensa reclamada. `iniciar()` del
   * modal no toca el backend: solo la animación de corte dispara la apertura.
   * Si el jugador cierra el modal sin cortar, la misión ya quedó reclamada y el
   * sobre se pierde (comportamiento aceptado con datos de prueba).
   */
  private abrirAperturaDeMision(mision: Mision): void {
    this.sobreReclamado.set(this.descriptorApertura(mision.recompensa));
    this.modalAperturaAbierto.set(true);
  }

  protected cerrarAperturaSobres(): void {
    this.modalAperturaAbierto.set(false);
  }

  /** Traduce la recompensa de una misión al descriptor que consume el modal. */
  private descriptorApertura(recompensa: SobreReferencia | null): SobreInicialApertura | null {
    if (!recompensa) return null;
    switch (recompensa.tipo) {
      case 'categoria':
        return { tipo: 'CATEGORIA', etiqueta: ETIQUETAS_CATEGORIA[recompensa.categoria] };
      case 'marca':
        return { tipo: 'MARCA', etiqueta: recompensa.nombre };
      default:
        return { tipo: 'GENERAL' };
    }
  }

  /** Navegación con flechas entre pestañas (patrón tablist). */
  protected alTecladoPestanas(evento: KeyboardEvent, indice: number): void {
    const total = this.periodicidades.length;
    let destino: number;

    switch (evento.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        destino = (indice + 1) % total;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        destino = (indice - 1 + total) % total;
        break;
      case 'Home':
        destino = 0;
        break;
      case 'End':
        destino = total - 1;
        break;
      default:
        return;
    }

    evento.preventDefault();
    const periodicidad = this.periodicidades[destino];
    this.cambiarPeriodicidad(periodicidad);
    document.getElementById(`pestana-${periodicidad}`)?.focus();
  }
}
