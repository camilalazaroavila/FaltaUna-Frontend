import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

let contadorIdsFaq = 0;

@Component({
  selector: 'app-faq-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq-item.html',
  styleUrl: './faq-item.scss',
})
export class FaqItem {
  readonly pregunta = input.required<string>();
  readonly respuesta = input.required<string>();
  readonly abierto = input(false);

  /** Notifica a la sección que esta pregunta quiere alternar su estado. */
  readonly alternar = output<void>();

  private readonly id = ++contadorIdsFaq;
  protected readonly idCabecera = `faq-empresa-cabecera-${this.id}`;
  protected readonly idPanel = `faq-empresa-panel-${this.id}`;
}
