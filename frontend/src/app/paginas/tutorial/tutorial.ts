import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Tablero } from '@compartidos/componentes/partida/tablero/tablero';
import {
  CARTA_RIVAL_TUTORIAL,
  ESCENARIO_TUTORIAL,
} from '@compartidos/componentes/tutorial/tutorial.escenario';
import { TutorialOverlay } from '@compartidos/componentes/tutorial/tutorial-overlay/tutorial-overlay';
import { TutorialServicio } from '@compartidos/componentes/tutorial/tutorial.servicio';
import { BarajaService } from '@servicios/baraja.service';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import { catchError, of } from 'rxjs';

/**
 * Tutorial guiado de la partida contra el bot.
 *
 * Monta el tablero en modo mock con un escenario guionado (cartas reales y
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
  protected readonly servicio = inject(PartidaServicio);
  protected readonly tutorial = inject(TutorialServicio);
  private readonly baraja = inject(BarajaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly tablero = viewChild(Tablero);

  private resolviendoRonda = false;

  protected readonly bloquearArrastre = computed(
    () => this.tutorial.activo() && this.tutorial.paso().espera !== 'carta-jugada',
  );
  protected readonly bloquearTurno = computed(
    () => this.tutorial.activo() && this.tutorial.paso().espera !== 'turno-finalizado',
  );
  protected readonly bloquearJugada = computed(
    () => this.tutorial.activo() && this.tutorial.paso().espera !== 'carta-jugada',
  );

  constructor() {
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

    // Consultar el backend para cargar las cartas reales del usuario si están disponibles
    this.baraja
      .obtenerCartasDisponibles()
      .pipe(
        catchError(() => of([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((cartasReales) => {
        if (cartasReales && cartasReales.length >= 4) {
          const cartasAjustadas = cartasReales.slice(0, 4).map((c, i) => ({
            ...c,
            atributoIzquierdo: i === 0 ? 1 : Math.min(c.atributoIzquierdo, 3),
            jugable: true,
          }));
          this.servicio.actualizarManoTutorial(cartasAjustadas);
        }
      });
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
    if (this.tutorial.activo()) {
      // Si el jugador se adelantó sin estar en el paso de turno, se devuelve la ronda a "jugando".
      if (this.tutorial.paso().espera !== 'turno-finalizado') {
        this.servicio.reiniciarRonda();
        return;
      }

      // Marca que se inició el cierre de la ronda guionada.
      this.resolviendoRonda = true;
      this.servicio.cerrarRondaGuionadaTutorial(CARTA_RIVAL_TUTORIAL, 'derecha');
      return;
    }

    this.irAPartidaBot();
  }

  protected irAPartidaBot(): void {
    this.tablero()?.cerrarCarta();
    this.router.navigate(['/juego/ia']);
  }

  protected volver(): void {
    this.tablero()?.cerrarCarta();
    this.router.navigate(['/usuario/jugar']);
  }
}
