import { signal } from '@angular/core';
import type { Signal } from '@angular/core';

/** Una interaccion registrada por el usuario al probar un componente. */
export interface RegistroEvento {
  readonly evento: string;
  readonly momento: number;
}

export interface RegistroEventos {
  /** Los eventos mas recientes primero. */
  readonly registros: Signal<readonly RegistroEvento[]>;
  registrar: (evento: string) => void;
}

/** La galería no necesita un historial largo: alcanza con lo reciente. */
export const MAXIMO_REGISTROS = 5;

/**
 * Fábrica del registro de eventos de una seccion.
 *
 * Cada seccion la declara con un campo privado y expone `registros` y
 * `registrar` por separado. No se puede escribir
 * `protected readonly { registros, registrar } = crearRegistroEventos()`:
 * TypeScript no admite patrones de destructuring en campos de clase con
 * modificadores.
 */
export function crearRegistroEventos(): RegistroEventos {
  const registros = signal<readonly RegistroEvento[]>([]);

  return {
    registros: registros.asReadonly(),
    registrar: (evento: string): void => {
      const entrada: RegistroEvento = { evento, momento: Date.now() };
      registros.update((previos) => [entrada, ...previos].slice(0, MAXIMO_REGISTROS));
    },
  };
}