import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { toast } from 'ngx-sonner';

import { RouterLink } from '@angular/router';
import { DesplegableSeleccion, type OpcionDesplegable } from '@compartidos/componentes/controles/desplegable-seleccion/desplegable-seleccion';
import { FlujoAperturaSobres, type SobreInicialApertura } from '@compartidos/componentes/cartas/flujo-apertura-sobres/flujo-apertura-sobres';
import { PanelMisiones, type SeccionMisiones } from '@compartidos/componentes/usuario/panel-misiones/panel-misiones';
import { Header } from '@compartidos/componentes/layout/header/header';
import { TarjetaMision } from '@compartidos/componentes/usuario/tarjeta-mision/tarjeta-mision';
import { TarjetaPity } from '@compartidos/componentes/usuario/tarjeta-pity/tarjeta-pity';
import { CATEGORIAS_SOBRE, ETIQUETAS_CATEGORIA } from '@modelos/categoria.model';
import {
  ETIQUETAS_PERIODICIDAD,
  PERIODICIDADES,
  categoriaDeSobre,
  faltantesPity,
  type Mision,
  type Periodicidad,
  type ProgresoPity,
  type RecompensaMisionRespuesta,
  type SobreReferencia,
} from '@modelos/misiones.model';
import type { SobreRespuesta } from '@modelos/sobre.model';

import { AuthService } from '@servicios/auth.service';
import { MisionesService } from '@servicios/mision.services';
import { SobresService, type SobreInventarioUsuario } from '@servicios/sobres.service';
import { SONIDOS_PARTIDA, SonidoService } from '@servicios/sonido.service';


type CriterioOrdenPity = 'cercania' | 'nombre';

/**
 * Vista de Misiones del jugador: una sección de misiones (con pestañas por
 * periodicidad) y una de PT System (con filtros y orden). El panel lateral
 * alterna entre ambas.
 */
