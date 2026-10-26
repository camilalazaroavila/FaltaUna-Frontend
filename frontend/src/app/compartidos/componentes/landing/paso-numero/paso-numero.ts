import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-paso-numero',
  standalone: true,
  templateUrl: './paso-numero.html',
  styleUrl: './paso-numero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasoNumero {
  readonly numero = input.required<number | string>();
  readonly variante = input<'blanco' | 'crema'>('blanco');
}
