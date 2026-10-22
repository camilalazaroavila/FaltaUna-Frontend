import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Caja } from '@compartidos/componentes/contenedor/caja/caja';
import { Header } from '@compartidos/componentes/layout/header/header';
import { Tablero } from '@compartidos/componentes/partida/tablero/tablero';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { Titulo } from '@compartidos/componentes/textual/titulo/titulo';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import type { VarianteCaja } from '@compartidos/componentes/contenedor/caja/caja';

/**
 * Pantalla de partida contra el bot.
 *
 * Es el único consumidor del flujo real: crea la partida, deja jugar el
 * tablero y muestra el resultado de cada ronda. Toda la lógica de partida vive
 * en `PartidaServicio`; la página solo dispara acciones y presenta estados.
 */
@Component({
  selector: 'app-partida',
  imports: [Boton, Caja, Header, RouterLink, Tablero, Texto, Titulo],
  templateUrl: './partida.html',
  styleUrl: './partida.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Partida implements OnInit {
  protected readonly servicio = inject(PartidaServicio);

  /** Hay una partida real en curso (no la maqueta). */
  protected readonly enPartida = computed(() => this.servicio.partidaId() !== null);
  protected readonly resultado = this.servicio.resultadoRonda;
  protected readonly terminada = this.servicio.terminada;
  protected readonly gane = this.servicio.gane;

  /** Variante del aviso de resultado según cómo terminó la ronda. */
  protected readonly varianteResultado = computed<VarianteCaja>(() => {
    const resultado = this.resultado();

    if (!resultado) {
      return 'info';
    }

    if (!resultado.terminada) {
      return 'info';
    }

    if (resultado.gane === null) {
      return 'advertencia';
    }

    return resultado.gane ? 'exito' : 'error';
  });

  /** Título del aviso de resultado. */
  protected readonly tituloResultado = computed(() => {
    const resultado = this.resultado();

    if (!resultado) {
      return '';
    }

    if (!resultado.terminada) {
      return `Ronda ${resultado.numero} resuelta`;
    }

    if (resultado.gane === null) {
      return 'La partida terminó empatada';
    }

    return resultado.gane ? '¡Ganaste la partida!' : 'La partida la ganó el bot';
  });

  ngOnInit(): void {
    // Si quedó una partida guardada, se retoma; si no, se ofrece empezar una.
    this.servicio.reconectar().subscribe();
  }

  /** Crea una partida nueva contra el bot. */
  protected jugar(): void {
    this.servicio.iniciarContraBot().subscribe();
  }

  /** Cierra la partida local y vuelve al menú de juego. */
  protected abandonar(): void {
    this.servicio.abandonarPartida();
  }
}
