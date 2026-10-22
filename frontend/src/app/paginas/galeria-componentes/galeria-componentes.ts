import { ChangeDetectionStrategy, Component, OnDestroy, effect, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SECCIONES } from './secciones';
import { SeccionTokens } from '@paginas/galeria-componentes/secciones/tokens/seccion-tokens';
import { SeccionBoton } from '@paginas/galeria-componentes/secciones/boton/seccion-boton';
import { SeccionBadge } from '@paginas/galeria-componentes/secciones/badge/seccion-badge';
import { SeccionNavegacionCircular } from '@paginas/galeria-componentes/secciones/navegacion-circular/seccion-navegacion-circular';
import { SeccionBotonOpcionJuego } from '@paginas/galeria-componentes/secciones/boton-opcion-juego/seccion-boton-opcion-juego';
import { SeccionBotonJugar } from '@paginas/galeria-componentes/secciones/boton-jugar/seccion-boton-jugar';
import { SeccionBotonFlotante } from '@paginas/galeria-componentes/secciones/boton-flotante/seccion-boton-flotante';
import { SeccionBotonIcono } from '@paginas/galeria-componentes/secciones/boton-icono/seccion-boton-icono';
import { SeccionSobreMarca } from '@paginas/galeria-componentes/secciones/sobre-marca/seccion-sobre-marca';
import { SeccionCarta } from '@paginas/galeria-componentes/secciones/carta/seccion-carta';
import { SeccionCartaPopup } from '@paginas/galeria-componentes/secciones/carta-popup/seccion-carta-popup';
import { SeccionAreaEmpresa } from '@paginas/galeria-componentes/secciones/area-empresa/seccion-area-empresa';
import { SeccionTexto } from '@paginas/galeria-componentes/secciones/texto/seccion-texto';
import { SeccionCajas } from '@paginas/galeria-componentes/secciones/cajas/seccion-cajas';
import { SeccionPartida } from '@paginas/galeria-componentes/secciones/partida/seccion-partida';
import { SeccionTablero } from './secciones/tablero/seccion-tablero';

export type ModoGaleria = 'jugador' | 'empresa';

@Component({
  selector: 'app-galeria-componentes',
  imports: [
    RouterLink,
    SeccionTokens,
    SeccionBoton,
    SeccionBadge,
    SeccionNavegacionCircular,
    SeccionBotonOpcionJuego,
    SeccionBotonJugar,
    SeccionBotonFlotante,
    SeccionBotonIcono,
    SeccionSobreMarca,
    SeccionCarta,
    SeccionCartaPopup,
    SeccionAreaEmpresa,
    SeccionTexto,
    SeccionCajas,
    SeccionPartida,
    SeccionTablero,
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
