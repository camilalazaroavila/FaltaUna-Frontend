import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import urlLogo from '../../SVGs/ImagotipoBlanco.svg';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  protected readonly urlLogo = urlLogo;
}
