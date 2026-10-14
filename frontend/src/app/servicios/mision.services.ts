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

/**
 * Filas de prueba del PT System. Las marcas llevan su categoría para que el
 * filtro por categoría también las incluya (la relación categoría↔marca todavía
 * no existe en el backend: esto es dato de prueba).
 */
const PITY_MOCK: readonly ProgresoPity[] = [
  { id: 'generico', sobre: { tipo: 'generico' }, abiertos: 30, umbral: 50 },
  { id: 'cat-tecnologia', sobre: { tipo: 'categoria', categoria: 'tecnologia' }, abiertos: 3, umbral: 20 },
  { id: 'cat-cosmetica', sobre: { tipo: 'categoria', categoria: 'cosmetica' }, abiertos: 11, umbral: 20 },
  { id: 'cat-entretenimiento', sobre: { tipo: 'categoria', categoria: 'entretenimiento' }, abiertos: 6, umbral: 20 },
  { id: 'cat-gastronomia', sobre: { tipo: 'categoria', categoria: 'gastronomia' }, abiertos: 8, umbral: 20 },
  { id: 'cat-indumentaria', sobre: { tipo: 'categoria', categoria: 'indumentaria' }, abiertos: 14, umbral: 20 },
  { id: 'cat-musica', sobre: { tipo: 'categoria', categoria: 'musica' }, abiertos: 9, umbral: 10 },
  { id: 'marca-mcdonalds', sobre: { tipo: 'marca', nombre: 'McDonald\'s', logoUrl: null, categoria: 'gastronomia' }, abiertos: 2, umbral: 10 },
  { id: 'marca-grido', sobre: { tipo: 'marca', nombre: 'Grido', logoUrl: null, categoria: 'gastronomia' }, abiertos: 5, umbral: 10 },
  { id: 'marca-samsung', sobre: { tipo: 'marca', nombre: 'Samsung', logoUrl: null, categoria: 'tecnologia' }, abiertos: 7, umbral: 10 },
  { id: 'marca-natura', sobre: { tipo: 'marca', nombre: 'Natura', logoUrl: null, categoria: 'cosmetica' }, abiertos: 4, umbral: 10 },
  { id: 'marca-adidas', sobre: { tipo: 'marca', nombre: 'Adidas', logoUrl: null, categoria: 'indumentaria' }, abiertos: 1, umbral: 10 },
];

@Injectable({ providedIn: 'root' })
export class MisionesService {
  private readonly _misiones = signal<readonly Mision[]>(MISIONES_MOCK);
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
    this._misiones.update((lista) => lista.map((m) => (m.id === id ? reclamada : m)));
    return of(reclamada);
  }
}