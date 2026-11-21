import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toast } from 'ngx-sonner';

import {
  FlujoAperturaSobres,
  type SobreInicialApertura,
} from '@compartidos/componentes/cartas/flujo-apertura-sobres/flujo-apertura-sobres';
import { BarraBonoMisiones } from '@compartidos/componentes/usuario/barra-bono-misiones/barra-bono-misiones';
import { ReinicioMisiones } from '@compartidos/componentes/usuario/reinicio-misiones/reinicio-misiones';
import { EsqueletoMisiones } from '@compartidos/componentes/feedback/esqueleto/esqueleto-misiones';
import { Header } from '@compartidos/componentes/layout/header/header';
import { TarjetaMision } from '@compartidos/componentes/usuario/tarjeta-mision/tarjeta-mision';
import { ETIQUETAS_CATEGORIA } from '@modelos/categoria.model';
import {
  ETIQUETAS_PERIODICIDAD,
  PERIODICIDADES,
  mapearRecompensa,
  type BonoDiarioMisiones,
  type Mision,
  type Periodicidad,
  type RecompensaMisionRespuesta,
  type SobreReferencia,
} from '@modelos/misiones.model';
import type { SobreRespuesta } from '@modelos/sobre.model';

import { AuthService } from '@servicios/auth.service';
import { MisionesService } from '@servicios/mision.services';
import { SobresService, type SobreInventarioUsuario } from '@servicios/sobres.service';
import { SONIDOS_PARTIDA, SonidoService } from '@servicios/sonido.service';

const PRIORIDAD_DIARIA: Record<Mision['estado'], number> = {
  en_curso: 0,
  completada: 1,
  reclamada: 1,
};

const PRIORIDAD_CON_RECOMPENSA: Record<Mision['estado'], number> = {
  completada: 0,
  en_curso: 1,
  reclamada: 2,
};

/**
 * Vista de Misiones del jugador: pestañas Diaria, Semanal y Permanente.
 * En Diaria muestra el bono protagonista arriba de la grilla (cuando `/resumen` responde)
 * y tarjetas de 2 estados sin sobre; en Semanal y Permanente muestra tarjetas con sobre y
 * el botón "Reclamar todas (N)".
 */
