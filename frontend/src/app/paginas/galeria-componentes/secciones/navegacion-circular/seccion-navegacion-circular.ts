import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BotonNavegacionCircular } from '../../../../compartidos/componentes/boton-navegacion-circular/boton-navegacion-circular';
import type { TamanioBotonNavegacion } from '../../../../compartidos/componentes/boton-navegacion-circular/boton-navegacion-circular';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import { RegistroEventos } from '../../registro-eventos/registro-eventos';
import { crearRegistroEventos } from '../../registro-eventos';

interface DestinoBarra {
  readonly id: string;
  readonly icono: string;
  readonly nombre: string;
}

@Component({
  selector: 'app-seccion-navegacion-circular',
  imports: [BotonNavegacionCircular, TarjetaMuestra, RegistroEventos],
  templateUrl: './seccion-navegacion-circular.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionNavegacionCircular {
  private readonly eventos = crearRegistroEventos();

  protected readonly registros = this.eventos.registros;
  protected readonly registrar = (evento: string): void => this.eventos.registrar(evento);

  protected readonly tamanios: readonly TamanioBotonNavegacion[] = ['sm', 'md', 'lg'];

  /** Los cinco destinos de la barra lateral, en el orden de la app. */
  protected readonly destinos: readonly DestinoBarra[] = [
    { id: 'sobres', icono: 'phosphorCardsFill', nombre: 'Sobres' },
    { id: 'album', icono: 'phosphorStackFill', nombre: 'Álbum' },
    { id: 'intercambios', icono: 'phosphorArrowsLeftRightFill', nombre: 'Intercambios' },
    { id: 'qr', icono: 'phosphorQrCodeFill', nombre: 'QR' },
    { id: 'cupones', icono: 'phosphorTicketFill', nombre: 'Cupones' },
  ];

  /** Destino activo de la barra lateral simulada. */
  protected readonly activoBarra = signal<string>('sobres');

  protected seleccionar(id: string, nombre: string): void {
    this.activoBarra.set(id);
    this.registrar(`navegación → ${nombre}`);
  }
}