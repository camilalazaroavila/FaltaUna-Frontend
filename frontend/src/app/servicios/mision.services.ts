import { Injectable, computed, signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

import {
  type Mision,
  type Periodicidad,
  type ProgresoPity,
  faltantesPity,
} from '@modelos/misiones.model';

/**
 * Datos de prueba mientras el backend no expone misiones ni PT System.
 * Los métodos públicos ya devuelven `Observable` (como lo haría la versión HTTP):
 * al conectar el back solo cambia la implementación, no los componentes.
 */
const MISIONES_MOCK: readonly Mision[] = [
  { id: 1, titulo: 'Iniciá sesión', tipo: 'inicio_sesion', periodicidad: 'diaria', actual: 1, objetivo: 1, estado: 'reclamada', recompensa: { tipo: 'generico' }, disponible: true },
  { id: 2, titulo: 'Abrí 1 sobre', tipo: 'sobres_abiertos', periodicidad: 'diaria', actual: 1, objetivo: 1, estado: 'completada', recompensa: { tipo: 'generico' }, disponible: true },
  { id: 3, titulo: 'Abrí 2 sobres', tipo: 'sobres_abiertos', periodicidad: 'diaria', actual: 1, objetivo: 2, estado: 'en_curso', recompensa: { tipo: 'generico' }, disponible: true },
  { id: 4, titulo: 'Abrí 10 sobres', tipo: 'sobres_abiertos', periodicidad: 'semanal', actual: 4, objetivo: 10, estado: 'en_curso', recompensa: { tipo: 'marca', nombre: 'Grido', logoUrl: null, categoria: 'gastronomia' }, disponible: true },
  { id: 5, titulo: 'Jugá 2 partidas y reclamá tu sobre', tipo: 'partidas_jugadas', periodicidad: 'semanal', actual: 0, objetivo: 2, estado: 'en_curso', recompensa: null, disponible: false },
  { id: 6, titulo: 'Jugá 10 partidas y reclamá tu sobre', tipo: 'partidas_jugadas', periodicidad: 'permanente', actual: 0, objetivo: 10, estado: 'en_curso', recompensa: null, disponible: false },
];

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

const CLAVE_MISIONES = 'faltauna_misiones_estado';

@Injectable({ providedIn: 'root' })
export class MisionesService {
  private readonly _misiones = signal<readonly Mision[]>(this.obtenerMisionesIniciales());
  private readonly _pity = signal<readonly ProgresoPity[]>(PITY_MOCK);

  readonly misiones = this._misiones.asReadonly();
  readonly pity = this._pity.asReadonly();

  /** Filas del PT System ordenadas de la más cercana a la legendaria a la más lejana. */
  readonly pityPorCercania = computed(() =>
    [...this._pity()].sort((a, b) => faltantesPity(a) - faltantesPity(b)),
  );

  misionesDe(periodicidad: Periodicidad): readonly Mision[] {
    return this._misiones().filter((m) => m.periodicidad === periodicidad);
  }

  /** Acredita la recompensa de una misión completada. */
  reclamar(id: number): Observable<Mision> {
    const mision = this._misiones().find((m) => m.id === id);

    if (!mision) {
      return throwError(() => new Error('La misión no existe.'));
    }
    if (mision.estado !== 'completada') {
      return throwError(() => new Error('La misión todavía no se puede reclamar.'));
    }

    const reclamada: Mision = { ...mision, estado: 'reclamada' };
    this._misiones.update((lista) => {
      const nuevaLista = lista.map((m) => (m.id === id ? reclamada : m));
      // En el flujo del MVP, al reclamar la misión 2 ("Abrí 1 sobre"),
      // el usuario abre el 2do sobre y la misión 3 ("Abrí 2 sobres")
      // se completa y queda lista para reclamar.
      if (id === 2) {
        return nuevaLista.map((m) =>
          m.id === 3 ? { ...m, actual: 2, estado: 'completada' as const } : m,
        );
      }
      return nuevaLista;
    });

    this.guardarMisionesEnStorage();
    return of(reclamada);
  }

  /** Restablece las misiones a su estado inicial de prueba */
  restablecerMisiones(): void {
    this._misiones.set(MISIONES_MOCK);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(CLAVE_MISIONES);
      }
    } catch {}
  }

  private obtenerMisionesIniciales(): readonly Mision[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const guardado = localStorage.getItem(CLAVE_MISIONES);
        if (guardado) {
          const parsed = JSON.parse(guardado);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {
      // Ignorar fallos de acceso a localStorage
    }
    return MISIONES_MOCK;
  }

  private guardarMisionesEnStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(CLAVE_MISIONES, JSON.stringify(this._misiones()));
      }
    } catch {
      // Ignorar fallos de acceso a localStorage
    }
  }
}