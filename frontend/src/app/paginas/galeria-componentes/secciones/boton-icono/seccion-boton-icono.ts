import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BotonIcono } from '../../../../compartidos/componentes/boton-icono/boton-icono';
import type {
  TamanioBotonIcono,
  VarianteBotonIcono,
} from '../../../../compartidos/componentes/boton-icono/boton-icono';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import { RegistroEventos } from '../../registro-eventos/registro-eventos';
import { crearRegistroEventos } from '../../registro-eventos';

@Component({
  selector: 'app-seccion-boton-icono',
  imports: [BotonIcono, TarjetaMuestra, RegistroEventos],
  templateUrl: './seccion-boton-icono.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionBotonIcono {
  private readonly eventos = crearRegistroEventos();

  protected readonly registros = this.eventos.registros;
  protected readonly registrar = (evento: string): void => this.eventos.registrar(evento);

  protected readonly variantes: readonly VarianteBotonIcono[] = ['fantasma', 'superficie'];
  protected readonly tamanios: readonly TamanioBotonIcono[] = ['sm', 'md'];
}