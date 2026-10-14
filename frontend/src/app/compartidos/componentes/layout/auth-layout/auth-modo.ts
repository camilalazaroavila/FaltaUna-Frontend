import { Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

export type ModoAuth = 'jugador' | 'empresa';

export function esModoAuth(valor: unknown): valor is ModoAuth {
  return valor === 'jugador' || valor === 'empresa';
}

/** Debe llamarse en un contexto de inyección (constructor o inicializador de campo). */
export function injectModoAuth(): Signal<ModoAuth> {
  const ruta = inject(ActivatedRoute);
  const modoPrevio: ModoAuth =
    document.documentElement.getAttribute('data-modo') === 'empresa' ? 'empresa' : 'jugador';

  const parametro = toSignal(ruta.queryParamMap.pipe(map((p) => p.get('modo'))), {
    initialValue: ruta.snapshot.queryParamMap.get('modo'),
  });

  return computed(() => {
    const valor = parametro();
    return esModoAuth(valor) ? valor : modoPrevio;
  });
}