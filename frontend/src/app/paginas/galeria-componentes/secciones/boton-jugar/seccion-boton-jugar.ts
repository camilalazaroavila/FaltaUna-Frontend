import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BotonJugar } from '../../../../compartidos/componentes/boton-jugar/boton-jugar';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import { RegistroEventos } from '../../registro-eventos/registro-eventos';
import { crearRegistroEventos } from '../../registro-eventos';

@Component({
  selector: 'app-seccion-boton-jugar',
  imports: [BotonJugar, TarjetaMuestra, RegistroEventos],
  templateUrl: './seccion-boton-jugar.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionBotonJugar {
  private readonly eventos = crearRegistroEventos();

  protected readonly registros = this.eventos.registros;
  protected readonly registrar = (evento: string): void => this.eventos.registrar(evento);
}