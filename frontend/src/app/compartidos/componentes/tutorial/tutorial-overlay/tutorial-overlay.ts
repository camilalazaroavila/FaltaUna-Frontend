import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Jaime } from '@compartidos/componentes/tutorial/jaime/jaime';
import type { MiradaJaime, PoseJaime } from '@compartidos/componentes/tutorial/jaime/jaime';
import { PASO_VISTA_PREVIA } from '@compartidos/componentes/tutorial/tutorial.pasos';
import { TutorialServicio } from '@compartidos/componentes/tutorial/tutorial.servicio';
import { SonidoService, SONIDOS_PARTIDA } from '@servicios/sonido.service';

interface Rectangulo {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

interface PosicionGlobo {
  readonly top: number;
  readonly left: number;
  readonly width: number;
}

const MARGEN = 12;
const SEPARACION = 14;
const ANCHO_MAXIMO_GLOBO = 380;
const ALTO_ESTIMADO_GLOBO = 280;
const MS_PISTA = 8000;

const limitar = (valor: number, minimo: number, maximo: number): number =>
  Math.min(Math.max(valor, minimo), Math.max(minimo, maximo));

/**
 * Overlay del tutorial guiado.
 *
 * Resalta el elemento marcado con `data-tutorial` y muestra un globo con el
 * paso actual. No bloquea el tablero: el velo y el spotlight no capturan
 * punteros, así el jugador puede arrastrar cartas y cerrar la ronda mientras
 * el tutorial está abierto.
 *
 * Soporta anclas dinámicas (`anclaAlIniciarAccion`) que mueven el foco
 * cuando la acción empieza (por ejemplo, al abrir el detalle de la carta).
 */
@Component({
  selector: 'app-tutorial-overlay',
  templateUrl: './tutorial-overlay.html',
  styleUrl: './tutorial-overlay.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Boton, Jaime],
})
export class TutorialOverlay {
  private readonly servicio = inject(TutorialServicio);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sonidos = inject(SonidoService, { optional: true });
  private readonly globo = viewChild<ElementRef<HTMLElement>>('globo');

  /** Muestra el overlay estático dentro de un contenedor (galería). */
  readonly vistaPrevia = input(false);
  readonly salir = output<void>();
  readonly terminar = output<void>();
  readonly seguir = output<void>();

  protected readonly mira = signal<MiradaJaime>('derecha');
  /** Sin elemento resaltado: presentación, cierre o ancla no encontrada. */
  protected readonly centrado = computed(() => !this.rect());
  protected readonly poseJaime = computed<PoseJaime>(() => {
    const paso = this.paso();

    // Al cumplir la acción pedida, Jaime festeja.
    if (paso.espera && this.esperaCumplida()) {
      return 'si';
    }

    return paso.pose ?? 'senalando';
  });

  protected readonly activo = computed(() => this.vistaPrevia() || this.servicio.activo());
  protected readonly paso = computed(() =>
    this.vistaPrevia() ? PASO_VISTA_PREVIA : this.servicio.paso(),
  );
  protected readonly indice = computed(() => (this.vistaPrevia() ? 0 : this.servicio.indice()));
  protected readonly total = computed(() => (this.vistaPrevia() ? 1 : this.servicio.total));
  protected readonly esUltimo = computed(() => !this.vistaPrevia() && this.servicio.esUltimo());
  protected readonly esperaCumplida = computed(
    () => this.vistaPrevia() || this.servicio.esperaCumplida(),
  );

  /** Determina el ancla actual considerando si la acción del paso ya inició. */
  protected readonly anclaActual = computed<string | undefined>(() => {
    if (this.vistaPrevia()) {
      return this.paso().ancla;
    }
    const paso = this.paso();
    if (this.servicio.accionIniciada() && paso.anclaAlIniciarAccion) {
      return paso.anclaAlIniciarAccion;
    }
    return paso.ancla;
  });

  /** Texto del globo, conmutable al iniciar la acción del paso. */
  protected readonly textoActual = computed<string>(() => {
    if (this.vistaPrevia()) {
      return this.paso().texto;
    }
    const paso = this.paso();
    if (this.servicio.accionIniciada() && paso.textoAlIniciarAccion) {
      return paso.textoAlIniciarAccion;
    }
    return paso.texto;
  });

