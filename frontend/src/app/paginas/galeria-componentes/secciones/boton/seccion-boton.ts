import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Boton } from '../../../../compartidos/componentes/boton/boton';
import type {
  FormaBoton,
  TamanioBoton,
  VarianteBoton,
} from '../../../../compartidos/componentes/boton/boton';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import { RegistroEventos } from '../../registro-eventos/registro-eventos';
import { crearRegistroEventos } from '../../registro-eventos';

@Component({
  selector: 'app-seccion-boton',
  imports: [NgIcon, Boton, TarjetaMuestra, RegistroEventos],
  templateUrl: './seccion-boton.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionBoton {
  private readonly eventos = crearRegistroEventos();

  protected readonly registros = this.eventos.registros;
  protected readonly registrar = (evento: string): void => this.eventos.registrar(evento);

  protected readonly variantes: readonly VarianteBoton[] = [
    'primario',
    'secundario',
    'terciario',
    'fantasma',
    'claro',
    'peligro',
  ];

  protected readonly tamanios: readonly TamanioBoton[] = ['sm', 'md', 'lg'];

  protected readonly formas: readonly FormaBoton[] = ['pildora', 'circulo'];

  protected emitir(variante: VarianteBoton, tamanio: TamanioBoton): void {
    this.registrar(`accion emitida (${variante}/${tamanio})`);
  }
}