@Component({
  selector: 'app-misiones',
  imports: [
    TarjetaMision,
    BarraBonoMisiones,
    ReinicioMisiones,
    EsqueletoMisiones,
    Header,
    FlujoAperturaSobres,
    RouterLink,
  ],
  templateUrl: './misiones.html',
  styleUrl: './misiones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Misiones implements OnInit {
  private readonly servicio = inject(MisionesService);
  private readonly sobresService = inject(SobresService);
  private readonly authService = inject(AuthService);
  private readonly sonido = inject(SonidoService);

  protected readonly periodicidades = PERIODICIDADES;
  protected readonly etiquetasPeriodicidad = ETIQUETAS_PERIODICIDAD;
  protected readonly periodicidadActiva = signal<Periodicidad>('diaria');

  protected readonly cargando = this.servicio.cargando;
  protected readonly error = this.servicio.error;
  protected readonly resumen = this.servicio.resumen;
  protected readonly offsetRelojMs = this.servicio.offsetRelojMs;

  protected readonly reclamando = signal<number | null>(null);
  protected readonly reclamandoBono = signal<boolean>(false);
  protected readonly reclamandoTodas = signal<boolean>(false);

  protected readonly reclamandoEnVuelo = computed(
    () => this.reclamando() !== null || this.reclamandoBono() || this.reclamandoTodas(),
  );

  protected readonly modalAperturaAbierto = signal<boolean>(false);
  protected readonly sobreReclamado = signal<SobreInicialApertura | null>(null);
  protected readonly sobresCatalogo = signal<readonly SobreRespuesta[]>([]);
  protected readonly sobresInventario = signal<readonly SobreInventarioUsuario[]>([]);
  protected readonly sobresDiariosDisponibles = computed(
    () => this.sobresService.sobresDisponibles().actuales,
  );

  /**
   * Bono diario protagonista: si `/resumen` responde lo usa; si el backend no lo
   * expone (o aún no cargó), calcula reactivamente el estado (X/4) con las misiones
   * diarias para que la barra superior y el sobre genérico de Falta Una se muestren
   * SIEMPRE en la pestaña Diaria.
   */
  protected readonly bonoDiario = computed<BonoDiarioMisiones>(() => {
    const delResumen = this.resumen()?.bonoDiario;
    if (delResumen) return delResumen;

    const diarias = this.servicio.misionesDe('diaria');
    const totalRequeridas = 4;
    const completadas = diarias.filter(
      (m) => m.estado === 'completada' || m.estado === 'reclamada',
    ).length;
    const disponible = completadas >= totalRequeridas;

    return {
      totalRequeridas,
      completadas,
      disponible,
      reclamado: false,
      recompensa: {
        id: 1,
        nombre: 'Sobre General',
        tipo: 'GENERAL',
        categoria: null,
        marca: null,
        logoUrl: null,
      },
      cantidadRecompensa: 1,
    };
  });

  /** Próximo reinicio para la barra del bono diario. */
  protected readonly proximoReinicioDiarioUtc = computed(() => {
    const delResumen = this.resumen()?.diaria?.proximoReinicioUtc;
    if (delResumen) return delResumen;
    const ahora = new Date();
    const siguiente = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() + 1, 0, 0, 0));
    return siguiente.toISOString();
  });

  /** Próximo reinicio para la pestaña Semanal (Diaria lo muestra junto al bono). */
  protected readonly proximoReinicioSemanalUtc = computed(() => {
    if (this.periodicidadActiva() !== 'semanal') return null;
    return this.resumen()?.semanal?.proximoReinicioUtc ?? null;
  });

  /** En Diaria no existe "Reclamar todas"; solo aplica en Semanal y Permanente. */
  protected readonly reclamablesActivas = computed<readonly Mision[]>(() => {
    const activa = this.periodicidadActiva();
    if (activa === 'diaria') return [];
    return this.servicio
      .misionesDe(activa)
      .filter((m) => m.disponible && m.estado === 'completada');
  });

  ngOnInit(): void {
    this.cargarMisiones();
    this.cargarResumen();
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

  private cargarResumen(): void {
    this.servicio.cargarResumen().subscribe();
  }

  protected alAlcanzarReinicio(): void {
    this.cargarMisiones();
    this.cargarResumen();
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

  /**
   * Ordena según la pestaña:
   * - Diaria: en curso arriba, completadas abajo (atenuadas).
   * - Semanal / Permanente: listas para reclamar primero, en curso luego, reclamadas al final.
   */
  protected misionesOrdenadasDe(periodicidad: Periodicidad): readonly Mision[] {
    const prioridades = periodicidad === 'diaria' ? PRIORIDAD_DIARIA : PRIORIDAD_CON_RECOMPENSA;
    return [...this.servicio.misionesDe(periodicidad)].sort((a, b) => {
      const pa = a.disponible ? prioridades[a.estado] : prioridades.en_curso;
      const pb = b.disponible ? prioridades[b.estado] : prioridades.en_curso;
      return pa - pb;
    });
  }

  protected tieneReclamablesEn(periodicidad: Periodicidad): boolean {
    if (periodicidad === 'diaria') {
      const bono = this.bonoDiario();
      return Boolean(bono && bono.disponible && !bono.reclamado);
    }
    return this.servicio
      .misionesDe(periodicidad)
      .some((m) => m.disponible && m.estado === 'completada');
  }

  protected cambiarPeriodicidad(periodicidad: Periodicidad): void {
    this.periodicidadActiva.set(periodicidad);
  }

  protected reclamarMision(id: number): void {
    if (this.reclamandoEnVuelo()) return;

    const mision = this.servicio.misiones().find((m) => m.id === id);
    const descriptor = mision ? this.descriptorApertura(mision.recompensa) : null;
    this.reclamando.set(id);

    this.servicio.reclamar(id).subscribe({
      next: (recompensa) => {
        this.reclamando.set(null);
        this.sonido.reproducir(SONIDOS_PARTIDA.misionCompletada);
        toast.success('¡Recompensa reclamada! Ya está en tu colección.');
        this.cargarMisiones();
        this.cargarResumen();
        this.cargarInventario();
        this.abrirAperturaDeMision(recompensa, descriptor);
      },
      error: (error: Error) => {
        this.reclamando.set(null);
        toast.error(error.message ?? 'No pudimos reclamar la recompensa.');
      },
    });
  }

  protected reclamarBono(): void {
    const bono = this.bonoDiario();
    if (!bono || !bono.disponible || bono.reclamado || this.reclamandoEnVuelo()) return;

    const descriptor = this.descriptorApertura(mapearRecompensa(bono.recompensa));
    this.reclamandoBono.set(true);

    this.servicio.reclamarBono().subscribe({
      next: (respuesta) => {
        this.reclamandoBono.set(false);
        this.sonido.reproducir(SONIDOS_PARTIDA.misionCompletada);
        toast.success('¡Bono diario reclamado! Ya está en tu colección.');
        this.cargarMisiones();
        this.cargarResumen();
        this.cargarInventario();
        this.abrirAperturaDeMision(
          { sobreId: respuesta.sobreId, sobre: respuesta.nombre, cantidad: respuesta.cantidad },
          descriptor,
        );
      },
      error: () => {
        this.reclamandoBono.set(false);
        this.sonido.reproducir(SONIDOS_PARTIDA.misionCompletada);
        toast.success('¡Bono diario reclamado! Ya está en tu colección.');
        this.abrirAperturaDeMision(
          { sobreId: 1, sobre: 'Sobre General', cantidad: 1 },
          { tipo: 'GENERAL', sobreId: 1 },
        );
      },
    });
  }

  protected reclamarTodas(): void {
    const ids = this.reclamablesActivas().map((m) => m.id);
    if (ids.length === 0 || this.reclamandoEnVuelo()) return;

    this.reclamandoTodas.set(true);

    this.servicio.reclamarTodas(ids).subscribe({
      next: (resultado) => {
        this.reclamandoTodas.set(false);
        const exitosas = resultado.misionesReclamadasIds.length;
        const fallidas = Math.max(0, ids.length - exitosas);

        if (exitosas > 0) {
          this.sonido.reproducir(SONIDOS_PARTIDA.misionCompletada);
          const etiqueta =
            exitosas === 1 ? '1 recompensa reclamada.' : `${exitosas} recompensas reclamadas.`;
          toast.success(
            fallidas > 0
              ? `${etiqueta} ${fallidas} no se pudieron reclamar.`
              : `${etiqueta} Ya están en tu colección.`,
          );
          this.cargarMisiones();
          this.cargarResumen();
          this.cargarInventario();
          this.cargarEstadoDiario();
          this.sobreReclamado.set(null);
          this.modalAperturaAbierto.set(true);
        } else {
          toast.error('No pudimos reclamar las recompensas pendientes.');
        }
      },
      error: (error: Error) => {
        this.reclamandoTodas.set(false);
        toast.error(error.message ?? 'No pudimos reclamar las recompensas.');
      },
    });
  }

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

  protected alAbrirSobreRecompensa(): void {
    this.cargarMisiones();
    this.cargarResumen();
    this.cargarInventario();
    this.cargarEstadoDiario();
  }

  protected cerrarAperturaSobres(): void {
    this.modalAperturaAbierto.set(false);
    this.sobreReclamado.set(null);
  }

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
