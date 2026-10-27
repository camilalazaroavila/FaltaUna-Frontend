import { ChangeDetectionStrategy, Component, ElementRef, HostListener, effect, input, output, viewChild } from '@angular/core';

@Component({
  selector: 'app-expo-popout',
  standalone: true,
  templateUrl: './expo-popout.html',
  styleUrl: './expo-popout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpoPopout {
  readonly abierto = input<boolean>(false);
  readonly urlImagen = input.required<string>();
  readonly altImagen = input<string>('');
  readonly titulo = input<string>('');
  readonly texto = input.required<string>();
  readonly textoAccion = input<string>('Girar la ruleta');
  readonly accion = output<void>();

  readonly cerrar = output<void>();

  protected readonly idTitulo = 'expo-popout-titulo';
  private readonly dialogo = viewChild<ElementRef<HTMLElement>>('dialogo');

  constructor() {
    effect(() => {
      if (this.abierto()) {
        queueMicrotask(() => this.dialogo()?.nativeElement.focus());
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected alEscape(): void {
    if (this.abierto()) this.cerrar.emit();
  }
}