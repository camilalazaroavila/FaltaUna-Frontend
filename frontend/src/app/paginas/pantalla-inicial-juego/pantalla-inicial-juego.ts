import { ChangeDetectionStrategy, Component, computed, inject, afterNextRender, DestroyRef, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '@app/compartidos/componentes/layout/header/header';
import { BotonOpcionJuego } from '@app/compartidos/componentes/controles/boton-opcion-juego/boton-opcion-juego';
import { ProgresoJuegoService } from '@app/servicios/progreso-juego.service';
import { GsapService } from '@app/servicios/gsap.service';

interface OpcionJuego {
  readonly id: string;
  readonly texto: string;
  readonly ruta: string;

  readonly requiereTutorial?: boolean;
}
 
// El tutorial guiado vive en /usuario/tutorial y no depende de haberlo
// completado antes. La partida contra jugador sigue requiriéndolo.
const OPCIONES_JUEGO: readonly OpcionJuego[] = [
  { id: 'jugador', texto: 'Partida contra jugador', ruta: '/juego/jugador', requiereTutorial: true },
  { id: 'ia', texto: 'Partida contra la IA', ruta: '/juego/ia' },
  { id: 'tutorial', texto: 'Tutorial', ruta: '/usuario/tutorial' },
];
 
@Component({
  selector: 'app-pantalla-inicial-juego',
  imports: [Header, BotonOpcionJuego, RouterLink],
  templateUrl: './pantalla-inicial-juego.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantallaInicialJuego {
    private readonly progreso = inject(ProgresoJuegoService);
    private readonly gsapService = inject(GsapService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly opciones = computed(() =>
       OPCIONES_JUEGO.map((opcion) => {
         const bloqueada = opcion.requiereTutorial === true && !this.progreso.tutorialCompletado();
         return { ...opcion, bloqueada};
    }),
  );

    constructor() {
  afterNextRender(() => {
    // Si el usuario pidió reducir el movimiento, la pantalla queda estática.
    if (this.gsapService.movimientoReducido()) {
      return;
    }

    const { gsap } = this.gsapService;

    this.gsapService.crearContexto(
      this.host.nativeElement,
      () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('[data-anim="titulo"]', {
            y: -40, opacity: 0, duration: 0.7, ease: 'back.out(1.7)',
          })
          .from('[data-anim="boton"]', {
            xPercent: -110, opacity: 0, duration: 0.6, stagger: 0.12,
            clearProps: 'transform', // devuelve el control a los estilos de hover/foco
          }, 0.1);
      },
      this.destroyRef,
    );
  });
} 
}