import { ChangeDetectionStrategy, Component } from '@angular/core';
import estrellaRareza from '../../SVGs/EstrellaRareza.svg';

@Component({
  selector: 'app-estrella-rareza',
  standalone: true,
  templateUrl: './estrella-rareza.html',
  styleUrl: './estrella-rareza.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstrellaRarezaComponent {
  readonly urlEstrella = estrellaRareza;
}

