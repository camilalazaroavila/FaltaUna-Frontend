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
import type { InfoModificadorPoder } from '@compartidos/componentes/partida/zona/zona';
import { ZonaPopupComponent } from '@compartidos/componentes/partida/zona-popup/zona-popup';
import type { Carta } from '@modelos/carta.model';
import type { NombreLugar, PorLugar, ResultadoRonda, ZonaTablero } from '@modelos/partida.model';
import { PartidaServicio } from '@servicios/servicios-partida/partida-servicio';
import { GsapService } from '@servicios/gsap.service';
import { SONIDOS_PARTIDA, SonidoService } from '@servicios/sonido.service';
import type {
  ContextoCartasLugar,
  PasoBurbuja,
  PasoSecuenciaConteo,
} from '@compartidos/componentes/partida/conteo-ronda/secuencia-conteo-ronda';
import {
  DURACION_EFECTOS_CARTAS_MS,
  ESCALONADO_BURBUJAS_MS,
  PAUSA_ENTRE_ZONAS_MS,
  construirColaPasos,
} from '@compartidos/componentes/partida/conteo-ronda/secuencia-conteo-ronda';

/** Grados del extremo del abanico que forman los reversos de la mano rival. */
const ABANICO_RIVAL_GRADOS = 12;

/** Radio magnético (px) para encajar la carta en el slot libre más cercano al soltarla desde su centro. */
const RADIO_MAGNETICO_SLOT_PX = 28;

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
  /** Emite el número de la ronda cuyo conteo secuencial acaba de finalizar por completo. */
  readonly conteoRondaTerminada = output<number>();

  protected readonly lugares: readonly NombreLugar[] = ['izquierda', 'derecha'];
  protected readonly lugarAbierto = signal<NombreLugar | null>(null);
  protected readonly cartaAbierta = signal<Carta | null>(null);

  /** Burbuja de puntaje activa en este instante del conteo. */
  readonly burbujaActiva = signal<PasoBurbuja | null>(null);
  /** Indica si la secuencia de conteo lento de ronda se encuentra en ejecución. */
  readonly enConteo = signal<boolean>(false);

  /** Puntos visuales reflejados en las barras laterales de la partida. */
  protected readonly puntosBarraPropiaVisual = signal<number>(0);
  protected readonly puntosBarraRivalVisual = signal<number>(0);
  protected readonly deltaBarraPropiaVisual = signal<number | null>(null);
  protected readonly deltaBarraRivalVisual = signal<number | null>(null);
  /** Estado de carga visual llamativa en las barras laterales. */
  protected readonly barraCargando = signal<boolean>(false);

  /** Zonas visuales mostradas en el tablero; se congelan durante el conteo hasta que todas las cartas sumen. */
  protected readonly zonasVisuales = signal<PorLugar<ZonaTablero>>({
    izquierda: this.servicio.lugares().izquierda.zona,
    derecha: this.servicio.lugares().derecha.zona,
  });

  /** Modificadores visuales de poder (+delta verde o -delta rojo) activos en cada lugar del tablero. */
  protected readonly modificadoresPorLugar = signal<
    Record<
      NombreLugar,
      {
        propio: Record<number, InfoModificadorPoder>;
        rival: Record<number, InfoModificadorPoder>;
      }
    >
  >({
    izquierda: { propio: {}, rival: {} },
    derecha: { propio: {}, rival: {} },
  });

  private deltaPropioActual: number | null = null;
  private deltaRivalActual: number | null = null;

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
      const propia = this.servicio.barraPropia();
      const rival = this.servicio.barraRival();
      const deltaPropio = this.servicio.deltaPuntosPropio();
      const deltaRival = this.servicio.deltaPuntosRival();
      const lugares = this.servicio.lugares();

      if (!this.enConteo()) {
        this.puntosBarraPropiaVisual.set(propia);
        this.puntosBarraRivalVisual.set(rival);
        this.deltaBarraPropiaVisual.set(deltaPropio);
        this.deltaBarraRivalVisual.set(deltaRival);
        this.zonasVisuales.set({
          izquierda: lugares.izquierda.zona,
          derecha: lugares.derecha.zona,
        });
      }
    });

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

    const deltaPropio = resultado.zonas.reduce(
      (acc, z) => acc + (z.puntosGanadosPropio ?? 0),
      0,
    );
    const deltaRival = resultado.zonas.reduce(
      (acc, z) => acc + (z.puntosGanadosRival ?? 0),
      0,
    );
    this.deltaPropioActual = deltaPropio > 0 ? deltaPropio : null;
    this.deltaRivalActual = deltaRival > 0 ? deltaRival : null;

    // Congelar visualmente la barra en los puntos previos a resolver esta ronda
    const puntosPreviosPropio = Math.max(0, resultado.puntosPropio - deltaPropio);
    const puntosPreviosRival = Math.max(0, resultado.puntosRival - deltaRival);
    this.puntosBarraPropiaVisual.set(puntosPreviosPropio);
    this.puntosBarraRivalVisual.set(puntosPreviosRival);
    this.deltaBarraPropiaVisual.set(null);
    this.deltaBarraRivalVisual.set(null);

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
      if (paso.tipo === 'efectos-cartas') {
        this.burbujaActiva.set(null);
        let idMod = 1;
        const nuevo: Record<
          NombreLugar,
          {
            propio: Record<number, InfoModificadorPoder>;
            rival: Record<number, InfoModificadorPoder>;
          }
        > = {
          izquierda: { propio: {}, rival: {} },
          derecha: { propio: {}, rival: {} },
        };

        let huboAumento = false;
        let huboReduccion = false;

        paso.modificaciones.forEach((m) => {
          nuevo[m.lugar][m.lado][m.indice] = {
            tipo: m.tipo,
            delta: m.delta,
            id: idMod++,
          };
          if (m.tipo === 'aumento') {
            huboAumento = true;
          } else {
            huboReduccion = true;
          }
        });

        this.modificadoresPorLugar.set(nuevo);

        if (huboAumento) {
          this.sonido.reproducir(SONIDOS_PARTIDA.powerUp);
        }
        if (huboReduccion) {
          this.sonido.reproducir(SONIDOS_PARTIDA.powerDown);
        }

        const t = setTimeout(() => {
          this.modificadoresPorLugar.set({
            izquierda: { propio: {}, rival: {} },
            derecha: { propio: {}, rival: {} },
          });
          ejecutarSiguientePaso();
        }, DURACION_EFECTOS_CARTAS_MS);
        this.temporizadoresConteo.push(t);
      } else if (paso.tipo === 'burbuja') {
        this.burbujaActiva.set(paso);
        this.sonido.reproducir(SONIDOS_PARTIDA.cartaSumaPoder);
        const t = setTimeout(() => {
          ejecutarSiguientePaso();
        }, ESCALONADO_BURBUJAS_MS);
        this.temporizadoresConteo.push(t);
      } else if (paso.tipo === 'zona') {
        this.burbujaActiva.set(null);
        // Sin sonido intermedio acá (pedido explícito del usuario)
        const t = setTimeout(() => {
          ejecutarSiguientePaso();
        }, PAUSA_ENTRE_ZONAS_MS);
        this.temporizadoresConteo.push(t);
      } else if (paso.tipo === 'cambio-zonas') {
        this.burbujaActiva.set(null);
        // El cambio de zonas ocurre después del sumado de puntos de todas las cartas
        // y antes de que se sumen los puntos totales para cada jugador.
        const lugaresActuales = this.servicio.lugares();
        this.zonasVisuales.set({
          izquierda: lugaresActuales.izquierda.zona,
          derecha: lugaresActuales.derecha.zona,
        });
        const t = setTimeout(() => {
          ejecutarSiguientePaso();
        }, PAUSA_ENTRE_ZONAS_MS + 500);
        this.temporizadoresConteo.push(t);
      } else if (paso.tipo === 'barra') {
        this.burbujaActiva.set(null);
        // Llenar la barra al final de la animación de los puntos con el nuevo sonido y aura llamativa
        this.barraCargando.set(true);
        this.puntosBarraPropiaVisual.set(paso.puntosPropio);
        this.puntosBarraRivalVisual.set(paso.puntosRival);
        this.deltaBarraPropiaVisual.set(this.deltaPropioActual);
        this.deltaBarraRivalVisual.set(this.deltaRivalActual);
        this.sonido.reproducir(SONIDOS_PARTIDA.cargarBarraPuntos);
        const t = setTimeout(() => {
          this.barraCargando.set(false);
          // Retorno sutil y más despacito de la barra antes de cerrar el conteo
          const tFin = setTimeout(() => {
            this.finalizarConteo();
          }, 850);
          this.temporizadoresConteo.push(tFin);
        }, PAUSA_ENTRE_ZONAS_MS + 800);
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
    this.barraCargando.set(false);
    const lugaresActuales = this.servicio.lugares();
    this.zonasVisuales.set({
      izquierda: lugaresActuales.izquierda.zona,
      derecha: lugaresActuales.derecha.zona,
    });
    this.puntosBarraPropiaVisual.set(this.servicio.barraPropia());
    this.puntosBarraRivalVisual.set(this.servicio.barraRival());
    this.deltaBarraPropiaVisual.set(this.servicio.deltaPuntosPropio());
    this.deltaBarraRivalVisual.set(this.servicio.deltaPuntosRival());
    this.finalizarConteo();
  }

  /** Cancela limpiamente el conteo en curso (rendición, recarga o abandono). */
  cancelarConteo(): void {
    this.limpiarTemporizadores();
    this.burbujaActiva.set(null);
    this.modificadoresPorLugar.set({
      izquierda: { propio: {}, rival: {} },
      derecha: { propio: {}, rival: {} },
    });
    this.barraCargando.set(false);
    this.enConteo.set(false);
    this.conteoCambio.emit(false);
  }

  private finalizarConteo(): void {
    this.limpiarTemporizadores();
    this.burbujaActiva.set(null);
    this.modificadoresPorLugar.set({
      izquierda: { propio: {}, rival: {} },
      derecha: { propio: {}, rival: {} },
    });
    this.barraCargando.set(false);
    this.enConteo.set(false);
    this.conteoCambio.emit(false);
    if (this.ultimoResultadoAnimado > 0) {
      this.conteoRondaTerminada.emit(this.ultimoResultadoAnimado);
    }
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
    this.sonido.reproducir(SONIDOS_PARTIDA.agarrarCarta);
  }

  protected alSeleccionar(carta: Carta | null): void {
    if (this.enConteo()) {
      return;
    }
    this.cartaSeleccionada.set(carta);
    if (carta) {
      this.sonido.reproducir(SONIDOS_PARTIDA.agarrarCarta);
    }
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
   * Devuelve el slot propio vacío que está bajo el centro de la carta (puntero),
   * o el más cercano dentro de un radio magnético corto para que soltar la carta
   * sobre el lugar encaje de forma fluida (estilo Marvel Snap).
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

        const resuelto = this.extraerDatosSlot(slot);
        if (resuelto) {
          return resuelto;
        }
      }
      return this.buscarSlotMagnetico(posicion);
    }

    const elemento = typeof document !== 'undefined' ? document.elementFromPoint(posicion.x, posicion.y) : null;
    const slot = elemento?.closest<HTMLElement>('[data-slot-lado="propio"]');

    if (!slot) {
      return this.buscarSlotMagnetico(posicion);
    }

    const estado = slot.getAttribute('data-slot-estado');
    if (estado === 'ocupado') {
      return null;
    }

    return this.extraerDatosSlot(slot);
  }

  private extraerDatosSlot(slot: HTMLElement): SlotSobrevolado | null {
    const contenedor = slot.closest<HTMLElement>('[data-lugar][data-indice]');
    const lugar = contenedor?.dataset['lugar'];
    const indice = Number(contenedor?.dataset['indice']);

    if ((lugar === 'izquierda' || lugar === 'derecha') && Number.isInteger(indice)) {
      return { lugar, indice, elemento: slot };
    }

    return null;
  }

  /**
   * Si el centro de la carta cae sobre el pequeño margen entre casillas o en el
   * borde inmediato de una casilla vacía, selecciona la más cercana dentro de
   * `RADIO_MAGNETICO_SLOT_PX`.
   */
  private buscarSlotMagnetico(posicion: PosicionArrastre): SlotSobrevolado | null {
    const candidatos = Array.from(
      this.host.querySelectorAll<HTMLElement>(
        '[data-slot-lado="propio"]:not([data-slot-estado="ocupado"])',
      ),
    );

    let mejorSlot: SlotSobrevolado | null = null;
    let menorDistancia = RADIO_MAGNETICO_SLOT_PX;

    for (const slot of candidatos) {
      const rect = slot.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        continue;
      }

      const dx = Math.max(rect.left - posicion.x, 0, posicion.x - rect.right);
      const dy = Math.max(rect.top - posicion.y, 0, posicion.y - rect.bottom);
      const distanciaBorde = Math.hypot(dx, dy);

      if (distanciaBorde <= menorDistancia) {
        const datos = this.extraerDatosSlot(slot);
        if (datos) {
          menorDistancia = distanciaBorde;
          mejorSlot = datos;
        }
      }
    }

    return mejorSlot;
  }
}
