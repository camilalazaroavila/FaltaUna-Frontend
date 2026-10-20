import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';
import type { Carta, CategoriaCarta, RarezaCarta } from '@modelos/carta.model';
import { ApiService } from './api.service';
import type {
  CartaInventarioApi,
  GuardarMazoRequest,
  MazoApi,
} from '@modelos/mazo.model';
/**
 * Servicio de mazos del jugador.
 *
 * El backend entrega DTOs con nombres y tipos propios de la API. Este servicio
 * los adapta al modelo `Carta` que usan los componentes visuales.
 */
@Injectable({ providedIn: 'root' })
export class BarajaService {
  private readonly api = inject(ApiService);
  private mazoActual: MazoApi | null = null;
  /** Cartas que el jugador ya obtuvo y por lo tanto puede usar en su baraja. */
  obtenerCartasDisponibles(): Observable<Carta[]> {
    return this.api
      .get<CartaInventarioApi[]>('Mazos/cartas-disponibles')
      .pipe(map((cartas) => cartas.filter((carta) => carta.cantidad > 0).map(mapearCartaInventario)));
  }
  /** Devuelve el primer mazo del usuario, o `null` si todavía no creó ninguno. */
  obtenerMazoActual(): Observable<MazoApi | null> {
    return this.api.get<MazoApi[]>('Mazos').pipe(
      map((mazos) => mazos[0] ?? null),
      tap((mazo) => (this.mazoActual = mazo)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
  /** Cartas del mazo actual, vacío si el jugador todavía no creó uno. */
  obtenerBaraja(): Observable<Carta[]> {
    return this.obtenerMazoActual().pipe(
      map((mazo) => (mazo ? mazo.cartas.map(mapearCartaMazo) : [])),
    );
  }
  /** Crea o reemplaza el mazo actual y devuelve sus cartas guardadas. */
  guardarBaraja(cartas: readonly Carta[], nombre: string): Observable<Carta[]> {
    const solicitud: GuardarMazoRequest = {
      nombre: nombre.trim(),
      cartasIds: cartas.map((carta) => Number(carta.id)),
    };
    const operacion = this.mazoActual
      ? this.api.put<MazoApi>(`Mazos/${this.mazoActual.id}`, solicitud)
      : this.api.post<MazoApi>('Mazos', solicitud);
    return operacion.pipe(
      tap((mazo) => (this.mazoActual = mazo)),
      map((mazo) => mazo.cartas.map(mapearCartaMazo)),
    );
  }
}
function mapearCartaInventario(carta: CartaInventarioApi): Carta {
  return {
    id: String(carta.cartaId),
    nombre: carta.nombre,
    imagenUrl: carta.imagenUrl ?? '',
    rareza: mapearRareza(carta.rareza, carta.rarezaOrden),
    categoria: mapearCategoria(carta.categoria),
    atributoIzquierdo: carta.poder,
    atributoDerecho: carta.costoMana,
    obtenida: true,
  };
}
function mapearCartaMazo(carta: MazoApi['cartas'][number]): Carta {
  return {
    id: String(carta.cartaId),
    nombre: carta.nombre,
    imagenUrl: carta.imagenUrl ?? '',
    rareza: mapearRareza(carta.rareza, carta.rarezaOrden),
    categoria: mapearCategoria(''),
    atributoIzquierdo: carta.poder,
    atributoDerecho: carta.costoMana,
    obtenida: true,
  };
}
function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}
function mapearRareza(valor: string, orden: number): RarezaCarta {
  switch (normalizar(valor)) {
    case 'comun':
      return 'comun';
    case 'rara':
      return 'rara';
    case 'epica':
    case 'epicarta':
      return 'epicarta';
    case 'legendaria':
      return 'legendaria';
    default:
      return ({ 1: 'comun', 2: 'rara', 3: 'epicarta', 4: 'legendaria' } as const)[orden] ?? 'comun';
  }
}
function mapearCategoria(valor: string): CategoriaCarta {
  const categoria = normalizar(valor);
  const equivalencias: Record<string, CategoriaCarta> = {
    gastronomia: 'gastronomia',
    cosmeticos: 'cosmeticos',
    decoracion: 'decoracion',
    indumentaria: 'indumentaria',
    entretenimiento: 'entretenimiento',
    musica: 'musica',
    tecnologia: 'tecnologia',
  };
  return equivalencias[categoria] ?? 'gastronomia';
}