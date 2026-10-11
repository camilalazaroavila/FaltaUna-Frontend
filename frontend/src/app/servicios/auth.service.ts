import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService, ParametrosConsulta } from './api.service';
import {
  CrearUsuarioSolicitud,
  DisponibilidadRespuesta,
  LoginRespuesta,
  LoginSolicitud,
  Rol,
  Usuario,
  UsuarioRespuesta
} from '../modelos/usuario.model';

const CLAVE_TOKEN = 'faltauna_token';
const CLAVE_USUARIO = 'faltauna_usuario';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);

  /** Señal con el usuario logueado (null si no hay sesión). Se actualiza sola al hacer login/logout. */
  usuarioActual = signal<Usuario | null>(this.leerUsuarioGuardado());

  registrar(solicitud: CrearUsuarioSolicitud): Observable<UsuarioRespuesta> {
    return this.api.post<UsuarioRespuesta>('Usuarios', solicitud);
  }

  login(solicitud: LoginSolicitud): Observable<LoginRespuesta> {
    return this.api.post<LoginRespuesta>('Auth/login', solicitud).pipe(
      tap((respuesta) => this.guardarSesion(respuesta))
    );
  }

  logout(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuarioActual.set(null);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  estaAutenticado(): boolean {
    return !!this.obtenerToken() && !!this.usuarioActual();
  }

  obtenerRol(): Rol | null {
    return this.usuarioActual()?.rol ?? null;
  }

  /** Ruta del dashboard que le corresponde a cada rol. Usada tanto en login como en el guard de rol. */
  rutaSegunRol(rol: Rol): string {
    switch (rol) {
      case 'Admin':
        return '/admin';
      case 'Empleado':
        return '/empleado';
      case 'Empresa':
        return '/empresa';
      case 'Usuario':
      default:
        return '/usuario';
    }
  }

  private guardarSesion(respuesta: LoginRespuesta): void {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
    this.usuarioActual.set(respuesta.usuario);
  }

  private leerUsuarioGuardado(): Usuario | null {
    const crudo = localStorage.getItem(CLAVE_USUARIO);
    if (!crudo) return null;

    try {
      return JSON.parse(crudo) as Usuario;
    } catch {
      return null;
    }
  }

  verificarDisponibilidad(params: { nombreUsuario?: string; email?: string }): Observable<DisponibilidadRespuesta> {
    const consulta: ParametrosConsulta = {};
    if (params.nombreUsuario) consulta['nombreUsuario'] = params.nombreUsuario;
    if (params.email) consulta['email'] = params.email;
    return this.api.get<DisponibilidadRespuesta>('Usuarios/disponibilidad', { params: consulta });
  }
}