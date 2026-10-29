import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorTrophyFill } from '@ng-icons/phosphor-icons/fill';
import {
  phosphorArrowsLeftRight,
  phosphorBookOpen,
  phosphorCards,
  phosphorGameController,
  phosphorHouse,
  phosphorTicket,
  phosphorTrophy,
  phosphorUser,
} from '@ng-icons/phosphor-icons/regular';
import { filter } from 'rxjs/operators';
import { GsapService } from '@servicios/gsap.service';

import urlIconPelea from '@svgs/IconPelea.svg';
import urlIconoMisCartas from '@svgs/Icon_misCartas.svg';
import urlIconoAlbum from '@svgs/Icon_Album.svg';
import urlIconoDescuento from '@svgs/Icon_Descuento.svg';

export interface ItemNavegacionInferior {
  readonly id: string;
  readonly etiqueta: string;
  readonly ruta: string;
  readonly rutasCoincidentes?: readonly string[];
  readonly icono?: string;
  readonly urlIcono?: string;
  readonly esIconoMulticolor?: boolean;
  readonly deshabilitado?: boolean;
  readonly tieneIndicador?: boolean;
}

/**
 * Cuatro destinos principales del panel del jugador con los mismos íconos y rutas que desktop.
 */
export const DESTINOS_NAVEGACION_INFERIOR_JUGADOR: readonly ItemNavegacionInferior[] = [
  {
    id: 'cartas',
    etiqueta: 'Mis cartas',
    ruta: '/usuario/mis-cartas',
    rutasCoincidentes: ['/usuario/mis-cartas', '/usuario/mi-baraja'],
    urlIcono: urlIconoMisCartas,
  },
  {
    id: 'albumes',
    etiqueta: 'Álbumes',
    ruta: '/usuario/albumes',
    rutasCoincidentes: ['/usuario/albumes'],
    urlIcono: urlIconoAlbum,
  },
  {
    id: 'misiones',
    etiqueta: 'Misiones',
    ruta: '/usuario/misiones',
    rutasCoincidentes: ['/usuario/misiones'],
    icono: 'phosphorTrophyFill',
  },
  {
    id: 'cupones',
    etiqueta: 'Mis cupones',
    ruta: '/usuario/cupones',
    rutasCoincidentes: ['/usuario/cupones'],
    urlIcono: urlIconoDescuento,
  },
];

/**
 * Acción principal de jugar con el mismo ícono de pelea (`IconPelea.svg`) de desktop achicado.
 */
export const ACCION_PRINCIPAL_JUGADOR: ItemNavegacionInferior = {
  id: 'jugar',
  etiqueta: 'Jugar',
  ruta: '/usuario/jugar',
  rutasCoincidentes: ['/usuario/jugar'],
  urlIcono: urlIconPelea,
  esIconoMulticolor: true,
};

/**
 * Barra de navegación inferior mobile para el modo jugador.
 *
 * - Superficie verde (`--nav-inferior-superficie`) con sombra/reborde amarillo de contraste.
 * - Incluye el botón de jugar (`IconPelea.svg`) y los 4 destinos con los mismos íconos de desktop.
 * - Efecto de "ola": el recorte curvo cóncavo vectorial se desplaza horizontalmente hacia
 *   el botón activo/seleccionado y eleva ese botón en un círculo flotante abrazado por la ola.
 */
