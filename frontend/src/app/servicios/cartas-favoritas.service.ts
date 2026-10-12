import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CartaObtenidaRespuesta } from '../modelos/album-progreso';
@Injectable({providedIn: 'root',})
export class CartasFavoritasService {
  private readonly api = inject(ApiService);

  private ruta(usuarioId: number): string 
  {
    return `usuarios/${usuarioId}/cartas-favoritas`;
  }

  obtenerCartasFavoritas(usuarioId: number): Observable<CartaObtenidaRespuesta[]>
  {
    return this.api.get<CartaObtenidaRespuesta[]>(this.ruta(usuarioId));
  }

  agregarCartasFavoritas(usuarioId: number, cartaId: number): Observable<void>
  {
    return this.api.post<void>(`${usuarioId}/${cartaId}`, {});
  } 

  quitarCartasFavoritas(usuarioId: number, cartaId: number): Observable<void>
  {
    return this.api.delete<void>(`${usuarioId}/${cartaId}`);
  }
}
