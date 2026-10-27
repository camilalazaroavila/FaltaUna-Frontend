import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { CartaPopupComponent } from '@compartidos/componentes/cartas/carta-popup/carta-popup';
import { BarraPuntos } from '@compartidos/componentes/partida/barra-puntos/barra-puntos';
import { ControlTurno } from '@compartidos/componentes/partida/control-turno/control-turno';
import { CuponRecurso } from '@compartidos/componentes/partida/cupon-recurso/cupon-recurso';
import { JugadorChip } from '@compartidos/componentes/partida/jugador-chip/jugador-chip';
import { Mano } from '@compartidos/componentes/partida/mano/mano';
import type { PosicionArrastre } from '@compartidos/componentes/partida/mano/mano';
import { Zona } from '@compartidos/componentes/partida/zona/zona';
import { ZonaPopupComponent } from '@compartidos/componentes/partida/zona-popup/zona-popup';
import type { Carta } from '@modelos/carta.model';
import type { NombreLugar, ResultadoRonda } from '@modelos/partida.model';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import { GsapService } from '@servicios/gsap.service';
import { SONIDOS_PARTIDA, SonidoService } from '@servicios/sonido.service';
import type {
  ContextoCartasLugar,
  PasoBurbuja,
  PasoSecuenciaConteo,
} from '@compartidos/componentes/partida/conteo-ronda/secuencia-conteo-ronda';
import {
  ESCALONADO_BURBUJAS_MS,
  PAUSA_ENTRE_ZONAS_MS,
  construirColaPasos,
} from '@compartidos/componentes/partida/conteo-ronda/secuencia-conteo-ronda';

/** Grados del extremo del abanico que forman los reversos de la mano rival. */
const ABANICO_RIVAL_GRADOS = 12;

/** Datos del slot que se está sobrevolando durante el arrastre. */
interface SlotSobrevolado {
  readonly lugar: NombreLugar;
  readonly indice: number;
  readonly elemento: HTMLElement;
}

/**
 * Pantalla de partida. Vos abajo a la izquierda, el rival arriba a la derecha,
 * el control de turno abajo a la derecha, las 2 zonas al centro y tu mano abajo
 * al centro.
 *
 * Los datos salen de `PartidaServicio`, que funciona en modo mock (galería) o
 * contra el backend (partida contra el bot).
 *
 * El arrastre de cartas lo orquesta este componente: la mano emite el inicio,
 * el movimiento y el fin; acá se resuelve el slot bajo el puntero y se juega la
 * carta con `jugarCarta()`, la misma vía que el botón de cada slot.
 */
@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.html',
  styleUrl: './tablero.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Zona,
    ZonaPopupComponent,
    CartaPopupComponent,
    JugadorChip,
    BarraPuntos,
    CuponRecurso,
    ControlTurno,
    Mano,
  ],
})
export class Tablero implements OnDestroy {
  protected readonly servicio = inject(PartidaServicio);
  private readonly gsapServicio = inject(GsapService);
  private readonly sonido = inject(SonidoService);
  private readonly mano = viewChild(Mano);
  /**
   * Host del tablero: referencia de coordenadas de la mano. El containing block
   * del fantasma `fixed` es el div `.tablero` (`contain: layout`), que comparte
   * origen con este host.
   */
  protected readonly host: HTMLElement = inject(ElementRef<HTMLElement>).nativeElement;

  /** `true` cuando el drag de la galería fuerza el resaltado (demo). */
  readonly cartaAgarrada = input(false);
  readonly abandonar = output<void>();
  readonly rendirse = output<void>();
  /** Emite true cuando arranca el conteo secuencial y false al terminar o saltar. */
  readonly conteoCambio = output<boolean>();

  protected readonly lugares: readonly NombreLugar[] = ['izquierda', 'derecha'];
  protected readonly lugarAbierto = signal<NombreLugar | null>(null);
  protected readonly cartaAbierta = signal<Carta | null>(null);

  /** Burbuja de puntaje activa en este instante del conteo. */
  readonly burbujaActiva = signal<PasoBurbuja | null>(null);
  /** Indica si la secuencia de conteo lento de ronda se encuentra en ejecución. */
  readonly enConteo = signal<boolean>(false);

  private temporizadoresConteo: ReturnType<typeof setTimeout>[] = [];
  private colaPasos: PasoSecuenciaConteo[] = [];
  private indicePaso = 0;
  private ultimoResultadoAnimado = -1;

  /** Carta que el usuario está arrastrando ahora mismo. */
  private readonly cartaEnArrastre = signal<Carta | null>(null);
  /** Carta enfocada con teclado: alternativa accesible al arrastre. */
  private readonly cartaSeleccionada = signal<Carta | null>(null);

