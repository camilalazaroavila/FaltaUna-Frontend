import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '@compartidos/componentes/layout/header/header';
import { BotonOpcionJuego } from '@compartidos/componentes/controles/boton-opcion-juego/boton-opcion-juego';
import { GsapService } from '@servicios/gsap.service';
import { IntercambioService } from '@servicios/intercambio.service';

interface OpcionIntercambio {
  readonly id: string;
  readonly texto: string;
  readonly ruta: string;
  readonly visible: boolean;
  readonly deshabilitada?: boolean;
}

const OPCIONES_INTERCAMBIO: readonly OpcionIntercambio[] = [
  // "Intercambiar con un amigo" no se implementa en esta fase (visible: false),
  // pero queda contemplada para agregarse más adelante.
  {
    id: 'amigo',
    texto: 'Intercambiar con un amigo',
    ruta: '/usuario/intercambio/amigos',
    visible: false,
  },
  {
    id: 'coleccionistas',
    texto: 'Buscar coleccionistas',
    ruta: '/usuario/intercambio/coleccionistas',
    visible: true,
  },
  {
    id: 'activos',
    texto: 'Intercambios activos',
    ruta: '/usuario/intercambio/activos',
    visible: true,
  },
];

@Component({
  selector: 'app-intercambio-menu',
  standalone: true,
  imports: [Header, BotonOpcionJuego, RouterLink],
  templateUrl: './intercambio-menu.html',
  styleUrl: './intercambio-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntercambioMenu {
  private readonly gsapService = inject(GsapService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly intercambioService = inject(IntercambioService);

  protected readonly opciones = OPCIONES_INTERCAMBIO.filter((o) => o.visible);
  protected readonly tieneNovedadActivos = this.intercambioService.tieneNovedadMenuSignal;

  /**
   * Índice de la animación secuencial de Jaime y Falti:
   * 0 -> jaimeyfalti1
   * 1 -> jaimeyfalti2
   * 2 -> jaimeyfalti1
   * 3 -> jaimeyfalti3
   */
  protected readonly frameActual = signal(0);

  constructor() {
    this.intercambioService.marcarDashboardIntercambioVisto();
    this.intercambioService.verificarNovedades().subscribe();

    afterNextRender(() => {
      // Ciclo de animación que intercala las 3 ilustraciones:
      // jaimeyfalti1 -> jaimeyfalti2 -> jaimeyfalti1 -> jaimeyfalti3 -> repite
      const animInterval = window.setInterval(() => {
        this.frameActual.update((f) => (f + 1) % 4);
      }, 950);

      this.destroyRef.onDestroy(() => window.clearInterval(animInterval));

      if (this.gsapService.movimientoReducido()) {
        return;
      }

      const { gsap } = this.gsapService;

      this.gsapService.crearContexto(
        this.host.nativeElement,
        () => {
          gsap
            .timeline({ defaults: { ease: 'power3.out' } })
            .from('[data-anim="ilustracion"]', {
              scale: 0.9,
              opacity: 0,
              duration: 0.7,
              ease: 'back.out(1.4)',
            })
            .from(
              '[data-anim="boton"]',
              {
                xPercent: -110,
                opacity: 0,
                duration: 0.6,
                stagger: 0.12,
                clearProps: 'transform',
              },
              0.1,
            );
        },
        this.destroyRef,
      );
    });
  }
}
