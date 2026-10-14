import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-panel-desplazable',
  standalone: true,
  host: {
    class: 'block w-full h-full min-h-0 overflow-hidden',
  },
  template: `
    <div class="relative flex w-full h-full min-h-0 select-none overflow-hidden">
      <!-- CONTENEDOR CON SCROLL NATIVO (la barra del navegador se oculta) -->
      <div
        #scrollContainer
        (scroll)="onScroll()"
        class="panel-desplazable flex-1 h-full overflow-y-auto overflow-x-hidden pr-2 sm:pr-3"
        [class]="clasesExtra()"
      >
        <div #contenido>
          <ng-content />
        </div>
      </div>

      <!-- BARRA PERSONALIZADA: carril amarillo ancho + tirador verde fino y centrado.
           Es siempre visible: sin nada que desplazar, el tirador ocupa todo el carril. -->
      <div
        class="w-8 sm:w-10 2xl:w-12 h-full shrink-0 py-2 pl-1 select-none"
        aria-hidden="true"
      >
        <div class="h-full w-full rounded-xl bg-[#f9f9b2] shadow-md px-1 py-2 2xl:py-3">
          <!-- Área útil: el tirador se posiciona en % dentro de este espacio -->
          <div class="relative h-full w-full">
            <div
              data-thumb
              class="absolute left-1/2 w-[36%] -translate-x-1/2 rounded-full bg-[#0d3b40] transition-[height] duration-200"
              [style.height.%]="alturaThumb()"
              [style.top.%]="posicionThumb()"
            ></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .panel-desplazable {
      scrollbar-width: none; /* Oculta barra nativa en Firefox para usar la estilizada */
      -ms-overflow-style: none; /* IE y Edge */
    }

    .panel-desplazable::-webkit-scrollbar {
      display: none; /* Oculta barra nativa en WebKit */
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelDesplazable implements AfterViewInit {
  readonly clasesExtra = input<string>('');

  private readonly destroyRef = inject(DestroyRef);
  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');
  private readonly contenido = viewChild<ElementRef<HTMLDivElement>>('contenido');

  /** Alto del tirador en % del carril. 100 = no hay nada que desplazar. */
  protected readonly alturaThumb = signal<number>(100);
  /** Distancia desde arriba en % del carril. */
  protected readonly posicionThumb = signal<number>(0);

  ngAfterViewInit(): void {
    this.onScroll();

    // Recalcula cuando cambia el tamaño del panel o del contenido (p. ej. al cargar el catálogo).
    if (typeof ResizeObserver === 'undefined') return;

    const observador = new ResizeObserver(() => this.onScroll());
    const contenedor = this.scrollContainer()?.nativeElement;
    const interior = this.contenido()?.nativeElement;
    if (contenedor) observador.observe(contenedor);
    if (interior) observador.observe(interior);
    this.destroyRef.onDestroy(() => observador.disconnect());
  }

  onScroll(): void {
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;

    const { scrollHeight, clientHeight, scrollTop } = el;

    // Sin scroll posible: el tirador ocupa todo el carril (con el margen del propio carril).
    if (scrollHeight <= clientHeight || clientHeight === 0) {
      this.alturaThumb.set(100);
      this.posicionThumb.set(0);
      return;
    }

    const alto = Math.max(15, (clientHeight / scrollHeight) * 100);
    const scrollMax = scrollHeight - clientHeight;
    const recorrido = 100 - alto;
    const top = Math.min(recorrido, Math.max(0, (scrollTop / scrollMax) * recorrido));

    this.alturaThumb.set(alto);
    this.posicionThumb.set(top);
  }
}