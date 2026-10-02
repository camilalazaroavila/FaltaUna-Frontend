import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import type { RegistroEvento } from '../registro-eventos';

/** Etiqueta formateada de un evento, ya relativityal al reloj actual. */
interface RegistroMostrado {
  readonly evento: string;
  readonly antiguedad: string;
  readonly clave: string;
}

/**
 * Muestra los eventos emitidos por un componente de muestra y cuanto tiempo
 * pasaron desde cada uno.
 *
 * Lleva su propio reloj para que cada seccion no tenga que compartir uno.
 */
@Component({
  selector: 'app-registro-eventos',
  templateUrl: './registro-eventos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroEventos {
  readonly registros = input.required<readonly RegistroEvento[]>();

  private readonly ahora = toSignal(interval(1000), { initialValue: Date.now() });

  protected readonly mostrados = computed<readonly RegistroMostrado[]>(() => {
    const ahora = this.ahora();

    return this.registros().map((registro) => ({
      evento: registro.evento,
      antiguedad: this.antiguedad(registro.momento, ahora),
      clave: `${registro.momento}`,
    }));
  });

  private antiguedad(momento: number, ahora: number): string {
    const segundos = Math.max(0, Math.round((ahora - momento) / 1000));

    if (segundos < 1) {
      return 'recién';
    }

    if (segundos < 60) {
      return `hace ${segundos} s`;
    }

    return `hace ${Math.round(segundos / 60)} min`;
  }
}