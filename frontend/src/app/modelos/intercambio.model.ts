import type { Carta } from './carta.model';

/**
 * DTO de carta perteneciente al inventario de un coleccionista (del backend).
 */
export interface CartaColeccionistaApi {
  readonly cartaId: number;
  readonly nombre: string;
  readonly rarezaId: number;
  readonly rareza: string;
  readonly rarezaOrden: number;
  readonly categoriaId: number;
  readonly categoria: string;
  readonly imagenUrl?: string | null;
  readonly cantidad: number;
  readonly cantidadIntercambiable: number;
}

/**
 * DTO de respuesta para coleccionistas con cartas favoritas coincidentes (`GET api/Usuarios/coincidencias`).
 */
export interface CoincidenciaColeccionistaApi {
  readonly id: number;
  readonly nombreUsuario: string;
  readonly avatarUrl?: string | null;
  readonly coincidenciasFavoritas: number;
  readonly coincidenciasIntercambiables: number;
  readonly totalFavoritas: number;
  readonly porcentajeCoincidencia: number;
  readonly cartasFavoritasQueTiene: readonly CartaColeccionistaApi[];
}

/**
 * DTO de respuesta para coleccionistas con inventario (`GET api/Usuarios?incluirInventario=true`).
 */
export interface ColeccionistaInventarioApi {
  readonly id: number;
  readonly nombreUsuario: string;
  readonly fechaRegistro: string;
  readonly avatarUrl?: string | null;
  readonly cartasDistintas: number;
  readonly totalCartas: number;
  readonly cartas: readonly CartaColeccionistaApi[];
}

/**
 * Parámetros de filtro para búsqueda de coleccionistas.
 */
export interface FiltrosColeccionistas {
  readonly categoriaId?: number | null;
  readonly coleccionId?: number | null;
}

/**
 * Representa a un coleccionista potencial con el que realizar un intercambio.
 */
export interface Coleccionista {
  readonly id: number;
  readonly nombreUsuario: string;
  readonly email?: string;
  readonly avatarUrl?: string | null;
  readonly mensajeEstado?: string;
  readonly fechaRegistro?: string;
  readonly coincidenciasFavoritas?: number;
  readonly coincidenciasIntercambiables?: number;
  readonly totalFavoritas?: number;
  readonly porcentajeCoincidencia?: number;
  readonly totalCartas?: number;
  readonly cartasDistintas?: number;
  readonly cartasFavoritasQueTiene?: readonly CartaColeccionistaApi[];
}

/**
 * Representa una carta repetida del inventario del usuario (2 o más copias).
 */
export interface CartaRepetida {
  readonly carta: Carta;
  readonly cantidad: number;
}

/**
 * Estado en progreso de una selección de intercambio.
 */
export interface BorradorIntercambio {
  readonly coleccionista: Coleccionista | null;
  readonly cartaOfrecida: Carta | null;
}

/**
 * DTO para crear una oferta de intercambio en el backend (`POST api/Intercambios`).
 */
export interface CrearIntercambioSolicitud {
  readonly usuarioReceptorId: number;
  readonly cartaId: number;
}

/**
 * DTO para responder una oferta de intercambio (`POST api/Intercambios/{id}/responder`).
 */
export interface ResponderIntercambioSolicitud {
  readonly cartaId: number;
}

/**
 * DTO de carta asociada a un intercambio (backend C# `IntercambioCartaRespuesta`).
 */
export interface CartaIntercambioApi {
  readonly usuarioId: number;
  readonly cartaId: number;
  readonly nombre?: string;
  readonly cartaNombre: string;
  readonly rarezaId?: number;
  readonly cartaRarezaId: number;
  readonly rareza?: string;
  readonly cartaRareza: string;
  readonly imagenUrl?: string | null;
  readonly cartaImagenUrl?: string | null;
}

/**
 * DTO completo de intercambio activo devuelto por `GET api/Intercambios` (backend C# `IntercambioRespuesta`).
 */
export interface IntercambioActivoApi {
  readonly id: number;
  readonly estado: 'PENDIENTE' | 'EN_REVISION' | 'ACEPTADO' | 'RECHAZADO' | 'CANCELADO' | 'EXPIRADO' | string;
  readonly fechaCreacion: string;
  readonly fechaVencimiento: string;
  readonly ofertanteId?: number;
  readonly usuarioOfertanteId: number;
  readonly ofertante?: string;
  readonly usuarioOfertanteNombre: string;
  readonly receptorId?: number;
  readonly usuarioReceptorId: number;
  readonly receptor?: string;
  readonly usuarioReceptorNombre: string;
  readonly cartas: readonly CartaIntercambioApi[];
}

/**
 * DTO de respuesta para el estado de un intercambio.
 */
export interface IntercambioEstadoRespuesta {
  readonly id: number;
  readonly estado: string;
  readonly fechaCreacion: string;
  readonly fechaVencimiento: string;
  readonly fechaFinalizacion?: string | null;
}
