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
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Caja } from '@compartidos/componentes/contenedor/caja/caja';
import { Header } from '@compartidos/componentes/layout/header/header';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { Titulo } from '@compartidos/componentes/textual/titulo/titulo';
import type { MazoApi } from '@modelos/mazo.model';
import { BarajaService } from '@servicios/baraja.service';
import { SalaJuegoService } from '@servicios/sala-juego.service';

@Component({
  selector: 'app-partida-jugador',
  imports: [Boton, Caja, FormsModule, Header, RouterLink, Texto, Titulo],
  templateUrl: './partida-jugador.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartidaJugador implements OnInit, OnDestroy {
  protected readonly salaService = inject(SalaJuegoService);
  private readonly barajaService = inject(BarajaService);
  private readonly router = inject(Router);

  protected readonly mazos = signal<readonly MazoApi[]>([]);
  protected readonly mazoSeleccionado = signal<number | null>(null);
  protected readonly cargandoMazos = signal<boolean>(true);

  protected readonly mazosValidos = computed(() =>
    this.mazos().filter((m) => m.completo || m.cartas?.length === 12),
  );

  protected readonly puedeAccionar = computed(() =>
    this.mazoSeleccionado() !== null && !this.salaService.cargando(),
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
        this.router.navigate(['/juego/ia']);
      }
    });
  }

  ngOnInit(): void {
    this.cargarMazos();
  }

  ngOnDestroy(): void {
    this.salaService.desconectar();
  }

  private cargarMazos(): void {
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
