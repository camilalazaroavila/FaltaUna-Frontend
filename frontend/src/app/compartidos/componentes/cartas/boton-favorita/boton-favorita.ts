import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgIcon } from '@ng-icons/core';

/** Cantidad de partículas que estallan al marcar la carta como favorita. */
const CANTIDAD_PARTICULAS = 8;
/** Radio, en píxeles, al que viajan las partículas antes de desaparecer. */
const RADIO_PARTICULAS = 26;
const DURACION_POP_MS = 300;
const DURACION_PARTICULAS_MS = 600;

interface Particula {
  readonly id: number;
  readonly tx: string;
  readonly ty: string;
}

/**
 * Botón de "carta que quiero": corazón que late y estalla en partículas
 * cuando la carta pasa a estar marcada.
 *
 * El estado de favorita vive en la vista que lo usa (aquí solo se refleja), y
 * la animación se dispara sola al cambiar de `false` a `true`, así funciona
 * igual venga el cambio por doble click o por el modo "Marcar cartas".
 */
@Component({
  selector: 'app-boton-favorita',
  imports: [NgIcon],
  templateUrl: './boton-favorita.html',
  styleUrl: './boton-favorita.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BotonFavorita {
  readonly favorita = input(false);
  /** Nombre de la carta, solo para el `aria-label`. */
  readonly nombre = input.required<string>();

  readonly alternar = output<void>();

  /** Añade la clase `pop` al corazón para que rebote. */
  protected readonly pop = signal(false);
  /** Partículas vivas; se vacían solas al terminar el vuelo. */
  protected readonly particulas = signal<readonly Particula[]>([]);

  protected readonly etiqueta = computed(() =>
    this.favorita()
      ? `Quitar ${this.nombre()} de tus cartas deseadas`
      : `Agregar ${this.nombre()} a tus cartas deseadas`,
  );

  private anterior = false;
  private primeraLectura = true;
  private ciclo = 0;
  private activo = true;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.activo = false;
    });

    effect(() => {
      const marcada = this.favorita();

      // En la primera carga no hay animación: solo al marcar una carta nueva.
      if (this.primeraLectura) {
        this.primeraLectura = false;
        this.anterior = marcada;
        return;
      }

      const estaba = this.anterior;
      this.anterior = marcada;

      if (marcada && !estaba) {
        this.reproducir();
      }
    });
  }

  protected alAlternar(): void {
    this.alternar.emit();
  }

  private reproducir(): void {
    if (this.enMovimientoReducido()) {
      return;
    }

    const ciclo = ++this.ciclo;
    this.particulas.set(this.calcularParticulas());
    this.pop.set(true);

    setTimeout(() => {
      if (this.activo && ciclo === this.ciclo) {
        this.pop.set(false);
      }
    }, DURACION_POP_MS);

    setTimeout(() => {
      if (this.activo && ciclo === this.ciclo) {
        this.particulas.set([]);
      }
    }, DURACION_PARTICULAS_MS);
  }

  /** Las 8 direcciones, cada 45°, alrededor del corazón. */
  private calcularParticulas(): readonly Particula[] {
    return Array.from({ length: CANTIDAD_PARTICULAS }, (_, id) => {
      const angulo = (id * 360) / CANTIDAD_PARTICULAS;
      const radianes = (angulo * Math.PI) / 180;

      return {
        id,
        tx: `${(Math.cos(radianes) * RADIO_PARTICULAS).toFixed(1)}px`,
        ty: `${(Math.sin(radianes) * RADIO_PARTICULAS).toFixed(1)}px`,
      };
    });
  }

  private enMovimientoReducido(): boolean {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
