import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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
      <!-- CONTENEDOR CON SCROLL NATIVO -->
      <div
        #scrollContainer
        (scroll)="onScroll()"
        class="panel-desplazable flex-1 h-full overflow-y-auto overflow-x-hidden pr-2 sm:pr-3"
        [class]="clasesExtra()"
      >
        <ng-content />
      </div>

      <!-- BARRA DE SCROLL LATERAL VISIBLE PERMANENTE (ESTILO MAQUETA IMAGEN 1) -->
      <div class="w-3 sm:w-3.5 h-full shrink-0 flex items-center justify-center py-2 pl-1 select-none">
        <div class="relative w-full h-full rounded-full bg-black/50 border border-white/15 p-0.5 flex flex-col justify-start">
          <!-- Tirador / Thumb redondeado crema (#eaf9a6) permanente -->
          <div
            class="w-full rounded-full bg-[#eaf9a6] shadow-sm transition-transform duration-75"
            [style.height.%]="alturaThumb()"
            [style.transform]="'translateY(' + posicionThumb() + 'px)'"
          ></div>
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

  private readonly scrollContainer = viewChild<ElementRef<HTMLDivElement>>('scrollContainer');

  // Estado del thumb visual permanente
  protected readonly alturaThumb = signal<number>(32);
  protected readonly posicionThumb = signal<number>(0);

  ngAfterViewInit(): void {
    this.onScroll();
  }

  onScroll(): void {
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;

    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const scrollTop = el.scrollTop;

    if (scrollHeight <= clientHeight || clientHeight === 0) {
      this.alturaThumb.set(32);
      this.posicionThumb.set(0);
      return;
    }

    const ratio = clientHeight / scrollHeight;
    const thumbPercent = Math.max(20, Math.min(60, ratio * 100));
    this.alturaThumb.set(thumbPercent);

    const trackHeight = clientHeight - (clientHeight * (thumbPercent / 100));
    const scrollMax = scrollHeight - clientHeight;
    const pos = (scrollTop / scrollMax) * trackHeight;
    this.posicionThumb.set(Math.max(0, pos));
  }
}