  protected readonly rect = signal<Rectangulo | null>(null);
  protected readonly posicion = signal<PosicionGlobo>({ top: MARGEN, left: MARGEN, width: 320 });
  protected readonly pistaVisible = signal(false);
  protected readonly confirmandoSalida = signal(false);

  private readonly alRedimensionar = () => this.medir();
  private readonly alDesplazar = () => this.medir();

  constructor() {
    effect((onCleanup) => {
      this.servicio.indice();
      this.activo();
      this.pistaVisible.set(false);

      if (!this.activo() || this.vistaPrevia()) {
        return;
      }

      const temporizador = setTimeout(() => this.pistaVisible.set(true), MS_PISTA);
      onCleanup(() => clearTimeout(temporizador));
    });

    effect(() => {
      const activo = this.activo();
      const ancla = this.anclaActual();
      const paso = this.servicio.paso();
      void ancla;

      if (!activo || this.vistaPrevia()) {
        return;
      }

      queueMicrotask(() => this.medir());

      // En los pasos sin acción se lleva el foco al globo para que el lector
      // de pantalla anuncie el texto. En los pasos de acción se deja el foco
      // en el tablero para no interrumpir el arrastre.
      if (!paso.espera) {
        queueMicrotask(() => this.globo()?.nativeElement.focus());
      }
    });

    effect(() => {
      this.servicio.indice();

      if (!this.activo() || this.vistaPrevia()) {
        return;
      }

      untracked(() => this.sonar('pop'));
    });

    effect(() => {
      if (!this.vistaPrevia() && this.paso().espera && this.esperaCumplida()) {
        untracked(() => this.sonar('ping'));
      }
    });

    afterNextRender(() => {
      if (typeof window === 'undefined') {
        return;
      }

      window.addEventListener('resize', this.alRedimensionar);
      window.addEventListener('scroll', this.alDesplazar, true);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', this.alRedimensionar);
        window.removeEventListener('scroll', this.alDesplazar, true);
      });
      this.medir();
    });
  }

  @HostListener('document:keydown.escape')
  alPresionarEscape(): void {
    if (!this.activo() || this.vistaPrevia()) {
      return;
    }

    if (this.confirmandoSalida()) {
      this.cancelarSalida();
      return;
    }

    this.pedirSalida();
  }

  protected siguiente(): void {
    this.servicio.siguiente();
    if (this.servicio.completado()) {
      this.terminar.emit();
    }
  }

  protected seguirJugando(): void {
    this.servicio.completar();
    this.servicio.salir();
    this.seguir.emit();
  }

  protected atras(): void {
    this.servicio.atras();
  }

  protected pedirSalida(): void {
    this.confirmandoSalida.set(true);
  }

  protected cancelarSalida(): void {
    this.confirmandoSalida.set(false);
  }

  protected confirmarSalida(): void {
    this.confirmandoSalida.set(false);
    this.servicio.salir();
    this.salir.emit();
  }

  private sonar(tipo: 'pop' | 'ping'): void {
    if (!this.sonidos || this.vistaPrevia()) {
      return;
    }
    if (tipo === 'pop') {
      this.sonidos.reproducir(SONIDOS_PARTIDA.boton, 0.25);
    } else {
      this.sonidos.reproducir(SONIDOS_PARTIDA.estrellitas, 0.35);
    }
  }

  private medir(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (this.vistaPrevia()) {
      this.rect.set(null);
      this.mira.set('derecha');
      this.centrarGlobo();
      return;
    }

    const ancla = this.anclaActual();

    if (!ancla) {
      this.rect.set(null);
      this.mira.set('derecha');
      this.centrarGlobo();
      return;
    }

    const objetivo = document.querySelector<HTMLElement>(`[data-tutorial="${ancla}"]`);

    if (!objetivo) {
      this.rect.set(null);
      this.mira.set('derecha');
      this.centrarGlobo();
      return;
    }

    const caja = objetivo.getBoundingClientRect();

    this.rect.set({
      top: caja.top - 6,
      left: caja.left - 6,
      width: caja.width + 12,
      height: caja.height + 12,
    });
    this.posicionarGlobo(caja);
    this.mirarHacia(caja);
  }

  /** Jaime mira hacia el lado donde está el elemento resaltado. */
  private mirarHacia(caja: DOMRect): void {
    const globo = this.posicion();
    const centroGlobo = globo.left + globo.width / 2;
    const centroObjetivo = caja.left + caja.width / 2;

    this.mira.set(centroObjetivo < centroGlobo ? 'izquierda' : 'derecha');
  }

  /**
   * Posiciona el globo evitando tapar el elemento resaltado:
   * 1. Prueba abajo.
   * 2. Si no entra, prueba arriba.
   * 3. Si no entra, prueba al costado (derecha, luego izquierda).
   * 4. Fallback: lado vertical con mayor espacio disponible.
   */
  private posicionarGlobo(caja: DOMRect): void {
    const anchoVista = window.innerWidth;
    const altoVista = window.innerHeight;
    const ancho = Math.min(ANCHO_MAXIMO_GLOBO, anchoVista - MARGEN * 2);
    const altoReal = this.globo()?.nativeElement.offsetHeight || ALTO_ESTIMADO_GLOBO;
    const alto = Math.min(altoReal, altoVista - MARGEN * 2);

    // 1. Probar abajo del elemento
    const cabeAbajo = caja.bottom + SEPARACION + alto <= altoVista - MARGEN;
    if (cabeAbajo) {
      const left = limitar(
        caja.left + caja.width / 2 - ancho / 2,
        MARGEN,
        anchoVista - ancho - MARGEN,
      );
      this.posicion.set({ top: caja.bottom + SEPARACION, left, width: ancho });
      return;
    }

    // 2. Probar arriba del elemento
    const cabeArriba = caja.top - SEPARACION - alto >= MARGEN;
    if (cabeArriba) {
      const left = limitar(
        caja.left + caja.width / 2 - ancho / 2,
        MARGEN,
        anchoVista - ancho - MARGEN,
      );
      this.posicion.set({ top: caja.top - SEPARACION - alto, left, width: ancho });
      return;
    }

    // 3. Probar al costado (derecha primero, luego izquierda)
    const cabeDerecha = caja.right + SEPARACION + ancho <= anchoVista - MARGEN;
    if (cabeDerecha) {
      const top = limitar(
        caja.top + caja.height / 2 - alto / 2,
        MARGEN,
        altoVista - alto - MARGEN,
      );
      this.posicion.set({ top, left: caja.right + SEPARACION, width: ancho });
      return;
    }

    const cabeIzquierda = caja.left - SEPARACION - ancho >= MARGEN;
    if (cabeIzquierda) {
      const top = limitar(
        caja.top + caja.height / 2 - alto / 2,
        MARGEN,
        altoVista - alto - MARGEN,
      );
      this.posicion.set({ top, left: caja.left - SEPARACION - ancho, width: ancho });
      return;
    }

    // 4. Fallback: lado vertical con más espacio disponible
    const espacioAbajo = altoVista - caja.bottom;
    const espacioArriba = caja.top;
    const top =
      espacioAbajo >= espacioArriba
        ? limitar(caja.bottom + SEPARACION, MARGEN, altoVista - alto - MARGEN)
        : limitar(caja.top - SEPARACION - alto, MARGEN, altoVista - alto - MARGEN);
    const left = limitar(
      caja.left + caja.width / 2 - ancho / 2,
      MARGEN,
      anchoVista - ancho - MARGEN,
    );

    this.posicion.set({ top, left, width: ancho });
  }

  private centrarGlobo(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const ancho = Math.min(ANCHO_MAXIMO_GLOBO, window.innerWidth - MARGEN * 2);
    const alto = Math.min(ALTO_ESTIMADO_GLOBO, window.innerHeight - MARGEN * 2);

    this.posicion.set({
      top: Math.max(MARGEN, (window.innerHeight - alto) / 2),
      left: Math.max(MARGEN, (window.innerWidth - ancho) / 2),
      width: ancho,
    });
  }
}
