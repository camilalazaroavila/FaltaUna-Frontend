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
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorMagnifyingGlassFill } from '@ng-icons/phosphor-icons/fill';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Caja } from '@compartidos/componentes/contenedor/caja/caja';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { Titulo } from '@compartidos/componentes/textual/titulo/titulo';
import { PantallaCargaJuego } from '@paginas/pantalla-carga-juego/pantalla-carga-juego';
import type { MazoApi } from '@modelos/mazo.model';
import { BarajaService } from '@servicios/baraja.service';
import { SalaJuegoService } from '@servicios/sala-juego.service';
import { TransicionCargaService } from '@servicios/servicios-partida/transicion-carga.service';
import { SelectorMazos } from '@compartidos/componentes/cartas/selector-mazos/selector-mazos';

@Component({
  selector: 'app-partida-jugador',
  imports: [Boton, Caja, PantallaCargaJuego, RouterLink, Texto, Titulo, SelectorMazos, NgIcon],
  templateUrl: './partida-jugador.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ phosphorMagnifyingGlassFill })],
})
export class PartidaJugador implements OnInit, OnDestroy {
  protected readonly salaService = inject(SalaJuegoService);
  private readonly barajaService = inject(BarajaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly transicionCarga = inject(TransicionCargaService);

  protected readonly mazos = signal<readonly MazoApi[]>([]);
  protected readonly mazoSeleccionado = signal<number | null>(null);
  protected readonly cargandoMazos = signal<boolean>(true);
  protected readonly mostrandoCarga = signal<boolean>(false);

  protected readonly mazosValidos = computed(() =>
    this.mazos().filter((m) => m.completo || m.cartas?.length === 12),
  );

  protected readonly puedeAccionar = computed(() =>
    this.mazoSeleccionado() !== null && !this.salaService.cargando(),
  );

  constructor() {
    effect(() => {
      const evento = this.salaService.partidaIniciada();
      if (evento && !untracked(() => this.mostrandoCarga())) {
        const mazoId = untracked(() => this.mazoSeleccionado());
        if (mazoId) {
          localStorage.setItem('faltauna_ultimo_mazo', String(mazoId));
        }
        localStorage.setItem('faltauna_partida_activa', String(evento.partidaId));
        this.mostrandoCarga.set(true);

        this.transicionCarga
          .esperarPantallaCarga('pvp')
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
