import { ChangeDetectionStrategy, Component, OnDestroy, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SECCIONES } from './secciones';
import { SeccionTokens } from './secciones/tokens/seccion-tokens';
import { SeccionBoton } from './secciones/boton/seccion-boton';
import { SeccionBadge } from './secciones/badge/seccion-badge';
import { SeccionNavegacionCircular } from './secciones/navegacion-circular/seccion-navegacion-circular';
import { SeccionBotonJugar } from './secciones/boton-jugar/seccion-boton-jugar';
import { SeccionBotonFlotante } from './secciones/boton-flotante/seccion-boton-flotante';
import { SeccionBotonIcono } from './secciones/boton-icono/seccion-boton-icono';

export type ModoGaleria = 'jugador' | 'empresa';

@Component({
  selector: 'app-galeria-componentes',
  imports: [
    RouterLink,
    SeccionTokens,
    SeccionBoton,
    SeccionBadge,
    SeccionNavegacionCircular,
    SeccionBotonJugar,
    SeccionBotonFlotante,
    SeccionBotonIcono,
  ],
  templateUrl: './galeria-componentes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaleriaComponentes implements OnDestroy {
  protected readonly secciones = SECCIONES;

  protected readonly modo = signal<ModoGaleria>('jugador');
  protected readonly movimientoReduccion = signal<boolean>(false);

  /** Valor previo de `data-modo`, para restaurarlo al salir de la galeria. */
  private readonly modoPrevio = document.documentElement.getAttribute('data-modo');

  constructor() {
    effect(() => {
      const modo = this.modo();
      document.documentElement.setAttribute('data-modo', modo);
    });

    effect(() => {
      const reducido = this.movimientoReduccion();

      if (reducido) {
        document.documentElement.setAttribute('data-movimiento', 'reducido');
      } else {
        document.documentElement.removeAttribute('data-movimiento');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.modoPrevio === null) {
      document.documentElement.removeAttribute('data-modo');
    } else {
      document.documentElement.setAttribute('data-modo', this.modoPrevio);
    }

    document.documentElement.removeAttribute('data-movimiento');
  }
}