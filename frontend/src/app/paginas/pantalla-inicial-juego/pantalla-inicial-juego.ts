import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '@app/compartidos/componentes/layout/header/header';
import { BotonOpcionJuego } from '@app/compartidos/componentes/controles/boton-opcion-juego/boton-opcion-juego';

interface OpcionJuego {
  readonly id: string;
  readonly texto: string;
  readonly ruta: string;
}
 
// TODO: reemplazar las rutas inventadas por las reales cuando existan esas pantallas.
const OPCIONES_JUEGO: readonly OpcionJuego[] = [
  { id: 'jugador', texto: 'Partida contra jugador', ruta: '/juego/jugador' },
  { id: 'ia', texto: 'Partida contra la IA', ruta: '/juego/ia' },
  { id: 'tutorial', texto: 'Tutorial', ruta: '/juego/tutorial' },
  { id: 'inicio', texto: 'Volver al inicio', ruta: '/usuario' },
];
 
@Component({
  selector: 'app-pantalla-inicial-juego',
  imports: [Header, BotonOpcionJuego, RouterLink],
  templateUrl: './pantalla-inicial-juego.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantallaInicialJuego {
  protected readonly opciones = OPCIONES_JUEGO;
}