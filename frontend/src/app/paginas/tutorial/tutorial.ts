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
  host: {
    '[attr.data-tutorial-activo]': '"true"',
  },
})
export class Tutorial implements OnInit, OnDestroy {
  private readonly servicio = inject(PartidaServicio);
  private readonly tutorial = inject(TutorialServicio);
  private readonly progreso = inject(ProgresoJuegoService);
  private readonly router = inject(Router);
  private readonly tablero = viewChild(Tablero);

  private resolviendoRonda = false;

  constructor() {
    effect(() => {
      if (this.tutorial.completado()) {
        this.progreso.marcarTutorialCompletado();
      }
    });

    // Al cambiar de paso se cierra cualquier detalle de carta abierto
    // para que no tape los elementos del paso siguiente.
    effect(() => {
      this.tutorial.indice();
      this.tablero()?.cerrarCarta();
    });

    // Detecta la conclusión de la resolución guionada de la ronda (1200 ms).
    // Notifica y avanza el paso cuando los puntos y la revelación son visibles.
    effect(() => {
      const resolviendo = this.servicio.resolviendo();
      if (resolviendo) {
        this.resolviendoRonda = true;
      } else if (this.resolviendoRonda) {
        this.resolviendoRonda = false;
        if (this.tutorial.paso().espera === 'turno-finalizado') {
          this.tutorial.notificar('turno-finalizado');
          this.tutorial.siguiente();
        }
      }
    });
  }

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-tutorial-activo', 'true');
    }
    this.servicio.prepararEscenarioTutorial(ESCENARIO_TUTORIAL);
    this.tutorial.iniciar();
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.removeAttribute('data-tutorial-activo');
    }
    this.resolviendoRonda = false;
    this.tutorial.salir();
    this.servicio.restaurarEscenarioMock();
  }

  protected alVerCarta(): void {
    this.tutorial.iniciarAccion();
    this.tutorial.notificar('carta-vista');
  }

  protected alCerrarCarta(): void {
    this.tutorial.cancelarAccion();
  }

  protected alJugarCarta(): void {
    this.tutorial.notificar('carta-jugada');
    this.tutorial.siguiente();
  }

  protected alFinalizarTurno(): void {
    // Si el jugador se adelantó sin estar en el paso de turno, se devuelve la ronda a "jugando".
    if (this.tutorial.paso().espera !== 'turno-finalizado') {
      this.servicio.reiniciarRonda();
      return;
    }

    // Marca que se inició el cierre de la ronda guionada.
    this.resolviendoRonda = true;
    this.servicio.cerrarRondaGuionadaTutorial(CARTA_RIVAL_TUTORIAL, 'derecha');
  }

  protected volver(): void {
    this.tablero()?.cerrarCarta();
    this.router.navigate(['/usuario/jugar']);
  }
}
