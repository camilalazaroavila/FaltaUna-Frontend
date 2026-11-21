import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Esqueleto } from '@compartidos/componentes/feedback/esqueleto/esqueleto';
import { EsqueletoMisiones } from '@compartidos/componentes/feedback/esqueleto/esqueleto-misiones';
import { EsqueletoPity } from '@compartidos/componentes/feedback/esqueleto/esqueleto-pity';
import { EsqueletoCupones } from '@compartidos/componentes/feedback/esqueleto/esqueleto-cupones';
import { EsqueletoCartas } from '@compartidos/componentes/feedback/esqueleto/esqueleto-cartas';
import { EsqueletoBaraja } from '@compartidos/componentes/feedback/esqueleto/esqueleto-baraja';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';

@Component({
  selector: 'app-seccion-esqueleto',
  imports: [
    Esqueleto,
    EsqueletoMisiones,
    EsqueletoPity,
    EsqueletoCupones,
    EsqueletoCartas,
    EsqueletoBaraja,
    TarjetaMuestra,
  ],
  templateUrl: './seccion-esqueleto.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionEsqueleto {}
