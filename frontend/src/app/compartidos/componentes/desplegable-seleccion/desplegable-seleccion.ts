import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

export interface OpcionDesplegable {
  readonly valor: string;
  readonly etiqueta: string;
}

interface ItemDesplegable {
  readonly valor: string | null;
  readonly etiqueta: string;
}

export type VarianteDesplegable = 'neutro' | 'verde';

let instancias = 0;

/**
 * Select simple y accesible: el disparador es un `<button>` con
 * `aria-haspopup="listbox"` y `aria-expanded`, y la lista es un `role="listbox"`
 * con opciones `role="option"`. El foco se queda en el disparador y se anuncia
 * la opción activa con `aria-activedescendant`.
 *
 * Teclado: Enter/Space/ArrowDown abren; flechas mueven; Enter/Space eligen;
 * Escape cierra. Un clic fuera del componente también cierra.
 */
@Component({
  selector: 'app-desplegable-seleccion',
  imports: [NgIcon],
  templateUrl: './desplegable-seleccion.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-block' },
})
export class DesplegableSeleccion implements OnDestroy {
  private readonly elementoRef = inject(ElementRef<HTMLElement>);

  readonly etiqueta = input.required<string>();
  readonly opciones = input.required<readonly OpcionDesplegable[]>();
  readonly valor = input<string | null>(null);
  /** Texto del disparador cuando no hay selección; también la opción de limpiar. */
  readonly marcador = input<string>('Todas');
  readonly permitirLimpiar = input<boolean, unknown>(true, { transform: booleanAttribute });
  readonly variante = input<VarianteDesplegable>('neutro');
  /**
   * Muestra `etiqueta: valor` dentro del disparador (p. ej. "Categoría: Todas").
   * Apagado por defecto: el disparador solo muestra el valor seleccionado.
   */
  readonly mostrarEtiqueta = input<boolean, unknown>(false, { transform: booleanAttribute });

  readonly valorCambiar = output<string | null>();

  protected readonly idLista = `desplegable-lista-${++instancias}`;

  protected readonly abierto = signal(false);
  protected readonly indiceActivo = signal(-1);

  protected readonly opcionesInternas = computed<readonly ItemDesplegable[]>(() => {
    const base: readonly ItemDesplegable[] = this.opciones();
    return this.permitirLimpiar()
      ? [{ valor: null, etiqueta: this.marcador() }, ...base]
      : base;
  });

  protected readonly etiquetaSeleccionada = computed(() => {
    const valor = this.valor();
    return this.opciones().find((o) => o.valor === valor)?.etiqueta ?? this.marcador();
  });

  protected readonly clasesDisparador = computed(() => {
    const base = [
      'inline-flex cursor-pointer items-center gap-2 rounded-pildora px-3.5 py-2',
      'font-interfaz text-xs font-semibold whitespace-nowrap',
      'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-foco',
    ];

    return this.variante() === 'verde'
      ? [
          ...base,
          'border border-transparent bg-marca-primaria text-marca-sobre-primaria shadow-baja hover:brightness-105',
        ].join(' ')
      : [
          ...base,
          'border border-borde-coleccion bg-fondo-coleccion-superficie text-texto-primario hover:bg-white/6',
        ].join(' ');
  });

  protected readonly idOpcion = (indice: number): string => `${this.idLista}-opcion-${indice}`;

  protected esSeleccionado(item: ItemDesplegable): boolean {
    return item.valor === this.valor();
  }

  protected alternar(): void {
    if (this.abierto()) {
      this.cerrar();
    } else {
      this.abrir();
    }
  }

  protected alTeclado(evento: KeyboardEvent): void {
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        this.abierto() ? this.mover(1) : this.abrir();
        break;
      case 'ArrowUp':
        evento.preventDefault();
        this.abierto() ? this.mover(-1) : this.abrir();
        break;
      case 'Home':
        if (this.abierto()) {
          evento.preventDefault();
          this.indiceActivo.set(0);
        }
        break;
      case 'End':
        if (this.abierto()) {
          evento.preventDefault();
          this.indiceActivo.set(this.opcionesInternas().length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        evento.preventDefault();
        this.abierto() ? this.elegirActivo() : this.abrir();
        break;
      case 'Escape':
        if (this.abierto()) {
          evento.preventDefault();
          this.cerrar();
        }
        break;
      default:
        break;
    }
  }

  protected elegir(item: ItemDesplegable): void {
    this.valorCambiar.emit(item.valor);
    this.cerrar();
  }

  private abrir(): void {
    const actual = this.opcionesInternas().findIndex((o) => o.valor === this.valor());
    this.indiceActivo.set(actual >= 0 ? actual : 0);
    this.abierto.set(true);
    document.addEventListener('click', this.alClicFuera, true);
  }

  private cerrar(): void {
    this.abierto.set(false);
    this.indiceActivo.set(-1);
    document.removeEventListener('click', this.alClicFuera, true);
  }

  private mover(desplazamiento: number): void {
    const total = this.opcionesInternas().length;
    const siguiente = Math.min(total - 1, Math.max(0, this.indiceActivo() + desplazamiento));
    this.indiceActivo.set(siguiente);
  }

  private elegirActivo(): void {
    const item = this.opcionesInternas()[this.indiceActivo()];
    if (item) {
      this.elegir(item);
    }
  }

  private readonly alClicFuera = (evento: MouseEvent): void => {
    if (!this.elementoRef.nativeElement.contains(evento.target as Node)) {
      this.cerrar();
    }
  };

  ngOnDestroy(): void {
    document.removeEventListener('click', this.alClicFuera, true);
  }
}
