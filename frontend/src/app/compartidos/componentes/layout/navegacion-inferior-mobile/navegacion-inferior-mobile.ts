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

export interface ItemNavegacionInferior {
  readonly id: string;
  readonly etiqueta: string;
  readonly ruta: string;
  readonly rutasCoincidentes?: readonly string[];
  readonly icono: string;
  readonly deshabilitado?: boolean;
  readonly tieneIndicador?: boolean;
}

/**
 * Cuatro destinos principales del panel del jugador con ruta activa en `app.routes.ts`.
 * Reutiliza exactamente las rutas reales del jugador sin inventar URLs nuevas.
 */
export const DESTINOS_NAVEGACION_INFERIOR_JUGADOR: readonly ItemNavegacionInferior[] = [
  {
    id: 'cartas',
    etiqueta: 'Mis cartas',
    ruta: '/usuario/mis-cartas',
    rutasCoincidentes: ['/usuario/mis-cartas', '/usuario/mi-baraja'],
    icono: 'phosphorCards',
  },
  {
    id: 'albumes',
    etiqueta: 'Álbumes',
    ruta: '/usuario/albumes',
    rutasCoincidentes: ['/usuario/albumes'],
    icono: 'phosphorBookOpen',
  },
  {
    id: 'misiones',
    etiqueta: 'Misiones',
    ruta: '/usuario/misiones',
    rutasCoincidentes: ['/usuario/misiones'],
    icono: 'phosphorTrophy',
  },
  {
    id: 'cupones',
    etiqueta: 'Mis cupones',
    ruta: '/usuario/cupones',
    rutasCoincidentes: ['/usuario/cupones'],
    icono: 'phosphorTicket',
  },
];

export const ACCION_PRINCIPAL_JUGADOR: ItemNavegacionInferior = {
  id: 'jugar',
  etiqueta: 'Jugar',
  ruta: '/usuario/jugar',
  rutasCoincidentes: ['/usuario/jugar'],
  icono: 'phosphorGameController',
};

/**
 * Barra de navegación inferior mobile para el modo jugador.
 *
 * - Visible únicamente en pantallas menores al breakpoint `md` (< 768px), salvo en
 *   `modoVistaPrevia` (usado en la galería de componentes).
 * - Incluye botón circular flotante a la izquierda abrazado por un recorte cóncavo
 *   vectorial (SVG) y cuatro íconos de línea fina a la derecha.
 * - Al hacer scroll hacia abajo pasa al estado "ligeramente oculto", dejando asomada
 *   una franja mínima con el botón flotante visible; al subir o tocar la franja,
 *   vuelve a desplegarse completa.
 */
@Component({
  selector: 'app-navegacion-inferior-mobile',
  standalone: true,
  imports: [RouterLink, NgIcon],
  viewProviders: [
    provideIcons({
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

  /** Cuatro ítems de navegación repartidos a la derecha del botón flotante. */
  readonly items = input<readonly ItemNavegacionInferior[]>(DESTINOS_NAVEGACION_INFERIOR_JUGADOR);

  /** Acción principal del botón circular flotante izquierdo ("Jugar"). */
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

  protected readonly rutaActual = signal<string>(this.limpiarUrl(this.router.url));
  protected readonly ocultoParcial = signal<boolean>(false);

  private ultimoScrollY = 0;
  private rafScrollPendiente = false;
  private animacionEntradaEjecutada = false;

  protected readonly rutaEfectiva = computed(() => {
    const manual = this.rutaActivaManual();
    return manual !== null ? this.limpiarUrl(manual) : this.rutaActual();
  });

  /**
   * Determina si la barra debe mostrarse según la ruta actual:
   * - Se muestra en las rutas del panel del jugador (`/usuario` y `/usuario/*`).
   * - No se muestra en login, registro, landing pública (`/`, `/empresa/landing`) ni partida (`/juego/*`).
   */
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
        this.ocultoParcial.set(false);
      });

    this.destroyRef.onDestroy(() => sub.unsubscribe());

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

  /**
   * Procesa una nueva posición vertical de scroll sin provocar cambios de layout:
   * - Al bajar (`delta > 10` y `scrollY > 24`): oculta parcialmente la barra dejando la franja y el botón flotante.
   * - Al subir (`delta < -8` o cerca del tope `scrollY <= 16`): vuelve a mostrar la barra completa.
   */
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

  /** Despliega nuevamente la barra completa cuando estaba ligeramente oculta. */
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
    this.seleccionarItem.emit(item);
    if (this.modoVistaPrevia()) {
      event.preventDefault();
    }
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

