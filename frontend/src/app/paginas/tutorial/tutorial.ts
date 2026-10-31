import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Tablero } from '@compartidos/componentes/partida/tablero/tablero';
import {
  CARTA_RIVAL_TUTORIAL,
  ESCENARIO_TUTORIAL,
} from '@compartidos/componentes/tutorial/tutorial.escenario';
import { TutorialOverlay } from '@compartidos/componentes/tutorial/tutorial-overlay/tutorial-overlay';
import { TutorialServicio } from '@compartidos/componentes/tutorial/tutorial.servicio';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import { ProgresoJuegoService } from '@servicios/progreso-juego.service';

/**
 * Tutorial guiado de la partida contra el bot.
 *
 * Monta el tablero en modo mock con un escenario guionado (cartas baratas y
 * zonas conocidas) y deja que `TutorialOverlay` lleve el paso a paso. El
 * servidor no participa: el tutorial es una práctica local.
 */
@Component({
  selector: 'app-tutorial',
  imports: [Tablero, TutorialOverlay],
  templateUrl: './tutorial.html',
  styleUrl: './tutorial.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tutorial implements OnInit, OnDestroy {
  private readonly servicio = inject(PartidaServicio);
  private readonly tutorial = inject(TutorialServicio);
  private readonly progreso = inject(ProgresoJuegoService);
  private readonly router = inject(Router);
  private readonly tablero = viewChild(Tablero);

  constructor() {
    effect(() => {
      if (this.tutorial.completado()) {
        this.progreso.marcarTutorialCompletado();
      }
    });

    // Al avanzar desde el paso de "Costo y poder" se cierra el detalle de la
    // carta para que no tape el tablero en los pasos siguientes.
    effect(() => {
      if (this.tutorial.indice() > 3) {
        this.tablero()?.cerrarCarta();
      }
    });
  }

  ngOnInit(): void {
    this.servicio.prepararEscenarioTutorial(ESCENARIO_TUTORIAL);
    this.tutorial.iniciar();
  }

  ngOnDestroy(): void {
    this.tutorial.salir();
    this.servicio.restaurarEscenarioMock();
  }

  protected alVerCarta(): void {
    this.tutorial.notificar('carta-vista');
  }

  protected alJugarCarta(): void {
    this.tutorial.notificar('carta-jugada');
  }

  protected alFinalizarTurno(): void {
    // El tablero ya marcó la ronda como lista; si el jugador se adelantó, se
    // devuelve la ronda a "jugando" para no cerrar el guion antes de tiempo.
    if (this.tutorial.paso().espera !== 'turno-finalizado') {
      this.servicio.reiniciarRonda();
      return;
    }

    this.servicio.cerrarRondaGuionadaTutorial(CARTA_RIVAL_TUTORIAL, 'derecha');
    this.tutorial.notificar('turno-finalizado');
  }

  protected volver(): void {
    this.router.navigate(['/usuario/jugar']);
  }
}
