import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TutorialOverlay } from '@compartidos/componentes/tutorial/tutorial-overlay/tutorial-overlay';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';

@Component({
  selector: 'app-seccion-tutorial',
  imports: [TutorialOverlay, TarjetaMuestra],
  templateUrl: './seccion-tutorial.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionTutorial {}
