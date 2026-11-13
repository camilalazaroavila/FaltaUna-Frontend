import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorTrophyFill } from '@ng-icons/phosphor-icons/fill';
import { phosphorDotsThree, phosphorX } from '@ng-icons/phosphor-icons/regular';
import { filter } from 'rxjs/operators';
import { GsapService } from '@servicios/gsap.service';
import { IntercambioService } from '@servicios/intercambio.service';

import {
  ACCION_JUGAR_OLA,
  DESTINOS_NAVEGACION_OLA,
  type DestinoNavegacionOla,
} from './navegacion-ola.model';
import { limpiarUrlNavegacion, tieneNavUsuario } from './navegacion-ola.rutas';

/** Geometría de la ola (px). Única fuente: la usan el trazo SVG y el CSS (variables inline). */
const OLA = {
  circulo: 46,              // diámetro del círculo activo
  holgura: 6,               // separación constante círculo ↔ curva
  hombro: 24,               // tramo suave entre el borde recto y la curva
  altoMobile: 72,
  centroYMobile: 29,        // altura del centro del círculo dentro de la barra (px). Más alto = hueco más profundo
  radioEsquinaMobile: 14,
  paddingLateralMobile: 12,
  jugarRadio: 29,           // mitad del botón Jugar (3.625rem ≈ 58 px)
  respiro: 4,
  anchoDesktop: 80,
  centroXDesktop: 40,       // centro horizontal común para los ítemes y el círculo
  pasoDesktop: 62,          // alto de cada ítem
  margenDesktop: 46,        // aire arriba y abajo
  radioEsquinaDesktop: 20,  // lado que da al contenido
  sangradoIzquierdoDesktop: 14, // sangrado hacia la izquierda para que la sombra cartoon inferior cubra hasta x=0 sin corte
} as const;

const n = (v: number): number => Math.round(v * 100) / 100;

/** Trazo único de la barra inferior. `xc` es el centro de la ola (null = borde recto). */
function geometriaMobile(W: number, xc: number | null): { trazo: string; circulo: number } {
  const H = OLA.altoMobile;
  const rE = OLA.radioEsquinaMobile;
  const colW = (W - 2 * OLA.paddingLateralMobile) / 5;
  const limite = Math.min(
    OLA.paddingLateralMobile + colW / 2 - rE,
    colW - OLA.jugarRadio - OLA.respiro,
  );
  const R = Math.max(20, Math.min(OLA.circulo / 2 + OLA.holgura, limite - 5));
  const circulo = Math.max(28, (R - OLA.holgura) * 2);
  const cierre = `H ${n(W - rE)} A ${rE},${rE} 0 0 1 ${n(W)},${rE} V ${H} H 0 V ${rE} A ${rE},${rE} 0 0 1 ${rE},0 Z`;

  if (xc === null) {
    return { trazo: `M ${rE},0 ${cierre}`, circulo };
  }

  // Hueco en U: baja casi vertical, rodea el círculo por abajo y vuelve a subir.
  const yc = OLA.centroYMobile;
  const w = Math.min(R + OLA.hombro, limite);
  const x0 = xc - w;
  const x1 = xc + w;
  const xi = xc - R;
  const xd = xc + R;

  const trazo = [
    `M ${rE},0 H ${n(x0)}`,
    `C ${n(xi)},0 ${n(xi)},${n(yc * 0.5)} ${n(xi)},${n(yc)}`,
    `A ${n(R)},${n(R)} 0 0 0 ${n(xd)},${n(yc)}`,
    `C ${n(xd)},${n(yc * 0.5)} ${n(xd)},0 ${n(x1)},0`,
    cierre,
  ].join(' ');

  return { trazo, circulo };
}

