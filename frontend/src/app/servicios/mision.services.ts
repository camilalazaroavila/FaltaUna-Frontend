import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';

import {
  type Mision,
  type MisionRespuesta,
  type Periodicidad,
  type ProgresoPity,
  type RecompensaMisionRespuesta,
  faltantesPity,
  mapearMision,
} from '@modelos/misiones.model';
import { ApiService } from './api.service';

import urlSobre1 from '@svgs/Paquete1.svg';
import urlSobre2 from '@svgs/Paquete2.svg';
import urlSobre3 from '@svgs/PaqueteHuh.svg';

/**
 * Filas de prueba del PT System. Las marcas llevan su categoría para que el
 * filtro por categoría también las incluya (la relación categoría↔marca todavía
 * no existe en el backend: esto es dato de prueba).
 */
const PITY_MOCK: readonly ProgresoPity[] = [
  { id: 'generico', sobre: { tipo: 'generico' }, abiertos: 30, umbral: 40, imagenSvg: urlSobre1 },
  { id: 'cat-tecnologia', sobre: { tipo: 'categoria', categoria: 'tecnologia' }, abiertos: 13, umbral: 20, imagenSvg: urlSobre2 },
  { id: 'marca-mcdonalds', sobre: { tipo: 'marca', nombre: 'McDonald\'s', logoUrl: null, categoria: 'gastronomia' }, abiertos: 3, umbral: 10, imagenSvg: urlSobre3 },
];

type ErrorApi = {
  readonly error?: { readonly mensaje?: string; readonly message?: string };
  readonly message?: string;
};

const mensajeDeError = (error: unknown, porDefecto: string): string => {
  const posible = error as ErrorApi | null;
  return posible?.error?.mensaje ?? posible?.error?.message ?? posible?.message ?? porDefecto;
};

@Injectable({ providedIn: 'root' })
export class MisionesService {
  private readonly api = inject(ApiService);

  private readonly _misiones = signal<readonly Mision[]>([]);
  private readonly _pity = signal<readonly ProgresoPity[]>(PITY_MOCK);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly misiones = this._misiones.asReadonly();
  readonly pity = this._pity.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  /** Filas del PT System ordenadas de la más cercana a la legendaria a la más lejana. */
  readonly pityPorCercania = computed(() =>
    [...this._pity()].sort((a, b) => faltantesPity(a) - faltantesPity(b)),
  );

  /** Trae las misiones reales del usuario logueado (el JWT lo agrega el interceptor). */
  cargarMisiones(): Observable<readonly Mision[]> {
    this._cargando.set(true);
    this._error.set(null);

    return this.api.get<MisionRespuesta[]>('Misiones').pipe(
      map((respuestas) => respuestas.map(mapearMision)),
      tap({
        next: (misiones) => {
          this._misiones.set(misiones);
          this._cargando.set(false);
        },
        error: (error: unknown) => {
          this._misiones.set([]);
          this._error.set(mensajeDeError(error, 'No pudimos cargar las misiones.'));
          this._cargando.set(false);
        },
      }),
      catchError((error: unknown) =>
        throwError(() => new Error(mensajeDeError(error, 'No pudimos cargar las misiones.'))),
      ),
    );
  }

  misionesDe(periodicidad: Periodicidad): readonly Mision[] {
    return this._misiones().filter((m) => m.periodicidad === periodicidad);
  }

  /** Acredita la recompensa de una misión completada. */
  reclamar(id: number): Observable<RecompensaMisionRespuesta> {
    return this.api.post<RecompensaMisionRespuesta>(`Misiones/${id}/reclamar`, {}).pipe(
      tap(() => {
        this._misiones.update((lista) =>
          lista.map((mision) =>
            mision.id === id ? { ...mision, estado: 'reclamada' as const } : mision,
          ),
        );
      }),
      catchError((error: unknown) =>
        throwError(() =>
          new Error(mensajeDeError(error, 'No pudimos reclamar la recompensa.')),
        ),
      ),
    );
  }
}
