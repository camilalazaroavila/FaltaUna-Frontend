import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  AbrirSobreSolicitud,
  AperturaSobreRespuesta,
  EstadoSobreDiarioRespuesta,
  SobreRespuesta,
} from '@modelos/sobre.model';
import { esCartaSinMarca, esMarcaEliminada } from '@modelos/catalogo-cartas-imagenes';

export interface SobreInventarioUsuario {
  readonly sobreId: number;
  readonly nombre: string;
  readonly tipo: string;
  readonly cantidad: number;
}

export interface SobreAbiertoUsuario {
  readonly sobreId: number;
  readonly nombre: string;
  readonly tipo: 'GENERAL' | 'CATEGORIA' | 'MARCA';
  readonly cantidadAbiertos: number;
}

export interface SobresDisponiblesEstado {
  readonly actuales: number;
  readonly maximo: number;
}

function esSobreConMarcaValida(sobre: SobreRespuesta | null | undefined): sobre is SobreRespuesta {
  if (!sobre) return false;
  if (sobre.tipo === 'MARCA') {
    const marca = sobre.marca?.trim() ?? '';
    if (!marca || esMarcaEliminada(marca)) {
      return false;
    }
  }
  if (sobre.marca && esMarcaEliminada(sobre.marca)) {
    return false;
  }
  return true;
}

function filtrarRespuestaApertura(respuesta: AperturaSobreRespuesta): AperturaSobreRespuesta {
  if (!respuesta || !Array.isArray(respuesta.cartas)) {
    return respuesta;
  }
  return {
    ...respuesta,
    cartas: respuesta.cartas.filter((carta) => !esCartaSinMarca(carta)),
  };
}

@Injectable({
  providedIn: 'root',
})
export class SobresService {
  private readonly api = inject(ApiService);

  private readonly _sobresDisponibles = signal<SobresDisponiblesEstado>({
    actuales: 0,
    maximo: 2,
  });
  readonly sobresDisponibles = this._sobresDisponibles.asReadonly();

  /** Obtiene el catálogo completo de sobres disponibles del backend */
  obtenerSobres(): Observable<SobreRespuesta[]> {
    return this.api
      .get<SobreRespuesta[]>('Sobres')
      .pipe(map((sobres) => (sobres ?? []).filter(esSobreConMarcaValida)));
  }

  /** Obtiene el estado de sobres diarios del backend */
  obtenerEstadoDiario(usuarioId: number): Observable<EstadoSobreDiarioRespuesta> {
    return this.api.get<EstadoSobreDiarioRespuesta>(`Sobres/diario/${usuarioId}`).pipe(
      tap((estado) => {
        this._sobresDisponibles.set({
          actuales: estado.cargasDisponibles,
          maximo: estado.cargasMaximas,
        });
      }),
    );
  }

  /** Actualiza el estado de sobres diarios desde el backend */
  cargarEstadoDiario(usuarioId: number): Observable<EstadoSobreDiarioRespuesta> {
    return this.obtenerEstadoDiario(usuarioId);
  }

  /** Abre un sobre específico por su ID */
  abrirSobre(sobreId: number, usuarioId: number): Observable<AperturaSobreRespuesta> {
    const cuerpo: AbrirSobreSolicitud = { usuarioId };
    return this.api
      .post<AperturaSobreRespuesta>(`Sobres/${sobreId}/abrir`, cuerpo)
      .pipe(map(filtrarRespuestaApertura));
  }

  /** Reclama y abre el sobre diario gratuito del usuario */
  reclamarSobreDiario(usuarioId: number): Observable<AperturaSobreRespuesta> {
    const cuerpo: AbrirSobreSolicitud = { usuarioId };
    return this.api.post<AperturaSobreRespuesta>('Sobres/diario', cuerpo).pipe(
      map(filtrarRespuestaApertura),
      tap(() => {
        // El estado se refrescará desde el componente tras la apertura
      }),
    );
  }

  /** Obtiene los sobres que el usuario tiene en su inventario */
  obtenerInventarioSobres(usuarioId: number): Observable<SobreInventarioUsuario[]> {
    return this.api.get<SobreInventarioUsuario[]>(`Sobres/inventario/${usuarioId}`);
  }
}
