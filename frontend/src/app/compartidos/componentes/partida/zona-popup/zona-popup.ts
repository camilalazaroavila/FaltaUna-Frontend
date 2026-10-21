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
  signal,
  viewChild,
} from '@angular/core';
import type { Carta } from '@modelos/carta.model';
import { ETIQUETA_CATEGORIA } from '@modelos/carta.model';

/** Imagen de respaldo si la foto de la zona no carga. */
const IMAGEN_RESPALDO = 'imagenes/Sprite.png';

/** Id del título del diálogo (usado por `aria-labelledby`). */
const ID_TITULO = 'zona-popup-titulo';

/**
 * Efecto de una zona, como datos. MOCK: los efectos reales los define el
 * equipo (context.md, sección 11).
 */
export interface EfectoZona {
  readonly categoria: Carta['categoria'];
  readonly bonus: number;
}

/**
 * Popup de detalle de una zona: foto con marco redondeado horizontal, nombre
 * y el texto del efecto, armado desde datos. Misma estructura que
 * `carta-popup`: se instancia con `@if` y cierra por ✕, fondo o Escape.
 */
@Component({
  selector: 'app-zona-popup',
  standalone: true,
  templateUrl: './zona-popup.html',
  styleUrl: './zona-popup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'alPresionarEscape()',
  },
})
export class ZonaPopupComponent implements AfterViewInit {
  readonly nombre = input.required<string>();
  readonly imagenUrl = input.required<string>();
  readonly efecto = input.required<EfectoZona>();
  readonly cerrar = output<void>();

  protected readonly idTitulo = ID_TITULO;
  protected readonly falloImagen = signal(false);
  protected readonly imagen = computed(() =>
    this.falloImagen() ? IMAGEN_RESPALDO : this.imagenUrl(),
  );
  protected readonly categoriaEtiqueta = computed(
    () => ETIQUETA_CATEGORIA[this.efecto().categoria],
  );

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

  /** Trampa de Tab mínima: con un solo control (✕) el foco alterna con el diálogo. */
  protected alPresionarTab(evento: Event): void {
    const dialogo = this.dialogo()?.nativeElement;
    const cerrarBtn = dialogo?.querySelector<HTMLElement>('.zona-popup__cerrar');

    if (!dialogo || !cerrarBtn) {
      return;
    }

    evento.preventDefault();
    (document.activeElement === cerrarBtn ? dialogo : cerrarBtn).focus();
  }
}