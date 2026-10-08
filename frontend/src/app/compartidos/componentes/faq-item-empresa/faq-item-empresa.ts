import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

let contadorIdsFaqEmpresa = 0;

@Component({
  selector: 'app-faq-item-empresa',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq-item-empresa.html',
  styleUrl: './faq-item-empresa.scss',
})
export class FaqItemEmpresa {
  readonly pregunta = input.required<string>();
  readonly respuesta = input.required<string>();
  readonly abierto = input(false);

  readonly alternar = output<void>();

  private readonly id = ++contadorIdsFaqEmpresa;
  protected readonly idCabecera = `faq-empresa-cabecera-${this.id}`;
  protected readonly idPanel = `faq-empresa-panel-${this.id}`;
}
