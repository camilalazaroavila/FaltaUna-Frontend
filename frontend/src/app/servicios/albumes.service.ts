import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  AlbumBorradorRespuesta,
  AlbumRespuesta,
  CategoriaApi,
  CrearBorradorSolicitud,
  CuponBorradorSolicitud,
  DatosBorradorAlbum,
  RarezaApi,
} from '@modelos/album.model';
import { IniciarPagoRespuesta } from '@modelos/pago.model';

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

  /** Flujo nuevo de empresa: borrador → cupón → vista previa → pago (`AlbumesEmpresaController`). */
  private readonly borradorUrl = `${environment.apiUrl}/empresa/albumes`;

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
   * Categorías de marca para el desplegable del paso 3.
   * Esta ruta NO está en ColeccionesController: confirmá en el controller
   * de categorías cuál es (probablemente `${environment.apiUrl}/Categorias`).
   */
  obtenerCategorias(): Observable<CategoriaApi[]> {
    return this.http.get<CategoriaApi[]>(`${environment.apiUrl}/Categorias`);
  }

  // ------------------------------------------------------------------
  // Flujo nuevo: el álbum nace como BORRADOR y el pago (Mercado Pago) es el último paso.
  // ------------------------------------------------------------------

  /** GET /api/empresa/albumes/rarezas: ids reales de las rarezas (Común, Rara, Épica, Legendaria). */
  obtenerRarezas(): Observable<RarezaApi[]> {
    return this.http.get<RarezaApi[]>(`${this.borradorUrl}/rarezas`);
  }

  /** GET /api/empresa/albumes/{id}: vista previa (borrador o publicado). */
  obtener(id: number): Observable<AlbumBorradorRespuesta> {
    return this.http.get<AlbumBorradorRespuesta>(`${this.borradorUrl}/${id}`);
  }

  /**
   * POST /api/empresa/albumes/borrador (multipart). Crea el álbum en estado Borrador con el plan
   * elegido en el paso 1. NO cobra nada. Los campos coinciden con `CrearBorradorAlbumSolicitud`.
   */
  crearBorrador(solicitud: CrearBorradorSolicitud): Observable<AlbumBorradorRespuesta> {
    const form = this.formularioDatos(solicitud);
    form.append('PlanId', String(solicitud.planId));
    solicitud.imagenes.forEach((imagen) => form.append('ImagenesCartas', imagen));
    // La rareza i corresponde a la imagen i (mismo orden), como exige el back.
    solicitud.rarezaIds.forEach((id) => form.append('RarezasCartas', String(id)));
    return this.http.post<AlbumBorradorRespuesta>(`${this.borradorUrl}/borrador`, form);
  }

  /** PUT /api/empresa/albumes/{id} (multipart): actualiza textos, logo y foto del borrador. */
  actualizarBorrador(id: number, datos: DatosBorradorAlbum): Observable<AlbumBorradorRespuesta> {
    return this.http.put<AlbumBorradorRespuesta>(`${this.borradorUrl}/${id}`, this.formularioDatos(datos));
  }

  /** POST /api/empresa/albumes/{id}/imagenes (multipart): suma una carta al borrador. */
  agregarImagen(id: number, imagen: File, rarezaId: number): Observable<AlbumBorradorRespuesta> {
    const form = new FormData();
    form.append('Imagen', imagen);
    form.append('RarezaId', String(rarezaId));
    return this.http.post<AlbumBorradorRespuesta>(`${this.borradorUrl}/${id}/imagenes`, form);
  }

  /** DELETE /api/empresa/albumes/{id}/imagenes/{imagenId}: saca una carta del borrador. */
  eliminarImagen(id: number, imagenId: number): Observable<AlbumBorradorRespuesta> {
    return this.http.delete<AlbumBorradorRespuesta>(`${this.borradorUrl}/${id}/imagenes/${imagenId}`);
  }

  /** PUT /api/empresa/albumes/{id}/imagenes/{imagenId}/rareza */
  cambiarRareza(id: number, imagenId: number, rarezaId: number): Observable<AlbumBorradorRespuesta> {
    return this.http.put<AlbumBorradorRespuesta>(`${this.borradorUrl}/${id}/imagenes/${imagenId}/rareza`, {
      rarezaId,
    });
  }

  /** PUT /api/empresa/albumes/{id}/cupon: crea o actualiza el cupón del álbum (uno por álbum). */
  guardarCupon(id: number, cupon: CuponBorradorSolicitud): Observable<AlbumBorradorRespuesta> {
    return this.http.put<AlbumBorradorRespuesta>(`${this.borradorUrl}/${id}/cupon`, cupon);
  }

  /**
   * POST /api/empresa/albumes/{id}/pagar: crea el pago atado al borrador y devuelve la URL de
   * Mercado Pago. Cuando MP aprueba el cobro, el back publica el álbum.
   */
  pagar(id: number): Observable<IniciarPagoRespuesta> {
    return this.http.post<IniciarPagoRespuesta>(`${this.borradorUrl}/${id}/pagar`, {});
  }

  /** Campos de texto y archivos que comparten el alta del borrador y su edición. */
  private formularioDatos(d: DatosBorradorAlbum): FormData {
    const form = new FormData();
    form.append('NombreMarca', d.nombreMarca);
    form.append('DescripcionMarca', d.descripcion);
    form.append('EmailContacto', d.emailContacto);
    form.append('RedesSociales', `${d.redSocial}: ${d.usuarioRedSocial}`);
    form.append('CategoriaId', String(d.categoriaId));
    // Con hora: el back las guarda como DateTime. El álbum dura desde el inicio del primer día
    // hasta el final del último.
    form.append('FechaInicio', `${d.fechaInicio}T00:00:00`);
    form.append('FechaFin', `${d.fechaFin}T23:59:59`);
    form.append('Logo', d.logo);
    form.append('FotoLocal', d.fotoLocal);
    return form;
  }
}