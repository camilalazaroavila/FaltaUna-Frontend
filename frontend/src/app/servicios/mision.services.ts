import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, concatMap, from, map, of, switchMap, tap, throwError, toArray } from 'rxjs';

import {
  type Mision,
  type MisionRespuesta,
  type Periodicidad,
  type ProgresoPity,
  type ReclamarBonoRespuesta,
  type ReclamarTodasRespuesta,
  type RecompensaMisionRespuesta,
  type ResumenMisionesRespuesta,
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
  readonly status?: number;
  readonly error?: { readonly mensaje?: string; readonly message?: string };
  readonly message?: string;
};

const mensajeDeError = (error: unknown, porDefecto: string): string => {
  const posible = error as ErrorApi | null;
  if (posible?.status === 0) {
    return 'No pudimos conectarnos con el servidor. Verificá que el backend esté activo e intentá de nuevo.';
  }
  const mensaje = posible?.error?.mensaje ?? posible?.error?.message;
  if (mensaje) return mensaje;
  if (posible?.message && !posible.message.startsWith('Http failure response')) {
    return posible.message;
  }
  return porDefecto;
};

@Injectable({ providedIn: 'root' })
export class MisionesService {
  private readonly api = inject(ApiService);

  private readonly _misiones = signal<readonly Mision[]>([]);
  private readonly _pity = signal<readonly ProgresoPity[]>(PITY_MOCK);
  private readonly _resumen = signal<ResumenMisionesRespuesta | null>(null);
  private readonly _offsetRelojMs = signal<number>(0);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly misiones = this._misiones.asReadonly();
  readonly pity = this._pity.asReadonly();
  readonly resumen = this._resumen.asReadonly();
  readonly offsetRelojMs = this._offsetRelojMs.asReadonly();
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

  /**
   * Trae tiempos de reinicio y bono diario. Si el endpoint falla (404 o red),
   * deja `resumen` en `null` en silencio para ocultar barra de bono y timer.
   */
  cargarResumen(): Observable<ResumenMisionesRespuesta | null> {
    return this.api.get<ResumenMisionesRespuesta>('Misiones/resumen').pipe(
      tap((resumen) => {
        const servidorMs = Date.parse(resumen.fechaServidorUtc);
        if (Number.isFinite(servidorMs)) {
          this._offsetRelojMs.set(servidorMs - Date.now());
        }
        this._resumen.set(resumen);
      }),
      catchError(() => {
        this._resumen.set(null);
        return of(null);
      }),
    );
  }

  /** Acredita el sobre de bono diario completando las misiones requeridas. */
  reclamarBono(): Observable<ReclamarBonoRespuesta> {
    return this.api.post<ReclamarBonoRespuesta>('Misiones/bono-diario/reclamar', {}).pipe(
      tap(() => {
        this._resumen.update((actual) =>
          actual?.bonoDiario
            ? {
                ...actual,
                bonoDiario: { ...actual.bonoDiario, disponible: false, reclamado: true },
              }
            : actual,
        );
      }),
      catchError((error: unknown) =>
        throwError(() =>
          new Error(mensajeDeError(error, 'No pudimos reclamar el bono diario.')),
        ),
      ),
    );
  }

  /**
   * Reclama en secuencia las misiones indicadas y resincroniza al final.
   * Si una falla, frena la secuencia y resincroniza el estado real.
   */
  reclamarTodas(ids: readonly number[]): Observable<ReclamarTodasRespuesta> {
    // reemplazar por POST reclamar-todas cuando exista
    if (ids.length === 0) {
      return of({ sobresAcreditados: [], misionesReclamadasIds: [], bonoReclamado: false });
    }

    return from(ids).pipe(
      concatMap((id) =>
        this.reclamar(id).pipe(
          map((recompensa) => ({
            id,
            sobre: {
              sobreId: recompensa.sobreId,
              nombre: recompensa.sobre,
              cantidad: recompensa.cantidad,
            } satisfies ReclamarBonoRespuesta,
          })),
        ),
      ),
      toArray(),
      map((resultados) => ({
        sobresAcreditados: resultados.map((r) => r.sobre),
        misionesReclamadasIds: resultados.map((r) => r.id),
        bonoReclamado: false,
      })),
      switchMap((respuesta) =>
        this.cargarMisiones().pipe(
          map(() => respuesta),
          catchError(() => of(respuesta)),
        ),
      ),
      catchError((error: unknown) => {
        this.cargarMisiones().subscribe({ error: () => undefined });
        return throwError(() =>
          error instanceof Error
            ? error
            : new Error(mensajeDeError(error, 'No pudimos reclamar todas las recompensas.')),
        );
      }),
    );
  }
}
