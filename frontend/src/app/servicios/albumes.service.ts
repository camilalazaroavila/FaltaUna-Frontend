import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AlbumRespuesta, CategoriaApi, CrearAlbumSolicitud } from '../modelos/album.model';

@Injectable({ providedIn: 'root' })
export class AlbumesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /** Categorías de marca para el desplegable del paso 4. */
  obtenerCategorias(): Observable<CategoriaApi[]> {
    return this.http.get<CategoriaApi[]>(`${this.apiUrl}/Categorias`);
  }

  /**
   * Crea el álbum (colección + marca) de la empresa. `POST /api/Colecciones`, multipart/form-data.
   * Los nombres de campo coinciden con `CrearColeccionSolicitud` del backend.
   */
  crear(solicitud: CrearAlbumSolicitud): Observable<AlbumRespuesta> {
    const form = new FormData();
    form.append('ReferenciaPago', solicitud.referenciaPago);
    form.append('NombreMarca', solicitud.nombreMarca);
    form.append('DescripcionMarca', solicitud.descripcion);
    form.append('EmailContacto', solicitud.emailContacto);
    form.append('RedesSociales', `${solicitud.redSocial}: ${solicitud.usuarioRedSocial}`);
    form.append('CategoriaId', String(solicitud.categoriaId));
    form.append('FechaInicio', solicitud.fechaInicio);
    form.append('FechaFin', solicitud.fechaFin);
    form.append('Logo', solicitud.logo);
    solicitud.imagenes.forEach(imagen => form.append('ImagenesCartas', imagen));
    return this.http.post<AlbumRespuesta>(`${this.apiUrl}/Colecciones`, form);
  }
}