  constructor() {
    this.sonido.precargarSonidosPartida();

    effect(() => {
      const resultado = this.servicio.resultadoRonda();
      if (resultado && resultado.numero !== this.ultimoResultadoAnimado) {
        this.ultimoResultadoAnimado = resultado.numero;
        untracked(() => {
          this.iniciarConteoSecuencial(resultado);
        });
      }
    });
  }

  @HostListener('keydown.escape', ['$event'])
  alPresionarEscape(evento: Event): void {
    if (this.enConteo()) {
      evento.preventDefault();
      this.saltarConteo();
    }
  }

  /**
   * Inicia el conteo secuencial lento de la ronda: burbuja por carta (propias y rivales),
   * revelación de totales por zona y avance final de la barra general de puntos.
   */
  iniciarConteoSecuencial(resultado: ResultadoRonda): void {
    this.limpiarTemporizadores();
    this.enConteo.set(true);
    this.conteoCambio.emit(true);
    this.sonido.reproducir(SONIDOS_PARTIDA.darVueltaCartas);

    const lugaresMap: Record<NombreLugar, ContextoCartasLugar> = {
      izquierda: {
        propio: this.servicio.lugares().izquierda.propio,
        rival: this.servicio.lugares().izquierda.rival,
      },
      derecha: {
        propio: this.servicio.lugares().derecha.propio,
        rival: this.servicio.lugares().derecha.rival,
      },
    };

    this.colaPasos = [...construirColaPasos(this.lugares, lugaresMap, resultado)];
    this.indicePaso = 0;

    if (this.gsapServicio.movimientoReducido()) {
      // Con movimiento reducido: números quietos un breve instante y resolución directa
      const primerPaso = this.colaPasos.find((p) => p.tipo === 'burbuja');
      if (primerPaso && primerPaso.tipo === 'burbuja') {
        this.burbujaActiva.set(primerPaso);
      }
      const t = setTimeout(() => {
        this.saltarConteo();
      }, 750);
      this.temporizadoresConteo.push(t);
      return;
    }

    const ejecutarSiguientePaso = () => {
      if (!this.enConteo()) {
        return;
      }

      if (this.indicePaso >= this.colaPasos.length) {
        this.finalizarConteo();
        return;
      }

      const paso = this.colaPasos[this.indicePaso++];
      if (paso.tipo === 'burbuja') {
        this.burbujaActiva.set(paso);
        this.sonido.reproducir(SONIDOS_PARTIDA.cartaSumaPoder);
        const t = setTimeout(() => {
          ejecutarSiguientePaso();
        }, ESCALONADO_BURBUJAS_MS);
        this.temporizadoresConteo.push(t);
      } else if (paso.tipo === 'zona') {
        this.burbujaActiva.set(null);
        this.sonido.reproducir(SONIDOS_PARTIDA.sumarPuntosAnimacion);
        const t = setTimeout(() => {
          ejecutarSiguientePaso();
        }, PAUSA_ENTRE_ZONAS_MS);
        this.temporizadoresConteo.push(t);
      } else if (paso.tipo === 'barra') {
        this.burbujaActiva.set(null);
        this.sonido.reproducir(SONIDOS_PARTIDA.sumarPuntos);
        const t = setTimeout(() => {
          this.finalizarConteo();
        }, PAUSA_ENTRE_ZONAS_MS);
        this.temporizadoresConteo.push(t);
      }
    };

    ejecutarSiguientePaso();
  }

  /**
   * Salta inmediatamente la secuencia de conteo y libera el bloqueo de acciones.
   * Idempotente frente a doble clic.
   */
  saltarConteo(): void {
    if (!this.enConteo()) {
      return;
    }
    this.finalizarConteo();
  }

  /** Cancela limpiamente el conteo en curso (rendición, recarga o abandono). */
  cancelarConteo(): void {
    this.limpiarTemporizadores();
    this.burbujaActiva.set(null);
    this.enConteo.set(false);
    this.conteoCambio.emit(false);
  }

  private finalizarConteo(): void {
    this.limpiarTemporizadores();
    this.burbujaActiva.set(null);
    this.enConteo.set(false);
    this.conteoCambio.emit(false);
  }

  private limpiarTemporizadores(): void {
    for (const t of this.temporizadoresConteo) {
      clearTimeout(t);
    }
    this.temporizadoresConteo = [];
  }

  ngOnDestroy(): void {
    this.cancelarConteo();
  }

  /**
   * Resalta los slots disponibles cuando hay una carta en juego: por el drag
   * real, por la selección con teclado o por el flag de la galería.
   */
  protected readonly resaltarSlots = computed(
    () => !this.enConteo() && (this.cartaEnArrastre() !== null || this.cartaSeleccionada() !== null || this.cartaAgarrada()),
  );