@Component({
  selector: 'app-navegacion-inferior-mobile',
  standalone: true,
  imports: [RouterLink, NgIcon],
  viewProviders: [
    provideIcons({
      phosphorTrophyFill,
      phosphorCards,
      phosphorBookOpen,
      phosphorTrophy,
      phosphorTicket,
      phosphorGameController,
      phosphorArrowsLeftRight,
      phosphorUser,
      phosphorHouse,
    }),
  ],
  templateUrl: './navegacion-inferior-mobile.html',
  styleUrl: './navegacion-inferior-mobile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavegacionInferiorMobile {
  private readonly router = inject(Router);
  private readonly gsapService = inject(GsapService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  /** Cuatro ítems de navegación repartidos a la derecha del botón de jugar. */
  readonly items = input<readonly ItemNavegacionInferior[]>(DESTINOS_NAVEGACION_INFERIOR_JUGADOR);

  /** Acción principal de jugar (`IconPelea.svg`). */
  readonly accionPrincipal = input<ItemNavegacionInferior>(ACCION_PRINCIPAL_JUGADOR);

  /** Permite mostrar etiquetas de texto debajo del ícono (Open Decision; por defecto solo íconos). */
  readonly mostrarEtiquetas = input<boolean>(false);

  /** Modo de vista previa para renderizar en línea dentro de la galería de componentes. */
  readonly modoVistaPrevia = input<boolean>(false);

  /** Ruta simulada opcional (para galería o pruebas). Si es `null`, usa la URL real del Router. */
  readonly rutaActivaManual = input<string | null>(null);

  /** Estado inicial de ocultamiento parcial (útil para previsualizar el estado oculto en galería). */
  readonly ocultoInicial = input<boolean>(false);

  /** Emite el ítem seleccionado al interactuar. */
  readonly seleccionarItem = output<ItemNavegacionInferior>();

  private readonly contenedorAnimado = viewChild<ElementRef<HTMLElement>>('contenedorAnimado');
  private readonly olaSvgRef = viewChild<ElementRef<SVGElement>>('olaSvg');

  protected readonly rutaActual = signal<string>(this.limpiarUrl(this.router.url));
  protected readonly ocultoParcial = signal<boolean>(false);
  protected readonly idSeleccionadoOla = signal<string | null>(null);

  private ultimoScrollY = 0;
  private rafScrollPendiente = false;
  private animacionEntradaEjecutada = false;

  protected readonly rutaEfectiva = computed(() => {
    const manual = this.rutaActivaManual();
    return manual !== null ? this.limpiarUrl(manual) : this.rutaActual();
  });

  protected readonly todosLosBotones = computed<readonly ItemNavegacionInferior[]>(() => [
    this.accionPrincipal(),
    ...this.items(),
  ]);

  /**
   * Índice del botón que actualmente recibe el recorte cóncavo de la ola y se eleva.
   * Si hay un ítem activo por ruta o clic lo sigue; en `/usuario` (home) descansa en el botón 0 ("Jugar").
   */
  protected readonly indiceOlaActivo = computed<number>(() => {
    const lista = this.todosLosBotones();
    const idManual = this.idSeleccionadoOla();
    if (idManual) {
      const idxManual = lista.findIndex((b) => b.id === idManual);
      if (idxManual >= 0) return idxManual;
    }

    const idxRuta = lista.findIndex((b) => this.esItemActivo(b));
    return idxRuta >= 0 ? idxRuta : 0;
  });

  /** Coordenada horizontal porcentual del centro de la ola para el botón activo. */
  protected readonly porcentajeCentroOla = computed<string>(() => {
    const total = Math.max(1, this.todosLosBotones().length);
    const idx = this.indiceOlaActivo();
    const pct = ((idx + 0.5) / total) * 100;
    return `${pct}%`;
  });

  protected readonly esVisible = computed(() => {
    if (this.modoVistaPrevia()) {
      return true;
    }
    return this.esRutaJugadorPermitida(this.rutaEfectiva());
  });

  constructor() {
    const sub = this.router.events
      .pipe(filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd))
      .subscribe((ev) => {
        this.rutaActual.set(this.limpiarUrl(ev.urlAfterRedirects || ev.url));
        this.idSeleccionadoOla.set(null);
        this.ocultoParcial.set(false);
      });

    this.destroyRef.onDestroy(() => sub.unsubscribe());

    effect(() => {
      // Al cambiar rutaActivaManual desde afuera, sincroniza la ola con la ruta manual
      this.rutaActivaManual();
      this.idSeleccionadoOla.set(null);
    });

    effect(() => {
      this.ocultoParcial.set(this.ocultoInicial());
    });

    effect(() => {
      const ref = this.contenedorAnimado();
      if (!ref) {
        this.animacionEntradaEjecutada = false;
        return;
      }
      if (this.animacionEntradaEjecutada) {
        return;
      }
      this.animacionEntradaEjecutada = true;
      this.ejecutarAnimacionEntrada(ref.nativeElement);
    });

    if (this.esNavegador) {
      this.iniciarEscuchaScroll();
    }
  }

  /** Evalúa si una ruta corresponde al panel del jugador (excluyendo login, registro, landing y partida). */
  esRutaJugadorPermitida(url: string): boolean {
    const limpia = this.limpiarUrl(url);
    if (
      limpia === '' ||
      limpia === '/' ||
      limpia.startsWith('/login') ||
      limpia.startsWith('/registro') ||
      limpia.startsWith('/empresa') ||
      limpia.startsWith('/juego') ||
      limpia.startsWith('/empleado') ||
      limpia.startsWith('/componentes')
    ) {
      return false;
    }
    return limpia === '/usuario' || limpia.startsWith('/usuario/');
  }

  /** Indica si el ítem pasado coincide con la ruta activa actual. */
  esItemActivo(item: ItemNavegacionInferior): boolean {
    const actual = this.rutaEfectiva();
    const candidatos = item.rutasCoincidentes?.length ? item.rutasCoincidentes : [item.ruta];
    return candidatos.some((ruta) => {
      const limpia = this.limpiarUrl(ruta);
      if (limpia === '/usuario') {
        return actual === '/usuario';
      }
      return actual === limpia || actual.startsWith(`${limpia}/`);
    });
  }

  /** Indica si debe respetarse movimiento reducido (sistema o interruptor de galería). */
  esMovimientoReducido(): boolean {
    if (this.gsapService.movimientoReducido()) {
      return true;
    }
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('data-movimiento') === 'reducido';
    }
    return false;
  }

  procesarScroll(scrollYActual: number): void {
    if (scrollYActual <= 16) {
      this.ocultoParcial.set(false);
      this.ultimoScrollY = Math.max(0, scrollYActual);
      return;
    }

    const delta = scrollYActual - this.ultimoScrollY;
    if (delta > 10 && scrollYActual > 24) {
      this.ocultoParcial.set(true);
      this.ultimoScrollY = scrollYActual;
    } else if (delta < -8) {
      this.ocultoParcial.set(false);
      this.ultimoScrollY = scrollYActual;
    }
  }

  mostrarCompleta(): void {
    this.ocultoParcial.set(false);
  }

  protected alInteractuarItem(item: ItemNavegacionInferior, event: Event): void {
    if (item.deshabilitado) {
      event.preventDefault();
      return;
    }
    if (this.ocultoParcial()) {
      this.mostrarCompleta();
    }
    this.idSeleccionadoOla.set(item.id);
    this.animarPulsoOla();
    this.seleccionarItem.emit(item);
    if (this.modoVistaPrevia()) {
      event.preventDefault();
    }
  }

  private animarPulsoOla(): void {
    const svg = this.olaSvgRef()?.nativeElement;
    if (!svg || this.esMovimientoReducido()) {
      return;
    }

    this.gsapService.crearContexto(
      svg,
      (ambito) => {
        this.gsapService.gsap.fromTo(
          ambito,
          { scaleY: 0.88, transformOrigin: '50% 100%' },
          {
            scaleY: 1,
            duration: 0.36,
            ease: 'elastic.out(1.1, 0.5)',
            clearProps: 'transform',
          },
        );
      },
      this.destroyRef,
    );
  }

  private ejecutarAnimacionEntrada(elemento: HTMLElement): void {
    if (this.esMovimientoReducido()) {
      this.gsapService.gsap.set(elemento, { clearProps: 'transform,opacity' });
      return;
    }

    const duracion = this.gsapService.duracionPartida('micro', 0.24);
    this.gsapService.crearContexto(
      elemento,
      (ambito) => {
        this.gsapService.gsap.from(ambito, {
          y: 48,
          opacity: 0,
          duration: duracion,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
        });
      },
      this.destroyRef,
    );
  }

  private iniciarEscuchaScroll(): void {
    this.ultimoScrollY = Math.max(0, window.scrollY || 0);

    const alHacerScroll = () => {
      if (this.modoVistaPrevia() || this.rafScrollPendiente) {
        return;
      }
      this.rafScrollPendiente = true;
      window.requestAnimationFrame(() => {
        this.rafScrollPendiente = false;
        this.procesarScroll(window.scrollY || 0);
      });
    };

    window.addEventListener('scroll', alHacerScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', alHacerScroll));
  }

  private limpiarUrl(url: string): string {
    const sinQuery = (url || '/').split('?')[0].split('#')[0].trim();
    if (!sinQuery.startsWith('/')) {
      return `/${sinQuery}`;
    }
    return sinQuery.length > 1 && sinQuery.endsWith('/') ? sinQuery.slice(0, -1) : sinQuery;
  }
}
