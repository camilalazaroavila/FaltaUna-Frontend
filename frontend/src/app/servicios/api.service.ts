import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Parámetros de consulta aceptados por el `ApiService`.
 * Los valores `null` o `undefined` se ignoran al construir el query string.
 */
export type ParametrosConsulta = Record<string, string | number | boolean | null | undefined>;

/**
 * Opciones genéricas de una solicitud HTTP.
 *
 * Solo cubre lo que necesitan los servicios de dominio: parámetros de consulta
 * y cabeceras extra. El manejo de tokens queda en los interceptores.
 */
export interface OpcionesSolicitud {
  /** Parámetros de query string; se descartan los valores `null`/`undefined`. */
  readonly params?: ParametrosConsulta;
  /** Cabeceras adicionales a enviar con la solicitud. */
  readonly headers?: Record<string, string>;
}

/**
 * Une una URL base con una ruta relativa normalizando las barras: acepta rutas
 * con o sin `/` inicial y bases con o sin `/` final, y nunca produce doble barra.
 *
 * Función pura para poder probarla de forma aislada.
 *
 * @example
 * unirUrl('http://localhost:5142/api', '/Pagos') // 'http://localhost:5142/api/Pagos'
 * unirUrl('http://localhost:5142/api/', 'Pagos') // 'http://localhost:5142/api/Pagos'
 */
export function unirUrl(base: string, ruta: string): string {
  const baseSinBarraFinal = base.replace(/\/+$/, '');
  const rutaSinBarraInicial = ruta.replace(/^\/+/, '');
  return rutaSinBarraInicial ? `${baseSinBarraFinal}/${rutaSinBarraInicial}` : baseSinBarraFinal;
}

/**
 * Convierte un objeto simple de parámetros en `HttpParams`, ignorando los
 * valores `null` o `undefined`.
 */
function construirParams(params?: ParametrosConsulta): HttpParams | undefined {
  if (!params) {
    return undefined;
  }

  let httpParams = new HttpParams();
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === null || valor === undefined) {
      continue;
    }
    httpParams = httpParams.set(clave, String(valor));
  }
  return httpParams;
}

/**
 * Servicio base para todo consumo del backend.
 *
 * Centraliza `HttpClient` y `environment`: es el **único** lugar del front que
 * importa `environment` para armar URLs de la API. Los servicios de dominio
 * consumen este servicio con rutas relativas a `/api` (por ejemplo
 * `'Pagos/configuracion'`) y ya no inyectan `HttpClient` ni importan
 * `environment`.
 *
 * No gestiona tokens ni errores globales: eso queda en los interceptores.
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  /** URL base de la API, sin barra final. */
  readonly urlBase = environment.apiUrl.replace(/\/+$/, '');

  /** URL del hub de SignalR, para el servicio que lo consuma. */
  readonly urlHub = environment.hubUrl;

  /**
   * Realiza un `GET` tipado contra una ruta relativa a `/api`.
   */
  get<T>(ruta: string, opciones?: OpcionesSolicitud): Observable<T> {
    return this.http.get<T>(unirUrl(this.urlBase, ruta), this.armarOpciones(opciones));
  }

  /**
   * Realiza un `POST` tipado contra una ruta relativa a `/api`.
   */
  post<T>(ruta: string, cuerpo?: unknown, opciones?: OpcionesSolicitud): Observable<T> {
    return this.http.post<T>(unirUrl(this.urlBase, ruta), cuerpo ?? null, this.armarOpciones(opciones));
  }

  /**
   * Realiza un `PUT` tipado contra una ruta relativa a `/api`.
   */
  put<T>(ruta: string, cuerpo?: unknown, opciones?: OpcionesSolicitud): Observable<T> {
    return this.http.put<T>(unirUrl(this.urlBase, ruta), cuerpo ?? null, this.armarOpciones(opciones));
  }

  /**
   * Realiza un `PATCH` tipado contra una ruta relativa a `/api`.
   */
  patch<T>(ruta: string, cuerpo?: unknown, opciones?: OpcionesSolicitud): Observable<T> {
    return this.http.patch<T>(unirUrl(this.urlBase, ruta), cuerpo ?? null, this.armarOpciones(opciones));
  }

  /**
   * Realiza un `DELETE` tipado contra una ruta relativa a `/api`.
   */
  delete<T>(ruta: string, opciones?: OpcionesSolicitud): Observable<T> {
    return this.http.delete<T>(unirUrl(this.urlBase, ruta), this.armarOpciones(opciones));
  }

  /**
   * Arma el objeto de opciones de `HttpClient` a partir de las opciones del
   * dominio, omitiendo claves sin valor.
   */
  private armarOpciones(opciones?: OpcionesSolicitud): {
    params?: HttpParams;
    headers?: Record<string, string>;
  } {
    const resultado: { params?: HttpParams; headers?: Record<string, string> } = {};

    const params = construirParams(opciones?.params);
    if (params) {
      resultado.params = params;
    }
    if (opciones?.headers) {
      resultado.headers = opciones.headers;
    }

    return resultado;
  }
}
