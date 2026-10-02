import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UsuarioRespuesta } from '../modelos/usuario.model';


@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private readonly apiUrl = environment.apiUrl + '/Usuarios';

  constructor(private http: HttpClient) { }

  obtenerUsuarios(): Observable<UsuarioRespuesta[]> {
    return this.http.get<UsuarioRespuesta[]>(this.apiUrl);
  }

}