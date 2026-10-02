import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BotonFlotante } from '../../../../compartidos/componentes/boton-flotante/boton-flotante';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import { RegistroEventos } from '../../registro-eventos/registro-eventos';
import { crearRegistroEventos } from '../../registro-eventos';

@Component({
  selector: 'app-seccion-boton-flotante',
  imports: [BotonFlotante, TarjetaMuestra, RegistroEventos],
  templateUrl: './seccion-boton-flotante.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionBotonFlotante {
  private readonly eventos = crearRegistroEventos();

  protected readonly registros = this.eventos.registros;
  protected readonly registrar = (evento: string): void => this.eventos.registrar(evento);
}