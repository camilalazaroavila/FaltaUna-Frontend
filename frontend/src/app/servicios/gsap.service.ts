import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { gsap } from 'gsap';

export type ContextoGsap = ReturnType<typeof gsap.context>;

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

  private readonly consultaMovimientoReducido =
    isPlatformBrowser(inject(PLATFORM_ID)) && typeof window.matchMedia === 'function'
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
   * Debe invocarse dentro de un contexto de inyección (constructor,
   * inicializador de campo o hook de ciclo de vida), tipicamente en
   * `ngAfterViewInit`, cuando el elemento ya está disponible.
   */
  crearContexto<TElement extends Element>(
    elemento: TElement,
    configurar: (ambito: TElement) => void
  ): ContextoGsap {
    const contexto = gsap.context(() => configurar(elemento), elemento);
    inject(DestroyRef).onDestroy(() => contexto.revert());
    return contexto;
  }
}
