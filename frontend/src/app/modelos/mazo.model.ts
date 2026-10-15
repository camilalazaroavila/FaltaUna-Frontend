export interface CartaInventarioApi {
    readonly cartaId: number;
    readonly nombre: string;
    readonly descripcion: string | null;
    readonly poder: number;
    readonly costoMana: number;
    readonly rarezaId: number;
    readonly rareza: string;
    readonly rarezaOrden: number;
    readonly categoriaId: number;
    readonly categoria: string;
    readonly imagenUrl: string | null;
    readonly cantidad: number;
}
export interface MazoCartaApi {
    readonly cartaId: number;
    readonly nombre: string;
    readonly poder: number;
    readonly costoMana: number;
    readonly rarezaId: number;
    readonly rareza: string;
    readonly rarezaOrden: number;
    readonly imagenUrl: string | null;
}
export interface MazoApi {
    readonly id: number;
    readonly nombre: string;
    readonly completo: boolean;
    readonly cartas: readonly MazoCartaApi[];
}
export interface GuardarMazoRequest {
    readonly nombre: string;
    readonly cartasIds: readonly number[];
}
/**
 * Alias de compatibilidad para servicios/pantallas que usan los nombres del
 * contrato inicial de la API.
 */
export type CartaInventario = CartaInventarioApi;
export type MazoCarta = MazoCartaApi;
export type Mazo = MazoApi;
export type CrearMazoRequest = GuardarMazoRequest;