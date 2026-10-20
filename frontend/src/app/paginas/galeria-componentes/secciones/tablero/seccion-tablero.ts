import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Tablero } from '@compartidos/componentes/partida/tablero/tablero';
import { PartidaEstadoService } from '@servicios/servicios-partida/partida-estado.service';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';

@Component({
  selector: 'app-seccion-tablero',
  templateUrl: './seccion-tablero.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TarjetaMuestra, Tablero, Boton],
})
export class SeccionTablero {
  protected readonly servicio = inject(PartidaEstadoService);
  protected readonly agarrada = signal(false);
}