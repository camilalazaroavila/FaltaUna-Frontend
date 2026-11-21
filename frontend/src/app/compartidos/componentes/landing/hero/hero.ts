import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  private readonly document = inject(DOCUMENT);

  protected irAPlanes(): void {
    const elemento = this.document.getElementById('planes');
    elemento?.scrollIntoView({ behavior: 'smooth' });
  }
}
