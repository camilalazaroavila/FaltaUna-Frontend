import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CrearUsuarioSolicitud, DisponibilidadRespuesta, UsuarioRespuesta } from '../modelos/usuario.model';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private readonly apiUrl = environment.apiUrl + '/Usuarios';

  constructor(private http: HttpClient) { }

  obtenerUsuarios(): Observable<UsuarioRespuesta[]> {
    return this.http.get<UsuarioRespuesta[]>(this.apiUrl);
  }

  crearUsuario(solicitud: CrearUsuarioSolicitud): Observable<UsuarioRespuesta> {
    return this.http.post<UsuarioRespuesta>(this.apiUrl, solicitud);
  }

  verificarDisponibilidad(params: { nombreUsuario?: string; email?: string }): Observable<DisponibilidadRespuesta> {
    let consulta = new HttpParams();
    if (params.nombreUsuario) consulta = consulta.set('nombreUsuario', params.nombreUsuario);
    if (params.email) consulta = consulta.set('email', params.email);
    return this.http.get<DisponibilidadRespuesta>(`${this.apiUrl}/disponibilidad`, { params: consulta });
  }
}