import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BotonOpcionJuego } from '../../../../compartidos/componentes/boton-opcion-juego/boton-opcion-juego';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import { RegistroEventos } from '../../registro-eventos/registro-eventos';
import { crearRegistroEventos } from '../../registro-eventos';

@Component({
  selector: 'app-seccion-boton-opcion-juego',
  imports: [BotonOpcionJuego, RouterLink, TarjetaMuestra, RegistroEventos],
  templateUrl: './seccion-boton-opcion-juego.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionBotonOpcionJuego {
  private readonly eventos = crearRegistroEventos();

  /** Rótulos reales de la pantalla de jugar, en el orden en que aparecerán. */
  protected readonly opciones = [
    'Partida contra jugador',
    'Partida contra la IA',
    'Tutorial',
    'Volver al inicio',
  ];

  protected readonly registros = this.eventos.registros;
  protected readonly registrar = (evento: string): void => this.eventos.registrar(evento);
}
