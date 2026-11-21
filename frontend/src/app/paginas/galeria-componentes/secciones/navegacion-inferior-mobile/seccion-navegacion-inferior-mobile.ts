import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  NavegacionOla,
} from '@compartidos/componentes/layout/navegacion-ola/navegacion-ola';
import { type DestinoNavegacionOla } from '@compartidos/componentes/layout/navegacion-ola/navegacion-ola.model';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';
import { RegistroEventos } from '@paginas/galeria-componentes/registro-eventos/registro-eventos';
import { crearRegistroEventos } from '@paginas/galeria-componentes/registro-eventos';

type ModoMuestra = 'jugador' | 'empresa';

@Component({
  selector: 'app-seccion-navegacion-inferior-mobile',
  standalone: true,
  imports: [NavegacionOla, TarjetaMuestra, RegistroEventos],
  templateUrl: './seccion-navegacion-inferior-mobile.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionNavegacionInferiorMobile {
  private readonly eventos = crearRegistroEventos();

  protected readonly registros = this.eventos.registros;
  protected readonly modos: readonly ModoMuestra[] = ['jugador', 'empresa'];

  protected readonly rutaActiva = signal<string>('/usuario/mis-cartas');

  protected seleccionar(item: DestinoNavegacionOla, modo: ModoMuestra): void {
    if (item.ruta) {
      this.rutaActiva.set(item.ruta);
    }
    this.eventos.registrar(`${modo}: ${item.etiqueta} (${item.ruta ?? 'sin-ruta'})`);
  }
}
