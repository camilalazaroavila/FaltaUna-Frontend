import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartaComponent } from '../../compartidos/componentes/carta/carta';
import { CARTAS_MOCK } from '../../modelos/cartas.mock';
import type { Carta, CategoriaCarta, RarezaCarta } from '../../modelos/carta.model';
import { ETIQUETA_CATEGORIA } from '../../modelos/carta.model';

import urlGastro from '../../compartidos/SVGs/Icon_GastroInv.svg';
import urlCosme from '../../compartidos/SVGs/Icon_CosmeInv.svg';
import urlDeco from '../../compartidos/SVGs/Icon_DecoInv.svg';
import urlIndumentaria from '../../compartidos/SVGs/Icon_IndumentariaInv.svg';
import urlEntretenimiento from '../../compartidos/SVGs/Icon_EntretenimientoInv.svg';
import urlMusica from '../../compartidos/SVGs/Icon_MusicaINV.svg';
import urlTecno from '../../compartidos/SVGs/Icon_TecnoInv.svg';

import urlLogo from '../../compartidos/SVGs/Imagotipo_claro.svg';

export type FiltroObtencion = 'todas' | 'obtenidas' | 'no-obtenidas';

export type CriterioOrden = 'nombre-asc' | 'nombre-desc' | 'rareza' | 'categoria';

interface BotonCategoria {
  readonly categoria: CategoriaCarta;
  readonly etiqueta: string;
  readonly urlIcono: string;
}

interface OpcionObtencion {
  readonly valor: FiltroObtencion;
  readonly etiqueta: string;
}

const ORDEN_RAREZA: Record<RarezaCarta, number> = {
  comun: 0,
  rara: 1,
  epicarta: 2,
  legendaria: 3,
};

const ORDEN_CATEGORIA: Record<CategoriaCarta, number> = {
  gastronomia: 0,
  cosmeticos: 1,
  decoracion: 2,
  indumentaria: 3,
  entretenimiento: 4,
  musica: 5,
  tecnologia: 6,
};

const COLECCION: Carta[] = CARTAS_MOCK;

@Component({
  selector: 'app-mis-cartas',
  standalone: true,
  imports: [RouterLink, CartaComponent],
  templateUrl: './mis-cartas.html',
  styleUrl: './mis-cartas.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisCartas {
  protected readonly urlLogo = urlLogo;

  // Datos
  private readonly coleccion = signal<Carta[]>(COLECCION);

  // Filtros (signals)
  protected readonly busqueda = signal('');
  protected readonly filtroObtencion = signal<FiltroObtencion>('todas');
  protected readonly categoriaActiva = signal<CategoriaCarta | null>(null);
  protected readonly criterioOrden = signal<CriterioOrden>('nombre-asc');

  protected readonly opcionesObtencion: readonly OpcionObtencion[] = [
    { valor: 'todas', etiqueta: 'Todas' },
    { valor: 'obtenidas', etiqueta: 'Obtenidas' },
    { valor: 'no-obtenidas', etiqueta: 'No obtenidas' },
  ];

  // Botones de categoría
  protected readonly categoriasDisponibles: readonly BotonCategoria[] = [
    {
      categoria: 'gastronomia',
      etiqueta: ETIQUETA_CATEGORIA.gastronomia,
      urlIcono: urlGastro,
    },
    {
      categoria: 'cosmeticos',
      etiqueta: ETIQUETA_CATEGORIA.cosmeticos,
      urlIcono: urlCosme,
    },
    {
      categoria: 'decoracion',
      etiqueta: ETIQUETA_CATEGORIA.decoracion,
      urlIcono: urlDeco,
    },
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

  protected readonly cartasFiltradas = computed(() => {
    let cartas = this.coleccion();

    const termino = this.busqueda().trim().toLowerCase();
    if (termino) {
      cartas = cartas.filter((c) => c.nombre.toLowerCase().includes(termino));
    }

    const filtro = this.filtroObtencion();
    if (filtro === 'obtenidas') {
      cartas = cartas.filter((c) => c.obtenida);
    } else if (filtro === 'no-obtenidas') {
      cartas = cartas.filter((c) => !c.obtenida);
    }

    const cat = this.categoriaActiva();
    if (cat) {
      cartas = cartas.filter((c) => c.categoria === cat);
    }

    const orden = this.criterioOrden();
    return [...cartas].sort((a, b) => {
      switch (orden) {
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre, 'es');
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre, 'es');
        case 'rareza':
          return ORDEN_RAREZA[a.rareza] - ORDEN_RAREZA[b.rareza];
        case 'categoria':
          return (
            ORDEN_CATEGORIA[a.categoria] - ORDEN_CATEGORIA[b.categoria] ||
            a.nombre.localeCompare(b.nombre, 'es')
          );
        default:
          return 0;
      }
    });
  });

  protected readonly sinResultados = computed(() => this.cartasFiltradas().length === 0);

  protected readonly resumen = computed(() => {
    const total = this.coleccion().length;
    const obtenidas = this.coleccion().filter((c) => c.obtenida).length;
    return { total, obtenidas };
  });

  actualizarBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
  }

  cambiarFiltroObtencion(filtro: FiltroObtencion): void {
    this.filtroObtencion.set(filtro);
  }

  cambiarOrden(evento: Event): void {
    this.criterioOrden.set((evento.target as HTMLSelectElement).value as CriterioOrden);
  }

  toggleCategoria(categoria: CategoriaCarta): void {
    this.categoriaActiva.update((actual) => (actual === categoria ? null : categoria));
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroObtencion.set('todas');
    this.categoriaActiva.set(null);
  }
}
