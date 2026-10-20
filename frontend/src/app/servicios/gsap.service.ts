import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { gsap } from 'gsap';

export type ContextoGsap = ReturnType<typeof gsap.context>;

/** Duraciones de partida declaradas como tokens `--duracion-*` en `jugador.css`. */
export type DuracionPartida = 'revelado-carta' | 'cambio-zona' | 'vuelo-carta' | 'micro';

const SEGUNDOS_POR_UNIDAD: Record<string, number> = {
  ms: 0.001,
  s: 1,
};

/**
 * Convierte un valor CSS de tiempo (`600ms`, `0.9s`) a segundos, que es la
 * unidad de GSAP. Devuelve `null` si el valor está vacío o es inválido.
 */
export function segundosDesdeDuracion(valor: string): number | null {
  const coincidencia = /^([\d.]+)(ms|s)$/.exec(valor.trim());

  if (!coincidencia) {
    return null;
  }

  const numero = Number.parseFloat(coincidencia[1]);

  return Number.isFinite(numero) ? numero * SEGUNDOS_POR_UNIDAD[coincidencia[2]] : null;
}

/**
 * Fachada única de GSAP para la aplicación.
 *
 * Concentra las dos responsabilidades que se repiten en cualquier animación:
 * exponer `prefers-reduced-motion` como signal y revertir las animaciones
 * cuando se destruye el componente que las creó.
 */
@Injectable({
  providedIn: 'root',
})
export class GsapService {
  readonly gsap = gsap;

  private readonly destroyRefRaiz = inject(DestroyRef);

  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly consultaMovimientoReducido =
    this.esNavegador && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;

  private readonly estadoMovimientoReducido = signal(
    this.consultaMovimientoReducido?.matches ?? false
  );

  /** `true` cuando el usuario pidió reducir el movimiento a nivel de sistema. */
  readonly movimientoReducido = this.estadoMovimientoReducido.asReadonly();

  constructor() {
    if (!this.consultaMovimientoReducido) {
      return;
    }

    const alCambiar = (evento: MediaQueryListEvent) =>
      this.estadoMovimientoReducido.set(evento.matches);

    this.consultaMovimientoReducido.addEventListener('change', alCambiar);
    this.destroyRefRaiz.onDestroy(() =>
      this.consultaMovimientoReducido?.removeEventListener('change', alCambiar)
    );
  }

  /**
   * Ejecuta `configurar` dentro de un contexto GSAP acotado a `elemento` y
   * revierte automáticamente todas las animaciones creadas dentro al destruirse
   * el componente consumidor.
   *
   * Si se invoca fuera del contexto de inyección (por ejemplo en `ngAfterViewInit`),
   * debe pasarse el `DestroyRef` capturado previamente como campo de clase.
   */
  crearContexto<TElement extends Element>(
    elemento: TElement,
    configurar: (ambito: TElement) => void,
    destroyRef?: DestroyRef
  ): ContextoGsap {
    const contexto = gsap.context(() => configurar(elemento), elemento);
    const refDestruccion = destroyRef ?? this.obtenerDestroyRefSeguro();
    refDestruccion?.onDestroy(() => contexto.revert());
    return contexto;
  }

  private obtenerDestroyRefSeguro(): DestroyRef | undefined {
    try {
      return inject(DestroyRef, { optional: true }) ?? undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Lee una duración de partida desde los tokens `--duracion-*` de
   * `jugador.css` (por ejemplo `--duracion-vuelo-carta: 450ms`) y la devuelve
   * en segundos, que es la unidad que espera GSAP.
   *
   * Devuelve `respaldoSegundos` cuando el token no se puede resolver: en SSR o
   * si las hojas de estilo todavía no están aplicadas.
   */
  duracionPartida(nombre: DuracionPartida, respaldoSegundos = 0.3): number {
    if (!this.esNavegador || typeof getComputedStyle !== 'function') {
      return respaldoSegundos;
    }

    const bruto = getComputedStyle(document.documentElement).getPropertyValue(
      `--duracion-${nombre}`
    );

    return segundosDesdeDuracion(bruto) ?? respaldoSegundos;
  }
}
