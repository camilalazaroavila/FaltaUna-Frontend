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

  protected readonly codigoParaUnirse = signal<string>('');
  protected readonly copiado = signal<boolean>(false);
  protected readonly verSalasPrivadas = signal<boolean>(false);

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

  protected async crearSala(): Promise<void> {
    const mazoId = this.mazoSeleccionado();
    if (!mazoId) return;

    try {
      await this.salaService.crearSala(mazoId);
    } catch {
      // Error manejado en salaService
    }
  }

  protected async unirseASala(): Promise<void> {
    const mazoId = this.mazoSeleccionado();
    const codigo = this.codigoParaUnirse().trim().toUpperCase();
    if (!mazoId || !codigo) return;

    try {
      await this.salaService.unirseASala(codigo, mazoId);
    } catch {
      // Error manejado en salaService
    }
  }

  protected copiarCodigo(): void {
    const codigo = this.salaService.codigoSala();
    if (codigo) {
      navigator.clipboard.writeText(codigo);
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    }
  }

  protected cancelarSala(): void {
    this.salaService.desconectar();
  }

  protected alternarSalasPrivadas(): void {
    this.verSalasPrivadas.update((v) => !v);
  }
}