  protected readonly zonaAbierta = computed(() => {
    const lugar = this.lugarAbierto();

    return lugar ? this.servicio.lugares()[lugar].zona : null;
  });

  /** Reversos de la mano rival, cada uno con su ángulo de abanico (-12°..12°). */
  protected readonly reversosRival = computed(() => {
    const total = this.servicio.cartasManoRival();
    const paso = total > 1 ? (2 * ABANICO_RIVAL_GRADOS) / (total - 1) : 0;

    return Array.from({ length: total }, (_, i) => ({
      indice: i,
      angulo: `${total > 1 ? i * paso - ABANICO_RIVAL_GRADOS : 0}deg`,
    }));
  });

  protected alIniciarArrastre(carta: Carta): void {
    if (this.enConteo()) {
      return;
    }
    this.cartaEnArrastre.set(carta);
  }

  protected alSeleccionar(carta: Carta | null): void {
    if (this.enConteo()) {
      return;
    }
    this.cartaSeleccionada.set(carta);
  }

  protected alTerminarArrastre(posicion: PosicionArrastre): void {
    if (this.enConteo()) {
      this.mano()?.cancelarArrastre();
      return;
    }

    const carta = this.cartaEnArrastre();
    this.cartaEnArrastre.set(null);

    if (!carta) {
      this.mano()?.cancelarArrastre();
      return;
    }

    const slot = this.slotEnPosicion(posicion);

    if (slot && this.servicio.jugarCarta(carta, slot.lugar, slot.indice)) {
      this.mano()?.volarHacia(slot.elemento.getBoundingClientRect());
      this.sonido.reproducir(SONIDOS_PARTIDA.apoyarCarta);
      return;
    }

    this.mano()?.cancelarArrastre();
    this.servicio.anunciar(`No se puede jugar ${carta.nombre} ahí. La carta vuelve a tu mano.`);
  }

  protected readonly esProvisionalFn = (carta: Carta): boolean =>
    this.servicio.esCartaProvisional(carta);

  protected alRetirarCarta(carta: Carta): void {
    if (this.enConteo()) {
      return;
    }
    this.servicio.retirarCarta(carta);
    if (this.cartaAbierta()?.id === carta.id) {
      this.cartaAbierta.set(null);
    }
  }

  /** Jugar con el botón de un slot disponible (alternativa accesible al drag). */
  protected alJugarEnSlot(lugar: NombreLugar, indice: number): void {
    if (this.enConteo()) {
      return;
    }
    const carta = this.cartaEnArrastre() ?? this.cartaSeleccionada();

    if (carta && this.servicio.jugarCarta(carta, lugar, indice)) {
      this.cartaSeleccionada.set(null);
      this.sonido.reproducir(SONIDOS_PARTIDA.apoyarCarta);
    }
  }

  /**
   * Devuelve el slot propio vacío que está bajo el puntero, o `null` si no hay
   * ninguno o está ocupado.
   */
  private slotEnPosicion(posicion: PosicionArrastre): SlotSobrevolado | null {
    if (typeof document !== 'undefined' && typeof document.elementsFromPoint === 'function') {
      const elementos = document.elementsFromPoint(posicion.x, posicion.y);
      for (const el of elementos) {
        const slot = el.closest<HTMLElement>('[data-slot-lado="propio"]');
        if (!slot) continue;

        const estado = slot.getAttribute('data-slot-estado');
        if (estado === 'ocupado') {
          return null;
        }

        const contenedor = slot.closest<HTMLElement>('[data-lugar][data-indice]');
        const lugar = contenedor?.dataset['lugar'];
        const indice = Number(contenedor?.dataset['indice']);

        if ((lugar === 'izquierda' || lugar === 'derecha') && Number.isInteger(indice)) {
          return { lugar, indice, elemento: slot };
        }
      }
      return null;
    }

    const elemento = typeof document !== 'undefined' ? document.elementFromPoint(posicion.x, posicion.y) : null;
    const slot = elemento?.closest<HTMLElement>('[data-slot-lado="propio"]');

    if (!slot) {
      return null;
    }

    const estado = slot.getAttribute('data-slot-estado');
    if (estado === 'ocupado') {
      return null;
    }

    const contenedor = slot.closest<HTMLElement>('[data-lugar][data-indice]');
    const lugar = contenedor?.dataset['lugar'];
    const indice = Number(contenedor?.dataset['indice']);

    if ((lugar === 'izquierda' || lugar === 'derecha') && Number.isInteger(indice)) {
      return { lugar, indice, elemento: slot };
    }

    return null;
  }
}
