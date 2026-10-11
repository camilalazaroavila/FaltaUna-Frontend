import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { PreguntaFrecuente } from '../../../modelos/landing-empresa.model';
import urlCartaRara from '../../SVGs/CartaRara.svg';
import urlEpicarta from '../../SVGs/Epicarta.svg';
import urlUnicarta from '../../SVGs/Unicarta.svg';
import { FaqItem } from '../faq-item/faq-item';

@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [FaqItem],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq-section.html',
})
export class FaqSection {
  readonly preguntas = input.required<PreguntaFrecuente[]>();

  /** Índice de la pregunta abierta (null = ninguna). Solo una a la vez. */
  protected readonly preguntaAbierta = signal<number | null>(null);

  protected readonly urlCartaIzquierda = urlCartaRara;
  protected readonly urlCartaCentro = urlUnicarta;
  protected readonly urlCartaDerecha = urlEpicarta;

  protected alternar(indice: number): void {
    this.preguntaAbierta.update((actual) => (actual === indice ? null : indice));
  }
}
