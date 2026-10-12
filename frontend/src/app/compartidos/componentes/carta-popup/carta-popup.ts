import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { CartaComponent } from '@compartidos/componentes/carta/carta';
import type { Carta } from '@modelos/carta.model';
import { ETIQUETA_CATEGORIA, ETIQUETA_RAREZA } from '@modelos/carta.model';

/** Id del título del diálogo (usado por `aria-labelledby`). */
const ID_TITULO = 'carta-popup-titulo';

/**
 * Popup de detalle de una carta: muestra la carta en sí, su nombre, rareza y
 * categoría, y una oración genérica ("Cuesta X y suma Y"). Las cartas no
 * obtenidas ocultan el nombre y la oración para no revelar su contenido.
 *
 * Se instancia condicionalmente (`@if`) desde la vista que lo abre y cierra por
 * la ✕, el fondo o la tecla Escape.
 */
@Component({
  selector: 'app-carta-popup',
  standalone: true,
  imports: [CartaComponent],
  templateUrl: './carta-popup.html',
  styleUrl: './carta-popup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'alPresionarEscape()',
  },
})
export class CartaPopupComponent implements AfterViewInit {
  readonly carta = input.required<Carta>();
  readonly cerrar = output<void>();

  protected readonly idTitulo = ID_TITULO;
  protected readonly nombreVisible = computed(() =>
    this.carta().obtenida ? this.carta().nombre : '???',
  );
  protected readonly etiquetaMeta = computed(
    () => `${ETIQUETA_RAREZA[this.carta().rareza]} · ${ETIQUETA_CATEGORIA[this.carta().categoria]}`,
  );
  protected readonly oracion = computed(() => {
    const { atributoIzquierdo, atributoDerecho } = this.carta();
    return `Cuesta ${atributoDerecho} y suma ${atributoIzquierdo}.`;
  });

  private readonly dialogo = viewChild<ElementRef<HTMLElement>>('dialogo');
  private readonly focoPrevio = document.activeElement as HTMLElement | null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.focoPrevio?.focus?.());
  }

  ngAfterViewInit(): void {
    this.dialogo()?.nativeElement.focus();
  }

  protected alPresionarEscape(): void {
    this.cerrar.emit();
  }
}
