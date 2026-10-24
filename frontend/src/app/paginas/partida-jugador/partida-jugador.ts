import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Caja } from '@compartidos/componentes/contenedor/caja/caja';
import { Header } from '@compartidos/componentes/layout/header/header';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { Titulo } from '@compartidos/componentes/textual/titulo/titulo';

/**
 * Partida contra otro jugador.
 *
 * Todavía no está disponible: el backend sólo expone el flujo contra el bot
 * (`PartidasBotController`). Cuando exista el endpoint que confirma el fin de
 * ronda contra un rival humano, esta pantalla puede pasar a CrearPartidaRequest
 * y a la espera de la confirmación del rival.
 */
@Component({
  selector: 'app-partida-jugador',
  imports: [Boton, Caja, Header, RouterLink, Texto, Titulo],
  templateUrl: './partida-jugador.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartidaJugador {}