/** Trazo de la barra lateral IZQUIERDA: borde izquierdo recto, la ola se interna abrazando el círculo. */
function trazoDesktop(A: number, H: number, yc: number, k: number): string {
  const rE = OLA.radioEsquinaDesktop;
  const sangrado = OLA.sangradoIzquierdoDesktop;
  const s = Math.min(Math.max(k, 0), 1.05);
  const arriba = `M -${sangrado},0 H ${n(A - rE)} A ${rE},${rE} 0 0 1 ${A},${rE}`;
  const abajo = `V ${n(H - rE)} A ${rE},${rE} 0 0 1 ${n(A - rE)},${H} H -${sangrado} Z`;

  if (s < 0.01) {
    return `${arriba} ${abajo}`;
  }

  const Xc = OLA.centroXDesktop;
  const R = (OLA.circulo / 2 + OLA.holgura) * s;
  const hombro = OLA.hombro * s;
  const dx = (A - Xc) * s;
  const xApex = A - (A - (Xc - R)) * s;
  const xArc = A - dx;

  const yArcTop = yc - R;
  const yArcBottom = yc + R;
  const y0 = yArcTop - hombro;
  const y1 = yArcBottom + hombro;

  const cp1X = A;
  const cp1Y = y0 + hombro * 0.55;
  const cp2X = xArc + dx * 0.45;
  const cp2Y = yArcTop;

  const cp3X = xArc + dx * 0.45;
  const cp3Y = yArcBottom;
  const cp4X = A;
  const cp4Y = y1 - hombro * 0.55;

  const rx = Math.max(1, xArc - xApex);
  const ry = Math.max(1, R);

  return [
    arriba,
    `V ${n(y0)}`,
    `C ${n(cp1X)},${n(cp1Y)} ${n(cp2X)},${n(cp2Y)} ${n(xArc)},${n(yArcTop)}`,
    `A ${n(rx)},${n(ry)} 0 0 0 ${n(xApex)},${n(yc)}`,
    `A ${n(rx)},${n(ry)} 0 0 0 ${n(xArc)},${n(yArcBottom)}`,
    `C ${n(cp3X)},${n(cp3Y)} ${n(cp4X)},${n(cp4Y)} ${A},${n(y1)}`,
    abajo,
  ].join(' ');
}

