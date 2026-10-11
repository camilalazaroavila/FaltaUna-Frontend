import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AlbumRespuesta, CategoriaApi, CrearAlbumSolicitud } from '../modelos/album.model';

@Injectable({ providedIn: 'root' })
export class AlbumesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  obtenerCategorias(): Observable<CategoriaApi[]> {
    return this.http.get<CategoriaApi[]>(`${this.apiUrl}/Categorias`);
  }

  crear(solicitud: CrearAlbumSolicitud): Observable<AlbumRespuesta> {
    const form = new FormData();
    form.append('referenciaPago', solicitud.referenciaPago);
    form.append('nombreMarca', solicitud.nombreMarca);
    form.append('logo', solicitud.logo);
    solicitud.imagenes.forEach((img) => form.append('imagenes', img));
    form.append('descripcion', solicitud.descripcion);
    form.append('redSocial', solicitud.redSocial);
    form.append('usuarioRedSocial', solicitud.usuarioRedSocial);
    form.append('emailContacto', solicitud.emailContacto);
    form.append('categoriaId', String(solicitud.categoriaId));
    form.append('fechaInicio', solicitud.fechaInicio);
    form.append('fechaFin', solicitud.fechaFin);
    return this.http.post<AlbumRespuesta>(`${this.apiUrl}/Colecciones`, form);
  }
}