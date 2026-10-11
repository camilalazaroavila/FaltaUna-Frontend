import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { UsuarioRespuesta } from '../modelos/usuario.model';


@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private readonly api = inject(ApiService);

  obtenerUsuarios(): Observable<UsuarioRespuesta[]> {
    return this.api.get<UsuarioRespuesta[]>('Usuarios');
  }

}
