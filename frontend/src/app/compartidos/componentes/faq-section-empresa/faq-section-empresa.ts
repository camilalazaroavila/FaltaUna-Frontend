import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { PreguntaFrecuente } from '../../../modelos/landing-empresa.model';
import { FaqItemEmpresa } from '../faq-item-empresa/faq-item-empresa';

@Component({
  selector: 'app-faq-section-empresa',
  standalone: true,
  imports: [FaqItemEmpresa],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq-section-empresa.html',
  styleUrl: './faq-section-empresa.scss',
})
export class FaqSectionEmpresa {
  readonly preguntas = input.required<PreguntaFrecuente[]>();

  protected readonly preguntaAbierta = signal<number | null>(null);

  protected alternar(indice: number): void {
    this.preguntaAbierta.update((actual) => (actual === indice ? null : indice));
  }
}
