import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';
import type { Carta, RarezaCarta } from '@modelos/carta.model';
import {
  categoriaCartaDesdeNombre,
  efectosDesdeHabilidad,
  normalizarUrlImagen,
} from '@modelos/carta.model';
import { FOTOS_CARTAS_CATALOGO } from '@modelos/catalogo-cartas-imagenes';
import { ApiService } from './api.service';
import type { CartaInventarioApi, GuardarMazoRequest, MazoApi } from '@modelos/mazo.model';

/**
 * Nombres temáticos para los 3 mazos de bienvenida según las cartas que contienen:
 * 1. Golden Run + Aura Urban Pack + Royal de Chocolate y Rosa -> Estilo Urbano & Gourmet
 * 2. Harmony Sound DJ Controller + Aura Weekender + Tarta Mousse -> Pulso & Ritmo DJ
 * 3. Croquembouche Imperial + Estatueta Coleccionable + Claqueta -> Festín Imperial & Cine
 */
export const NOMBRES_MAZOS_BIENVENIDA: readonly [string, string, string] = [
  'Estilo Urbano & Gourmet',
  'Pulso & Ritmo DJ',
  'Festín Imperial & Cine',
];

/**
 * Reemplaza los nombres genéricos ("Mazo de Bienvenida 1/2/3") por nombres
 * acordes a las cartas que componen cada baraja inicial. Si el usuario ya le
 * puso un nombre propio, lo respeta.
 */
export function resolverNombreMazoInicial(
  nombre: string | null | undefined,
  cartas: readonly MazoApi['cartas'][number][] = [],
  indice = 0,
): string {
  const limpio = (nombre ?? '').trim();
  const matchBienvenida = limpio.match(/^mazo\s+de\s+bienvenida\s*(\d+)?$/i);
  if (limpio && !matchBienvenida) {
    return limpio;
  }

  const nombresCartas = cartas.map((c) => normalizar(c.nombre));
  if (nombresCartas.some((n) => n.includes('golden run') || n.includes('urban pack'))) {
    return NOMBRES_MAZOS_BIENVENIDA[0];
  }
  if (nombresCartas.some((n) => n.includes('dj controller') || n.includes('retro mic'))) {
    return NOMBRES_MAZOS_BIENVENIDA[1];
  }
  if (nombresCartas.some((n) => n.includes('croquembouche') || n.includes('estatueta'))) {
    return NOMBRES_MAZOS_BIENVENIDA[2];
  }

  const numeroExplicito = matchBienvenida?.[1] ? Number(matchBienvenida[1]) - 1 : indice;
  const idx = ((numeroExplicito % 3) + 3) % 3;
  return NOMBRES_MAZOS_BIENVENIDA[idx] ?? NOMBRES_MAZOS_BIENVENIDA[0];
}

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
      .pipe(
        map((cartas) => cartas.filter((carta) => carta.cantidad > 0).map(mapearCartaInventario)),
      );
  }
  /** Lista todos los mazos guardados del jugador con nombres e imágenes normalizados. */
  obtenerMazos(): Observable<MazoApi[]> {
    return this.api.get<MazoApi[]>('Mazos').pipe(
      map((mazos) =>
        mazos.map((mazo, indice) => ({
          ...mazo,
          nombre: resolverNombreMazoInicial(mazo.nombre, mazo.cartas, indice),
          cartas: (mazo.cartas ?? []).map((carta) => ({
            ...carta,
            imagenUrl: resolverImagenCarta(carta.imagenUrl, carta.nombre),
          })),
        })),
      ),
      tap((mazos) => (this.mazoActual = mazos[0] ?? null)),
    );
  }
  /** Devuelve el primer mazo del usuario, o `null` si todavía no creó ninguno. */
  obtenerMazoActual(): Observable<MazoApi | null> {
    return this.obtenerMazos().pipe(
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
  /** Crea o reemplaza un mazo (específico o actual) y devuelve sus cartas guardadas. */
  guardarBaraja(
    cartas: readonly Carta[],
    nombre: string,
    mazoId?: number | null,
  ): Observable<Carta[]> {
    const solicitud: GuardarMazoRequest = {
      nombre: nombre.trim(),
      cartasIds: cartas.map((carta) => Number(carta.id)),
    };
    const id = mazoId !== undefined ? mazoId : this.mazoActual?.id;
    const operacion = id
      ? this.api.put<MazoApi>(`Mazos/${id}`, solicitud)
      : this.api.post<MazoApi>('Mazos', solicitud);
    return operacion.pipe(
      tap((mazo) => (this.mazoActual = mazo)),
      map((mazo) => mazo.cartas.map(mapearCartaMazo)),
    );
  }
}
export function resolverImagenCarta(imagenUrl: string | null | undefined, nombre: string): string {
  const norm = normalizarUrlImagen(imagenUrl);
  if (norm) {
    return norm;
  }
  const clave = normalizar(nombre);
  return FOTOS_CARTAS_CATALOGO[clave] ?? '';
}

function mapearCartaInventario(carta: CartaInventarioApi): Carta {
  return {
    id: String(carta.cartaId),
    nombre: carta.nombre,
    imagenUrl: resolverImagenCarta(carta.imagenUrl, carta.nombre),
    rareza: mapearRareza(carta.rareza, carta.rarezaOrden),
    categoria: categoriaCartaDesdeNombre(carta.categoria),
    atributoDerecho: carta.poder,
    atributoIzquierdo: carta.costoCupon,
    obtenida: true,
    efectosCategoria: efectosDesdeHabilidad(carta.habilidad),
  };
}
export function mapearCartaMazo(carta: MazoApi['cartas'][number]): Carta {
  return {
    id: String(carta.cartaId),
    nombre: carta.nombre,
    imagenUrl: resolverImagenCarta(carta.imagenUrl, carta.nombre),
    rareza: mapearRareza(carta.rareza, carta.rarezaOrden),
    categoria: categoriaCartaDesdeNombre(''),
    atributoDerecho: carta.poder,
    atributoIzquierdo: carta.costoCupon,
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
export function mapearRareza(valor: string, orden: number): RarezaCarta {
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