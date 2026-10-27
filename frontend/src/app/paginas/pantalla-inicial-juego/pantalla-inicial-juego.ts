import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '@app/compartidos/componentes/layout/header/header';
import { BotonOpcionJuego } from '@app/compartidos/componentes/controles/boton-opcion-juego/boton-opcion-juego';

import { ProgresoJuegoService } from '@app/servicios/progreso-juego.service';

interface OpcionJuego {
  readonly id: string;
  readonly texto: string;
  readonly ruta: string;

  readonly requiereTutorial?: boolean;
}
 
// Las rutas de partida contra jugador y contra la IA ya existen; falta la pantalla de tutorial.
const OPCIONES_JUEGO: readonly OpcionJuego[] = [
  { id: 'jugador', texto: 'Partida contra jugador', ruta: '/juego/jugador', requiereTutorial: true },
  { id: 'ia', texto: 'Partida contra la IA', ruta: '/juego/ia' },
  { id: 'tutorial', texto: 'Tutorial', ruta: '/juego/tutorial', requiereTutorial: true },
];
 
@Component({
  selector: 'app-pantalla-inicial-juego',
  imports: [Header, BotonOpcionJuego, RouterLink],
  templateUrl: './pantalla-inicial-juego.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantallaInicialJuego {
    private readonly progreso = inject(ProgresoJuegoService);

  protected readonly opciones = computed(() =>
    OPCIONES_JUEGO.map((opcion) => {
      const bloqueada = opcion.requiereTutorial === true && !this.progreso.tutorialCompletado();
      return { ...opcion, bloqueada};
    }),
  );
}