@Component({
  selector: 'app-navegacion-ola',
  standalone: true,
  imports: [RouterLink, NgIcon],
  viewProviders: [
    provideIcons({
      phosphorTrophyFill,
      phosphorDotsThree,
      phosphorX,
    }),
  ],
  templateUrl: './navegacion-ola.html',
  styleUrl: './navegacion-ola.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavegacionOla {
  private readonly router = inject(Router);
  private readonly gsapService = inject(GsapService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly intercambioService = inject(IntercambioService, { optional: true });
  private readonly sanitizer = inject(DomSanitizer);

  /** Fuente única de los 6 destinos de navegación. */
  readonly destinos = input<readonly DestinoNavegacionOla[]>(DESTINOS_NAVEGACION_OLA);

  /** Acción principal de Jugar. */
  readonly accionJugar = input<DestinoNavegacionOla>(ACCION_JUGAR_OLA);

  /** Modo vista previa para galería o pruebas. */
  readonly modoVistaPrevia = input<boolean>(false);

  /** Permite forzar la orientación para previsualización en la galería. */
  readonly vistaForzada = input<'mobile' | 'desktop' | null>(null);

  /** Ruta activa forzada manualmente (para galería y visualización de estados). */
  readonly rutaActivaManual = input<string | null>(null);

  /** Emite el destino seleccionado. */
  readonly seleccionarDestino = output<DestinoNavegacionOla>();

  readonly barraMobileRef = viewChild<ElementRef<HTMLElement>>('barraMobileElement');
  readonly barraDesktopRef = viewChild<ElementRef<HTMLElement>>('barraDesktopElement');
  readonly botonMasRef = viewChild<ElementRef<HTMLButtonElement>>('botonMasElement');
  readonly botonCerrarDialogoRef = viewChild<ElementRef<HTMLButtonElement>>('botonCerrarDialogo');
  readonly dialogoSheetRef = viewChild<ElementRef<HTMLElement>>('dialogoSheet');
  readonly colItemsMobileRef = viewChildren<ElementRef<HTMLElement>>('colItemMobile');

  protected readonly rutaActual = signal<string>(this.limpiarUrl(this.router.url));
  protected readonly idSeleccionadoManual = signal<string | null>(null);
  protected readonly panelMasAbierto = signal<boolean>(false);
  protected readonly barraMobileOculta = signal<boolean>(false);

  // ── Mobile ──
  protected readonly anchoBarraMobile = signal<number>(393);
  protected readonly posicionOlaMobileX = signal<number>(39.3);
  protected readonly olaMobileVisible = signal<boolean>(false);
  protected readonly paddingLateralMobile = OLA.paddingLateralMobile;
  protected readonly centroYMobile = OLA.centroYMobile;
  protected readonly geoMobile = computed(() =>
    geometriaMobile(this.anchoBarraMobile(), this.olaMobileVisible() ? this.posicionOlaMobileX() : null),
  );
  protected readonly rutaSvgMobile = computed(() => this.geoMobile().trazo);

  // ── Desktop (geometría fija: no se mide nada del DOM) ──
  protected readonly anchoDesktop = OLA.anchoDesktop;
  protected readonly sangradoDesktop = OLA.sangradoIzquierdoDesktop;
  protected readonly pasoDesktop = OLA.pasoDesktop;
  protected readonly margenDesktop = OLA.margenDesktop;
  protected readonly circuloDesktop = OLA.circulo;
  protected readonly altoDesktop = computed(
    () => this.destinosMapeados().length * OLA.pasoDesktop + 2 * OLA.margenDesktop,
  );
  protected readonly posicionOlaDesktopY = signal(OLA.margenDesktop + OLA.pasoDesktop / 2);
  protected readonly aparicionDesktop = signal(0);            // 0 = sin ola, 1 = ola completa
  protected readonly destinoOlaDesktop = signal<DestinoNavegacionOla | null>(null);
  private readonly proxyDesktop = { y: OLA.margenDesktop + OLA.pasoDesktop / 2, k: 0 };

  protected readonly rutaSvgDesktop = computed(() =>
    trazoDesktop(OLA.anchoDesktop, this.altoDesktop(), this.posicionOlaDesktopY(), this.aparicionDesktop()),
  );
  protected readonly transformCirculoDesktop = computed(
    () =>
      `translate3d(${OLA.centroXDesktop - OLA.circulo / 2}px, ${this.posicionOlaDesktopY() - OLA.circulo / 2}px, 0) scale(${this.aparicionDesktop()})`,
  );

  protected readonly hoverDesktopIndex = signal<number | null>(null);

  private proxyMobile = { x: 39.3 };
  private ultimoScrollY = 0;
  private animacionEntradaDesktopEjecutada = false;

  protected readonly rutaEfectiva = computed(() => {
    const manual = this.rutaActivaManual();
    return manual !== null ? this.limpiarUrl(manual) : this.rutaActual();
  });

  /** URL sanitizada para el ícono de Jugar. */
  protected readonly urlIconoJugar = computed<SafeUrl | string>(() => {
    const url = this.accionJugar().urlIcono;
    if (!url) return '';
    if (url.startsWith('<svg') || url.startsWith('data:image/svg+xml')) {
      const dataUri = url.startsWith('data:')
        ? url
        : `data:image/svg+xml;utf8,${encodeURIComponent(url)}`;
      return this.sanitizer.bypassSecurityTrustUrl(dataUri);
    }
    return url;
  });

  /** Destinos con novedad integrada. */
  protected readonly destinosMapeados = computed<readonly DestinoNavegacionOla[]>(() => {
    const tieneNovedad = this.intercambioService?.tieneNovedadDashboardSignal?.() ?? false;
    return this.destinos().map((d) =>
      d.id === 'intercambios' ? { ...d, tieneIndicador: tieneNovedad } : d,
    );
  });

  /**
   * Tres destinos visibles en mobile:
   * Col 0: Cartas, Col 1: Misiones, Col 3: Álbumes (Col 2 es Jugar y Col 4 es Más).
   */
  protected readonly destinosMobile = computed<readonly DestinoNavegacionOla[]>(() => {
    const list = this.destinosMapeados();
    return [list[0], list[1], list[2]];
  });

  /** Destinos secundarios que se muestran dentro del panel 'Más'. */
  protected readonly destinosSecundarios = computed<readonly DestinoNavegacionOla[]>(() => {
    const list = this.destinosMapeados();
    return [list[3], list[4], list[5]];
  });

  /** Destino activo en mobile según ruta o selección manual (null si es Jugar o home). */
  readonly destinoActivoMobile = computed<DestinoNavegacionOla | null>(() => {
    const idManual = this.idSeleccionadoManual();
    const vis = this.destinosMobile();

    if (idManual) {
      if (idManual === 'jugar' || idManual === 'mas') return null;
      const m = vis.find((d) => d.id === idManual);
      if (m) return m;
    }

    // Si la ruta activa es Jugar, la ola NO se dibuja (borde recto)
    if (this.esRutaActiva(this.accionJugar())) {
      return null;
    }

    const mRuta = vis.find((d) => this.esRutaActiva(d));
    return mRuta ?? null;
  });

  /** Índice de columna activa en mobile: 0: Cartas, 1: Misiones, 3: Álbumes, o null. */
  readonly columnaActivaMobile = computed<number | null>(() => {
    const activo = this.destinoActivoMobile();
    if (!activo) return null;
    if (activo.id === 'cartas') return 0;
    if (activo.id === 'misiones') return 1;
    if (activo.id === 'albumes') return 3;
    return null;
  });

  /** Índice activo en desktop por ruta (0 a 5, o null si en Jugar/Home). */
  readonly indiceRutaDesktop = computed<number | null>(() => {
    if (this.esRutaActiva(this.accionJugar())) return null;
    const list = this.destinosMapeados();
    const idx = list.findIndex((d) => this.esRutaActiva(d));
    return idx >= 0 ? idx : null;
  });

  /** Índice efectivo en desktop (prioriza hover sobre la ruta activa). */
  readonly indiceEfectivoDesktop = computed<number | null>(() => {
    const h = this.hoverDesktopIndex();
    if (h !== null) return h;
    return this.indiceRutaDesktop();
  });

  /** Visibilidad general del componente según rol/ruta permitida. */
  readonly esVisible = computed(() => {
    if (this.modoVistaPrevia()) return true;
    return this.esRutaJugadorPermitida(this.rutaEfectiva());
  });

  constructor() {
    const sub = this.router.events
      .pipe(filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd))
      .subscribe((ev) => {
        const limpia = this.limpiarUrl(ev.urlAfterRedirects || ev.url);
        this.rutaActual.set(limpia);
        this.idSeleccionadoManual.set(null);
        this.panelMasAbierto.set(false);
        this.barraMobileOculta.set(false);
      });

    this.destroyRef.onDestroy(() => sub.unsubscribe());

    // Sincronización continua de la Ola en Mobile
    effect(() => {
      const col = this.columnaActivaMobile();
      const barraEl = this.barraMobileRef()?.nativeElement;

      if (barraEl) {
        const w = barraEl.getBoundingClientRect().width;
        if (w > 0 && w !== this.anchoBarraMobile()) {
          this.anchoBarraMobile.set(w);
        }
      }

      if (col === null) {
        this.olaMobileVisible.set(false);
        return;
      }

      const W = this.anchoBarraMobile();
      const util = W - 2 * OLA.paddingLateralMobile;
      const targetX = OLA.paddingLateralMobile + (col + 0.5) * (util / 5);

      this.olaMobileVisible.set(true);
      this.animarOlaMobile(targetX);
    });

    // Sincronización continua de la Ola en Desktop
    effect(() => {
      const idx = this.indiceEfectivoDesktop();
      untracked(() => this.moverOlaDesktop(idx));
    });

    // Control de scroll y resize en el navegador
    if (this.esNavegador) {
      const alHacerScroll = () => {
        if (!this.esRutaLecturaLarga()) {
          if (this.barraMobileOculta()) this.barraMobileOculta.set(false);
          return;
        }

        const actualY = window.scrollY || document.documentElement.scrollTop;
        const delta = actualY - this.ultimoScrollY;

        if (delta > 10 && actualY > 60) {
          if (!this.barraMobileOculta()) this.barraMobileOculta.set(true);
        } else if (delta < -8) {
          if (this.barraMobileOculta()) this.barraMobileOculta.set(false);
        }

        this.ultimoScrollY = actualY;
      };

      const alRedimensionar = () => {
        const bM = this.barraMobileRef()?.nativeElement;
        if (bM) {
          const w = bM.getBoundingClientRect().width;
          if (w > 0) this.anchoBarraMobile.set(w);
        }
      };

      window.addEventListener('scroll', alHacerScroll, { passive: true });
      window.addEventListener('resize', alRedimensionar, { passive: true });

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('scroll', alHacerScroll);
        window.removeEventListener('resize', alRedimensionar);
      });
    }

    // Animación de entrada inicial para la barra desktop (desde la izquierda)
    effect(() => {
      if (!this.esNavegador || this.animacionEntradaDesktopEjecutada) return;
      const bD = this.barraDesktopRef()?.nativeElement;
      if (bD) {
        this.animacionEntradaDesktopEjecutada = true;
        if (!this.gsapService.movimientoReducido()) {
          this.gsapService.gsap.from(bD, {
            x: -80,
            opacity: 0,
            duration: 0.45,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          });
        }
      }
    });
  }

  private centroYDesktop(i: number): number {
    return OLA.margenDesktop + (i + 0.5) * OLA.pasoDesktop;
  }

  private moverOlaDesktop(idx: number | null): void {
    const { gsap } = this.gsapService;
    const p = this.proxyDesktop;
    const sincronizar = (): void => {
      this.posicionOlaDesktopY.set(p.y);
      this.aparicionDesktop.set(p.k);
    };

    if (idx === null) {
      if (this.gsapService.movimientoReducido()) {
        p.k = 0;
        sincronizar();
        return;
      }
      gsap.to(p, { k: 0, duration: 0.22, ease: 'power2.in', overwrite: 'auto', onUpdate: sincronizar });
      return;
    }

    this.destinoOlaDesktop.set(this.destinosMapeados()[idx] ?? null);
    const y = this.centroYDesktop(idx);

    if (this.gsapService.movimientoReducido()) {
      p.y = y;
      p.k = 1;
      sincronizar();
      return;
    }

    // Si la ola no estaba, aparece en el lugar y "se mete"; si ya estaba, viaja al nuevo ítem.
    if (p.k < 0.05) {
      p.y = y;
    }
    gsap.to(p, { y, duration: 0.38, ease: 'power3.out', overwrite: 'auto', onUpdate: sincronizar });
    gsap.to(p, { k: 1, duration: 0.42, ease: 'back.out(1.5)', overwrite: 'auto', onUpdate: sincronizar });
  }

  protected esRutaActiva(item: DestinoNavegacionOla): boolean {
    const ruta = this.rutaEfectiva();
    if (item.ruta && this.coincideRuta(ruta, item.ruta)) {
      return true;
    }
    if (item.rutasCoincidentes) {
      return item.rutasCoincidentes.some((r) => this.coincideRuta(ruta, r));
    }
    return false;
  }

  protected esRutaLecturaLarga(): boolean {
    const r = this.rutaEfectiva();
    return (
      r === '/usuario/mis-cartas' ||
      r.startsWith('/usuario/mis-cartas') ||
      r === '/usuario/albumes' ||
      r.startsWith('/usuario/albumes')
    );
  }

  protected alClickCirculoDesktop(event?: Event): void {
    const d = this.destinoOlaDesktop();
    if (!d || d.deshabilitado) return;
    this.alSeleccionar(d, event);
    if (d.ruta) {
      void this.router.navigateByUrl(d.ruta);
    }
  }

  protected alSeleccionar(item: DestinoNavegacionOla, event?: Event): void {
    if (item.deshabilitado) {
      event?.preventDefault();
      return;
    }
    this.idSeleccionadoManual.set(item.id);
    this.seleccionarDestino.emit(item);
  }

  protected alPasarMouseDesktop(index: number): void {
    this.hoverDesktopIndex.set(index);
  }

  protected alSalirMouseDesktop(): void {
    this.hoverDesktopIndex.set(null);
  }

  protected abrirPanelMas(): void {
    this.panelMasAbierto.set(true);
    setTimeout(() => {
      this.botonCerrarDialogoRef()?.nativeElement?.focus();
    }, 50);
  }

  protected cerrarPanelMas(): void {
    this.panelMasAbierto.set(false);
    this.botonMasRef()?.nativeElement?.focus();
  }

  protected seleccionarDesdePanel(item: DestinoNavegacionOla): void {
    if (item.deshabilitado) return;
    this.alSeleccionar(item);
    this.cerrarPanelMas();
  }

  protected manejarTecladoDialogo(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cerrarPanelMas();
      return;
    }

    if (event.key === 'Tab') {
      const dialogEl = this.dialogoSheetRef()?.nativeElement;
      if (!dialogEl) return;
      const focusables = dialogEl.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const primerElemento = focusables[0];
      const ultimoElemento = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === primerElemento) {
        event.preventDefault();
        ultimoElemento.focus();
      } else if (!event.shiftKey && document.activeElement === ultimoElemento) {
        event.preventDefault();
        primerElemento.focus();
      }
    }
  }

  protected restaurarBarraMobile(): void {
    this.barraMobileOculta.set(false);
  }

  private animarOlaMobile(targetX: number): void {
    if (this.gsapService.movimientoReducido()) {
      this.proxyMobile.x = targetX;
      this.posicionOlaMobileX.set(targetX);
      return;
    }

    this.gsapService.gsap.to(this.proxyMobile, {
      x: targetX,
      duration: 0.36,
      ease: 'power2.out',
      overwrite: 'auto',
      onUpdate: () => {
        this.posicionOlaMobileX.set(this.proxyMobile.x);
      },
    });
  }

  protected urlMascara(url: string | undefined): string {
    if (!url) return 'none';
    if (url.startsWith('<svg')) {
      return `url("data:image/svg+xml;utf8,${encodeURIComponent(url)}")`;
    }
    return `url("${url}")`;
  }

  esRutaJugadorPermitida(url: string): boolean {
    return tieneNavUsuario(url);
  }

  private coincideRuta(actual: string, candidata: string): boolean {
    if (actual === candidata) return true;
    return actual.startsWith(`${candidata}/`);
  }

  private limpiarUrl(url: string): string {
    return limpiarUrlNavegacion(url);
  }
}
