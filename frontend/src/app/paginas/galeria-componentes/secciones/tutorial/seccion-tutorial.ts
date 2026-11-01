import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Jaime } from '@compartidos/componentes/tutorial/jaime/jaime';
import { TutorialOverlay } from '@compartidos/componentes/tutorial/tutorial-overlay/tutorial-overlay';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';

@Component({
  selector: 'app-seccion-tutorial',
  imports: [TutorialOverlay, TarjetaMuestra, Jaime],
  templateUrl: './seccion-tutorial.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionTutorial {}
