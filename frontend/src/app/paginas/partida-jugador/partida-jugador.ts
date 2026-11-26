import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorMagnifyingGlassFill } from '@ng-icons/phosphor-icons/fill';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Caja } from '@compartidos/componentes/contenedor/caja/caja';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { Titulo } from '@compartidos/componentes/textual/titulo/titulo';
import type { MazoApi } from '@modelos/mazo.model';
import { BarajaService } from '@servicios/baraja.service';
import { SalaJuegoService } from '@servicios/sala-juego.service';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import { SelectorMazos } from '@compartidos/componentes/cartas/selector-mazos/selector-mazos';

@Component({
  selector: 'app-partida-jugador',
  imports: [Boton, Caja, RouterLink, Texto, Titulo, SelectorMazos, NgIcon],
  templateUrl: './partida-jugador.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ phosphorMagnifyingGlassFill })],
})
export class PartidaJugador implements OnInit, OnDestroy {
  protected readonly salaService = inject(SalaJuegoService);
  private readonly partidaServicio = inject(PartidaServicio);
  private readonly barajaService = inject(BarajaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly mazos = signal<readonly MazoApi[]>([]);
  protected readonly mazoSeleccionado = signal<number | null>(null);
  protected readonly cargandoMazos = signal<boolean>(true);
  protected readonly entrandoAPartida = signal<boolean>(false);
  protected readonly enBusquedaOEntrando = computed(
    () => this.salaService.buscandoRival() || this.entrandoAPartida(),
  );

  protected readonly mazosValidos = computed(() =>
    this.mazos().filter((m) => m.completo || m.cartas?.length === 12),
  );

  protected readonly puedeAccionar = computed(() =>
    this.mazoSeleccionado() !== null && !this.salaService.cargando() && !this.entrandoAPartida(),
  );

  constructor() {
    effect(() => {
      const evento = this.salaService.partidaIniciada();
      if (evento) {
        const mazoId = this.mazoSeleccionado();
        if (mazoId) {
          localStorage.setItem('faltauna_ultimo_mazo', String(mazoId));
        }
        localStorage.setItem('faltauna_partida_activa', String(evento.partidaId));
        this.entrandoAPartida.set(true);
        this.partidaServicio
          .reconectar()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            void this.router.navigate(['/juego/ia']);
          });
      }
    });
  }

  ngOnInit(): void {
    this.cargarMazos();
  }

  ngOnDestroy(): void {
    this.salaService.desconectar();
  }

protected readonly errorMazos = signal<string | null>(null);

protected seleccionarMazo(mazoId: number): void {
  this.mazoSeleccionado.set(mazoId);
}

protected readonly mazoSeleccionadoDetalle = computed(
  () => this.mazos().find((m) => m.id === this.mazoSeleccionado()) ?? null,
);

  protected cargarMazos(): void {
    this.errorMazos.set(null); 
    this.cargandoMazos.set(true);
    this.barajaService.obtenerMazos().subscribe({
      next: (mazos) => {
        this.mazos.set(mazos);
        const primeroValido = mazos.find((m) => m.completo || m.cartas?.length === 12);
        if (primeroValido) {
          this.mazoSeleccionado.set(primeroValido.id);
        }
        this.cargandoMazos.set(false);
      },
      error: () => {
      this.errorMazos.set('No pudimos cargar tus mazos. Intentá de nuevo.');  // nuevo
      this.cargandoMazos.set(false);
    },
    });
  }

  protected async buscarPartida(): Promise<void> {
    const mazoId = this.mazoSeleccionado();
    if (!mazoId) return;

    try {
      await this.salaService.buscarPartida(mazoId);
    } catch {
      // Error manejado en salaService
    }
  }

  protected async cancelarBusqueda(): Promise<void> {
    await this.salaService.cancelarBusqueda();
  }
}
