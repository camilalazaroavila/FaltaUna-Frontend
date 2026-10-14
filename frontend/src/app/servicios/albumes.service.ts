import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { AlbumRespuesta, CategoriaApi, CrearAlbumSolicitud } from '@modelos/album.model';

/** Forma de cada colección tal como la devuelve el backend (ColeccionRespuesta). */
interface ColeccionBackend {
  id: number;
  nombre: string;
  descripcion: string;
  marcaId: number;
  marcaNombre: string;
  marcaLogoUrl: string;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  imagenesAlbum?: AlbumRespuesta['imagenesAlbum'];
  imagenes?: AlbumRespuesta['imagenesAlbum'];
}

@Injectable({ providedIn: 'root' })
export class AlbumesService {
  private readonly http = inject(HttpClient);

  /** Base: ej. https://miapi.com/api/Colecciones */
  private readonly apiUrl = `${environment.apiUrl}/Colecciones`;

  /**
   * GET /api/Colecciones/mis-colecciones
   * Requiere rol "Empresa": la petición debe llevar el token JWT
   * (Authorization: Bearer ...), normalmente vía un HttpInterceptor.
   */
  obtenerMisAlbumes(): Observable<AlbumRespuesta[]> {
    return this.http.get<ColeccionBackend[]>(`${this.apiUrl}/mis-colecciones`).pipe(
      map((colecciones) =>
        colecciones.map(
          (c) =>
            ({
              id: c.id,
              nombre: c.nombre,
              descripcion: c.descripcion,
              marcaId: c.marcaId,
              marcaNombre: c.marcaNombre,
              marcaLogoUrl: c.marcaLogoUrl,
              fechaInicio: c.fechaInicio,
              fechaFin: c.fechaFin,
              activa: c.activa,
              imagenesAlbum: c.imagenesAlbum || c.imagenes || [],
            }) as AlbumRespuesta,
        ),
      ),
    );
  }

  /**
   * Categorías de marca para el desplegable del paso 4.
   * Esta ruta NO está en ColeccionesController: confirmá en el controller
   * de categorías cuál es (probablemente `${environment.apiUrl}/Categorias`).
   */
  obtenerCategorias(): Observable<CategoriaApi[]> {
    return this.http.get<CategoriaApi[]>(`${environment.apiUrl}/Categorias`);
  }

  /**
   * POST /api/Colecciones, multipart/form-data. Requiere rol "Empresa".
   * Los nombres de campo coinciden con `CrearColeccionSolicitud` del backend.
   */
  crear(solicitud: CrearAlbumSolicitud): Observable<AlbumRespuesta> {
    const form = new FormData();
    form.append('ReferenciaPago', solicitud.referenciaPago);
    form.append('NombreMarca', solicitud.nombreMarca);
    // El back exige NombreColeccion. Si tu formulario tiene un campo propio
    // para el nombre del álbum, usalo acá en lugar de nombreMarca.
    form.append('NombreColeccion', solicitud.nombreMarca);
    form.append('DescripcionMarca', solicitud.descripcion);
    form.append('EmailContacto', solicitud.emailContacto);
    form.append('RedesSociales', `${solicitud.redSocial}: ${solicitud.usuarioRedSocial}`);
    form.append('CategoriaId', String(solicitud.categoriaId));
    form.append('FechaInicio', solicitud.fechaInicio);
    form.append('FechaFin', solicitud.fechaFin);
    form.append('Logo', solicitud.logo);
    solicitud.imagenes.forEach((imagen) => form.append('ImagenesCartas', imagen));

    return this.http.post<AlbumRespuesta>(this.apiUrl, form);
  }
}