@Component({
  selector: 'app-misiones',
  imports: [NgIcon, DesplegableSeleccion, PanelMisiones, TarjetaMision, TarjetaPity, Header, FlujoAperturaSobres, RouterLink],
  templateUrl: './misiones.html',
  styleUrl: './misiones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Misiones implements OnInit {
  private readonly servicio = inject(MisionesService);
  private readonly sobresService = inject(SobresService);
  private readonly authService = inject(AuthService);
  private readonly sonido = inject(SonidoService);

  private readonly router = inject(Router);

  protected readonly periodicidades = PERIODICIDADES;
  protected readonly etiquetasPeriodicidad = ETIQUETAS_PERIODICIDAD;

  protected readonly seccionActiva = signal<SeccionMisiones>('misiones');
  protected readonly periodicidadActiva = signal<Periodicidad>('diaria');

  /** Estado de la carga real de misiones. */
  protected readonly cargando = this.servicio.cargando;
  protected readonly error = this.servicio.error;

  protected readonly categoriaPity = signal<string | null>(null);
  protected readonly marcaPity = signal<string | null>(null);
  protected readonly ordenPity = signal<CriterioOrdenPity>('cercania');
  protected readonly modalPityAbierto = signal(false);

  /** Id de la misión cuyo reclamo está en vuelo; evita el doble clic. */
  private readonly reclamando = signal<number | null>(null);

  protected readonly opcionesOrden: readonly OpcionDesplegable[] = [
    { valor: 'cercania', etiqueta: 'Más cerca de la legendaria' },
    { valor: 'nombre', etiqueta: 'Nombre (A-Z)' },
  ];

  /** Catálogo de sobres del backend para el modal de apertura (puede quedar vacío). */
  protected readonly sobresCatalogo = signal<SobreRespuesta[]>([]);
  /** Sobres que el usuario tiene en el inventario (incluye la recompensa reclamada). */
  protected readonly sobresInventario = signal<readonly SobreInventarioUsuario[]>([]);
  /** Cargas diarias disponibles: la grilla del modal no debe ofrecer de más. */
  protected readonly sobresDiariosDisponibles = computed(
    () => this.sobresService.sobresDisponibles().actuales,
  );
  protected readonly modalAperturaAbierto = signal(false);
  /** Sobre con el que abrir el modal tras reclamar; se resuelve por id. */
  protected readonly sobreReclamado = signal<SobreInicialApertura | null>(null);

  ngOnInit(): void {
    this.cargarMisiones();
    this.cargarSobres();
    this.cargarInventario();
    this.cargarEstadoDiario();
  }

  protected cargarMisiones(): void {
    this.servicio.cargarMisiones().subscribe({
      error: () => {
        // El servicio ya expone `error()`; la vista muestra el estado con reintento.
      },
    });
  }

  private cargarSobres(): void {
    this.sobresService.obtenerSobres().subscribe({
      next: (sobres) => this.sobresCatalogo.set(sobres),
      error: () => {
        // Si el backend no responde, el modal puede resolver contra el inventario.
      },
    });
  }

  private cargarInventario(): void {
    const usuarioId = this.authService.usuarioActual()?.id;
    if (usuarioId === undefined) {
      this.sobresInventario.set([]);
      return;
    }

    this.sobresService.obtenerInventarioSobres(usuarioId).subscribe({
      next: (inventario) => this.sobresInventario.set(inventario),
      error: () => this.sobresInventario.set([]),
    });
  }

  private cargarEstadoDiario(): void {
    const usuarioId = this.authService.usuarioActual()?.id;
    if (usuarioId === undefined) return;

    this.sobresService.cargarEstadoDiario(usuarioId).subscribe({
      error: () => {
        // Si falla, el modal conserva el último estado conocido.
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

  protected abrirModalPity(): void {
    this.modalPityAbierto.set(true);
  }

  protected cerrarModalPity(): void {
    this.modalPityAbierto.set(false);
  }

  protected reclamarMision(id: number): void {
    if (this.reclamando() !== null) return;

    const mision = this.servicio.misiones().find((m) => m.id === id);
    const descriptor = mision ? this.descriptorApertura(mision.recompensa) : null;
    this.reclamando.set(id);

    this.servicio.reclamar(id).subscribe({
      next: (recompensa) => {
        this.reclamando.set(null);
        this.sonido.reproducir(SONIDOS_PARTIDA.misionCompletada);
        toast.success('¡Recompensa reclamada! Ya está en tu colección.');
        this.cargarMisiones();
        this.cargarInventario();
        this.abrirAperturaDeMision(recompensa, descriptor);
      },
      error: (error: Error) => {
        this.reclamando.set(null);
        toast.error(error.message ?? 'No pudimos reclamar la recompensa.');
      },
    });
  }

  /**
   * Abre el modal directamente sobre el sobre acreditado. Se usa su `sobreId`
   * para que nunca se confunda con un sobre diario (que tiene su propio límite).
   */
  private abrirAperturaDeMision(
    recompensa: RecompensaMisionRespuesta,
    descriptor: SobreInicialApertura | null,
  ): void {
    this.sobreReclamado.set({
      sobreId: recompensa.sobreId,
      tipo: descriptor?.tipo ?? 'GENERAL',
      etiqueta: descriptor?.etiqueta,
    });
    this.modalAperturaAbierto.set(true);
  }

  /** Abrir el sobre hace avanzar misiones y consume inventario. */
  protected alAbrirSobreRecompensa(): void {
    this.cargarMisiones();
    this.cargarInventario();
    this.cargarEstadoDiario();
  }

  protected cerrarAperturaSobres(): void {
    this.modalAperturaAbierto.set(false);
    this.sobreReclamado.set(null);
  }

  /** Traduce la recompensa de una misión al descriptor que consume el modal. */
  private descriptorApertura(recompensa: SobreReferencia | null): SobreInicialApertura | null {
    if (!recompensa || recompensa.sobreId === undefined) return null;

    switch (recompensa.tipo) {
      case 'categoria':
        return {
          sobreId: recompensa.sobreId,
          tipo: 'CATEGORIA',
          etiqueta: ETIQUETAS_CATEGORIA[recompensa.categoria],
        };
      case 'marca':
        return { sobreId: recompensa.sobreId, tipo: 'MARCA', etiqueta: recompensa.nombre };
      default:
        return { sobreId: recompensa.sobreId, tipo: 'GENERAL' };
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
