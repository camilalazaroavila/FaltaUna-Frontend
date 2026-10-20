import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Header } from '@compartidos/componentes/layout/header/header';
import { CartaComponent } from '@compartidos/componentes/cartas/carta/carta';
import { CartaSeleccionableComponent } from '@compartidos/componentes/cartas/carta-seleccionable/carta-seleccionable';
import { CartaPopupComponent } from '@compartidos/componentes/cartas/carta-popup/carta-popup';
import { PulsacionCartaDirective } from '@compartidos/directivas/pulsacion-carta.directive';
import { BarajaService } from '@servicios/baraja.service';
import type { Carta, CategoriaCarta, RarezaCarta } from '@modelos/carta.model';
import { ETIQUETA_CATEGORIA, ETIQUETA_RAREZA } from '@modelos/carta.model';
import {
  RAREZAS_BARAJA,
  TAMANIO_BARAJA,
  calcularEstadoBaraja,
  puedeSeleccionar,
} from '@modelos/baraja.model';
import urlGastro from '@svgs/Icon_GastroInv.svg';
import urlCosme from '@svgs/Icon_CosmeInv.svg';
import urlDeco from '@svgs/Icon_DecoInv.svg';
import urlIndumentaria from '@svgs/Icon_IndumentariaInv.svg';
import urlEntretenimiento from '@svgs/Icon_EntretenimientoInv.svg';
import urlMusica from '@svgs/Icon_MusicaINV.svg';
import urlTecno from '@svgs/Icon_TecnoInv.svg';
import urlLogo from '@svgs/Imagotipo_claro.svg';
interface BotonCategoria {
  readonly categoria: CategoriaCarta;
  readonly etiqueta: string;
  readonly urlIcono: string;
}
type OrdenCatalogo = 'rareza-desc' | 'rareza-asc' | 'nombre-asc' | 'nombre-desc';
interface OpcionOrden {
  readonly valor: OrdenCatalogo;
  readonly etiqueta: string;
}
@Component({
  selector: 'app-mi-baraja',
  standalone: true,
  imports: [
    RouterLink,
    Header,
    CartaComponent,
    CartaSeleccionableComponent,
    CartaPopupComponent,
    PulsacionCartaDirective,
  ],
  templateUrl: './mi-baraja.html',
  styleUrl: './mi-baraja.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiBaraja {
  private readonly barajaService = inject(BarajaService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly tamanoBaraja = TAMANIO_BARAJA;
  protected readonly etiquetaRareza = ETIQUETA_RAREZA;
  protected readonly urlLogo = urlLogo;
  /** Tinte beige de los iconos de categoría (mismo que la vista "Mis cartas"). */
  protected readonly tinteIcono =
    'brightness(0) saturate(100%) invert(44%) sepia(34%) saturate(229%) hue-rotate(19deg) brightness(173%) contrast(129%)';
  // Datos
  protected readonly coleccion = signal<Carta[]>([]);
  protected readonly seleccion = signal<Carta[]>([]);
  protected readonly nombreBaraja = signal('Mi baraja');
  // Detalle de carta
  protected readonly cartaPopup = signal<Carta | null>(null);
  // Filtros del catálogo
  protected readonly busqueda = signal('');
  protected readonly categoriaActiva = signal<CategoriaCarta | null>(null);
  protected readonly filtroRareza = signal<RarezaCarta | null>(null);
  protected readonly orden = signal<OrdenCatalogo>('rareza-desc');
  /** Rarezas de mayor a menor poder, para los chips de filtro. */
  protected readonly rarezasDisponibles = [...RAREZAS_BARAJA]
    .reverse()
    .map((rareza) => ({ rareza, etiqueta: ETIQUETA_RAREZA[rareza] }));
  protected readonly ordenesDisponibles: readonly OpcionOrden[] = [
    { valor: 'rareza-desc', etiqueta: 'Rareza (mayor a menor)' },
    { valor: 'rareza-asc', etiqueta: 'Rareza (menor a mayor)' },
    { valor: 'nombre-asc', etiqueta: 'Nombre (A-Z)' },
    { valor: 'nombre-desc', etiqueta: 'Nombre (Z-A)' },
  ];
  // Feedback
  protected readonly aviso = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly guardado = signal(false);
  protected readonly categoriasDisponibles: readonly BotonCategoria[] = [
    { categoria: 'gastronomia', etiqueta: ETIQUETA_CATEGORIA.gastronomia, urlIcono: urlGastro },
    { categoria: 'cosmeticos', etiqueta: ETIQUETA_CATEGORIA.cosmeticos, urlIcono: urlCosme },
    { categoria: 'decoracion', etiqueta: ETIQUETA_CATEGORIA.decoracion, urlIcono: urlDeco },
    {
      categoria: 'indumentaria',
      etiqueta: ETIQUETA_CATEGORIA.indumentaria,
      urlIcono: urlIndumentaria,
    },
    {
      categoria: 'entretenimiento',
      etiqueta: ETIQUETA_CATEGORIA.entretenimiento,
      urlIcono: urlEntretenimiento,
    },
    { categoria: 'musica', etiqueta: ETIQUETA_CATEGORIA.musica, urlIcono: urlMusica },
    { categoria: 'tecnologia', etiqueta: ETIQUETA_CATEGORIA.tecnologia, urlIcono: urlTecno },
  ];
  /** Estado derivado de la selección (total, conteos por rareza, si se puede guardar). */
  protected readonly estado = computed(() => calcularEstadoBaraja(this.seleccion()));
  protected readonly porcentaje = computed(() =>
    Math.round((this.estado().total / TAMANIO_BARAJA) * 100),
  );
  protected readonly idsSeleccionados = computed(
    () => new Set(this.seleccion().map((carta) => carta.id)),
  );
  /** Cartas que no se pueden sumar: baraja llena o tope de rareza alcanzado. */
  protected readonly idsBloqueados = computed(() => {
    const seleccion = this.seleccion();
    const llena = seleccion.length >= TAMANIO_BARAJA;
    const porRareza = new Map(this.estado().conteos.map((conteo) => [conteo.rareza, conteo]));
    return new Set(
      this.coleccion()
        .filter((carta) => !this.idsSeleccionados().has(carta.id))
        .filter((carta) => {
          if (llena) {
            return true;
          }
          const conteo = porRareza.get(carta.rareza);
          return conteo ? conteo.seleccionadas >= conteo.maximo : false;
        })
        .map((carta) => carta.id),
    );
  });
  protected readonly cartasFiltradas = computed(() => {
    let cartas = this.coleccion();
    const termino = this.busqueda().trim().toLowerCase();
    if (termino) {
      cartas = cartas.filter((carta) => carta.nombre.toLowerCase().includes(termino));
    }
    const categoria = this.categoriaActiva();
    if (categoria) {
      cartas = cartas.filter((carta) => carta.categoria === categoria);
    }
    const rareza = this.filtroRareza();
    if (rareza) {
      cartas = cartas.filter((carta) => carta.rareza === rareza);
    }
    return [...cartas].sort(this.comparar());
  });
  /** Comparador según el orden elegido (por defecto: rareza de mayor a menor). */
  private comparar(): (a: Carta, b: Carta) => number {
    const orden = this.orden();
    const rango = (carta: Carta) => RAREZAS_BARAJA.indexOf(carta.rareza);
    const porNombre = (a: Carta, b: Carta) => a.nombre.localeCompare(b.nombre, 'es');
    switch (orden) {
      case 'rareza-desc':
        return (a, b) => rango(b) - rango(a) || porNombre(a, b);
      case 'rareza-asc':
        return (a, b) => rango(a) - rango(b) || porNombre(a, b);
      case 'nombre-desc':
        return (a, b) => b.nombre.localeCompare(a.nombre, 'es');
      case 'nombre-asc':
      default:
        return porNombre;
    }
  }
  protected readonly sinResultados = computed(() => this.cartasFiltradas().length === 0);
  /** Los 12 casilleros del panel: cartas elegidas primero, huecos al final. */
  protected readonly casilleros = computed<(Carta | null)[]>(() => {
    const seleccion = this.seleccion();
    return Array.from({ length: TAMANIO_BARAJA }, (_, indice) => seleccion[indice] ?? null);
  });
  constructor() {
    this.barajaService
      .obtenerCartasDisponibles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cartas) => this.coleccion.set(cartas));
    this.barajaService
      .obtenerMazoActual()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((mazo) => {
        if (!mazo) {
          return;
        }
        this.nombreBaraja.set(mazo.nombre);
        this.seleccion.set(
          mazo.cartas.map((carta) => ({
            id: String(carta.cartaId),
            nombre: carta.nombre,
            imagenUrl: carta.imagenUrl ?? '',
            rareza:
              ({ 1: 'comun', 2: 'rara', 3: 'epicarta', 4: 'legendaria' } as const)[
              carta.rarezaOrden
              ] ?? 'comun',
            categoria: 'gastronomia',
            atributoIzquierdo: carta.poder,
            atributoDerecho: carta.costoMana,
            obtenida: true,
          })),
        );
      });
  }
  protected actualizarBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }
  protected toggleCategoria(categoria: CategoriaCarta): void {
    this.categoriaActiva.update((actual) => (actual === categoria ? null : categoria));
  }
  protected toggleRareza(rareza: RarezaCarta): void {
    this.filtroRareza.update((actual) => (actual === rareza ? null : rareza));
  }
  protected cambiarOrden(evento: Event): void {
    this.orden.set((evento.target as HTMLSelectElement).value as OrdenCatalogo);
  }
  protected alternar(carta: Carta): void {
    if (this.idsSeleccionados().has(carta.id)) {
      this.quitar(carta);
      return;
    }
    const resultado = puedeSeleccionar(carta, this.seleccion());
    if (!resultado.permitido) {
      this.aviso.set(resultado.motivo ?? 'No podés agregar esa carta.');
      return;
    }
    this.seleccion.update((seleccion) => [...seleccion, carta]);
    this.aviso.set(null);
    this.guardado.set(false);
  }
  protected quitar(carta: Carta): void {
    this.seleccion.update((seleccion) => seleccion.filter((c) => c.id !== carta.id));
    this.aviso.set(null);
    this.guardado.set(false);
  }
  protected vaciar(): void {
    this.seleccion.set([]);
    this.aviso.set(null);
    this.guardado.set(false);
  }
  protected guardar(): void {
    if (!this.estado().puedeConfirmar || this.guardando()) {
      return;
    }
    this.guardando.set(true);
    this.barajaService
      .guardarBaraja(this.seleccion(), this.nombreBaraja())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.guardado.set(true);
          this.aviso.set(null);
        },
        error: () => {
          this.guardando.set(false);
          this.aviso.set('No se pudo guardar la baraja. Intentá de nuevo.');
        },
      });
  }
  protected actualizarNombre(evento: Event): void {
    this.nombreBaraja.set((evento.target as HTMLInputElement).value);
    this.guardado.set(false);
  }
  protected abrirPopup(carta: Carta): void {
    this.cartaPopup.set(carta);
  }
  protected cerrarPopup(): void {
    this.cartaPopup.set(null);
  }
}