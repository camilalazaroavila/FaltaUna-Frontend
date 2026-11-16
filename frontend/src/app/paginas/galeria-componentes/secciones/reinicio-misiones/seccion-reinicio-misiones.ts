import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReinicioMisiones } from '@compartidos/componentes/usuario/reinicio-misiones/reinicio-misiones';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';

type ModoBloque = 'jugador' | 'empresa';

/**
 * Sección de galería de `app-reinicio-misiones`.
 */
@Component({
  selector: 'app-seccion-reinicio-misiones',
  imports: [ReinicioMisiones, TarjetaMuestra],
  templateUrl: './seccion-reinicio-misiones.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionReinicioMisiones {
  protected readonly modos: readonly ModoBloque[] = ['jugador', 'empresa'];

  protected readonly en5Horas = new Date(Date.now() + (5 * 60 + 13) * 60_000).toISOString();
  protected readonly en6Dias = new Date(
    Date.now() + (6 * 24 * 60 + 24) * 60_000,
  ).toISOString();
  protected readonly en12Min = new Date(Date.now() + 12 * 60_000).toISOString();
}

