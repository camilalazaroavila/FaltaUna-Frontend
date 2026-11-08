import { Injectable, inject } from '@angular/core';
import { Observable, concatMap, from, map, of, switchMap, tap, throwError, toArray } from 'rxjs';
import { AlbumBorrador } from '@servicios/album-borrador.service';
import { AlbumesService } from '@servicios/albumes.service';
import { SuscripcionEstado } from '@servicios/suscripcion-estado.service';
import type { AlbumBorradorRespuesta, DatosBorradorAlbum, RarezaApi } from '@modelos/album.model';
import type { RarezaCarta } from '@modelos/carta.model';
import type { IniciarPagoRespuesta } from '@modelos/pago.model';

const ORDEN_RAREZAS: readonly RarezaCarta[] = ['comun', 'rara', 'epicarta', 'legendaria'];

/** Pasa el nombre de la rareza del back ("Común", "Épica"...) a la clave que usa el front. */
function claveRareza(nombre: string): RarezaCarta | null {
  const n = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  if (n.startsWith('comun')) return 'comun';
  if (n === 'rara') return 'rara';
  if (n.startsWith('epic')) return 'epicarta';
  if (n.startsWith('legend')) return 'legendaria';
  return null;
}

/** Arma { rareza del front -> id del back }. Si algún nombre no coincide, se usa el orden de la tabla. */
function mapaDeRarezas(rarezas: RarezaApi[]): Record<RarezaCarta, number> {
  const mapa: Partial<Record<RarezaCarta, number>> = {};
  rarezas.forEach((r) => {
    const clave = claveRareza(r.nombre);
    if (clave) mapa[clave] = r.id;
  });

  if (ORDEN_RAREZAS.some((clave) => mapa[clave] === undefined)) {
    [...rarezas]
      .sort((a, b) => a.orden - b.orden)
      .forEach((r, i) => {
        const clave = ORDEN_RAREZAS[i];
        if (clave && mapa[clave] === undefined) mapa[clave] = r.id;
      });
  }

  if (ORDEN_RAREZAS.some((clave) => mapa[clave] === undefined)) {
    throw new Error('No se pudieron cargar los tipos de carta. Intentá de nuevo.');
  }
  return mapa as Record<RarezaCarta, number>;
}

/**
 * Conecta el borrador del front (`AlbumBorrador`) con el back (`/api/empresa/albumes`).
 *
 * Orden del flujo de empresa:
 *   1 plan (solo se elige) → 2 marca → 3 identidad → 4 cupón → 5 vista previa → 6 pago (Mercado Pago)
 *
 *  - `guardarBorradorYCupon()` se llama al terminar el paso 4: crea el borrador (o lo actualiza si
 *    la empresa volvió atrás) y guarda el cupón.
 *  - `iniciarPago()` se llama en la vista previa al tocar "Siguiente": sincroniza las rarezas
 *    editadas y pide la URL de Mercado Pago. El cobro aprobado publica el álbum en el back.
 */
@Injectable({ providedIn: 'root' })
export class AlbumFlujo {
  private readonly albumes = inject(AlbumesService);
  private readonly borrador = inject(AlbumBorrador);
  private readonly estado = inject(SuscripcionEstado);

  /** Se pide una sola vez por sesión: las rarezas casi nunca cambian. */
  private rarezasCache: Record<RarezaCarta, number> | null = null;

  /** Pasos 2 a 4 → back. Devuelve el id del álbum borrador. */
  guardarBorradorYCupon(): Observable<number> {
    const b = this.borrador;
    const plan = this.estado.planElegido();
    const logo = b.logo();
    const fotoLocal = b.fotoLocal();

    if (!plan || !logo || !fotoLocal) {
      return throwError(() => new Error('Faltan datos de los pasos anteriores. Volvé a completarlos.'));
    }

    const datos: DatosBorradorAlbum = {
      nombreMarca: b.nombreMarca().trim(),
      descripcion: b.descripcion().trim(),
      emailContacto: b.emailContacto().trim(),
      redSocial: b.redSocial(),
      usuarioRedSocial: b.usuarioRedSocial().trim(),
      categoriaId: Number(b.categoria()),
      fechaInicio: b.fechaInicio(),
      fechaFin: b.fechaFin(),
      logo,
      fotoLocal,
    };

    // Las rarezas viajan en el mismo orden que las imágenes que se envían.
    const subidas = b.imagenes().flatMap((archivo, indice) => (archivo ? [{ archivo, indice }] : []));

    return this.obtenerMapaRarezas().pipe(
      switchMap((mapa) => {
        const idExistente = b.albumId();
        const album$ =
          idExistente === null
            ? this.albumes
                .crearBorrador({
                  ...datos,
                  planId: plan.backendId,
                  imagenes: subidas.map((s) => s.archivo),
                  rarezaIds: subidas.map((s) => mapa[b.rarezaDe(s.indice)]),
                })
                .pipe(tap((album) => this.registrarBorrador(album, subidas, mapa)))
            : this.actualizarBorrador(idExistente, datos, subidas, mapa);

        return album$.pipe(
          switchMap((album) =>
            this.albumes
              .guardarCupon(album.id, {
                nombre: b.cuponNombre().trim(),
                descripcion: b.cuponDescripcion().trim(),
                porcentajeDescuento: Number(b.cuponDescuento()),
                fechaInicio: `${b.fechaInicio()}T00:00:00`,
                fechaVencimiento: `${b.fechaFin()}T23:59:59`,
              })
              .pipe(map(() => album.id)),
          ),
        );
      }),
    );
  }

  /** Paso 5 → 6: guarda las rarezas editadas en la vista previa y crea el pago de Mercado Pago. */
  iniciarPago(): Observable<IniciarPagoRespuesta> {
    const id = this.borrador.albumId();
    if (id === null) {
      return throwError(() => new Error('Todavía no se guardó tu álbum. Volvé al paso del cupón.'));
    }

    return this.sincronizarRarezas(id).pipe(
      switchMap(() => this.albumes.pagar(id)),
      tap((respuesta) => {
        this.estado.ultimoPago.set(respuesta.pago);
        if (respuesta.pago.referenciaExterna) {
          this.estado.recordarReferencia(respuesta.pago.referenciaExterna);
        }
      }),
    );
  }

  // ------------------------------------------------------------------ privados

  private obtenerMapaRarezas(): Observable<Record<RarezaCarta, number>> {
    if (this.rarezasCache) return of(this.rarezasCache);
    return this.albumes.obtenerRarezas().pipe(
      map((lista) => mapaDeRarezas(lista)),
      tap((mapa) => (this.rarezasCache = mapa)),
    );
  }

  /** Guarda en el borrador local los ids que devolvió el back (las imágenes vienen en orden de subida). */
  private registrarBorrador(
    album: AlbumBorradorRespuesta,
    subidas: { archivo: File; indice: number }[],
    mapa: Record<RarezaCarta, number>,
  ): void {
    const b = this.borrador;
    b.albumId.set(album.id);
    this.estado.recordarAlbumBorrador(album.id);

    const ids: Record<number, number> = {};
    const rarezas: Record<number, RarezaCarta> = {};
    subidas.forEach((s, i) => {
      const imagen = album.imagenes[i];
      if (imagen) ids[s.indice] = imagen.id;
      rarezas[s.indice] = this.claveDeId(mapa, imagen?.rarezaId) ?? b.rarezaDe(s.indice);
    });
    b.imagenIdPorCasilla.set(ids);
    b.rarezaEnBack.set(rarezas);
    b.firmaImagenesEnBack.set(this.firmaImagenes(subidas));
  }

  /** La empresa volvió atrás y cambió algo: se actualiza el borrador existente en vez de crear otro. */
  private actualizarBorrador(
    id: number,
    datos: DatosBorradorAlbum,
    subidas: { archivo: File; indice: number }[],
    mapa: Record<RarezaCarta, number>,
  ): Observable<AlbumBorradorRespuesta> {
    const b = this.borrador;
    const actualizado$ = this.albumes.actualizarBorrador(id, datos);

    // Si las imágenes no cambiaron no se tocan (evita volver a subir hasta 30 archivos).
    if (this.firmaImagenes(subidas) === b.firmaImagenesEnBack()) return actualizado$;

    const viejas = Object.values(b.imagenIdPorCasilla());
    return actualizado$.pipe(
      switchMap(() => from(viejas).pipe(concatMap((imagenId) => this.albumes.eliminarImagen(id, imagenId)), toArray())),
      switchMap(() =>
        from(subidas).pipe(
          concatMap((s) => this.albumes.agregarImagen(id, s.archivo, mapa[b.rarezaDe(s.indice)])),
          toArray(),
        ),
      ),
      switchMap((respuestas) => {
        // La última respuesta trae todas las imágenes nuevas (las viejas ya se borraron).
        const album = respuestas[respuestas.length - 1];
        if (!album) return throwError(() => new Error('No se pudieron guardar las imágenes del álbum.'));
        this.registrarBorrador(album, subidas, mapa);
        return of(album);
      }),
    );
  }

  /** Envía solo las rarezas que la empresa cambió en la vista previa. */
  private sincronizarRarezas(id: number): Observable<unknown> {
    const b = this.borrador;
    return this.obtenerMapaRarezas().pipe(
      switchMap((mapa) => {
        const cambios = Object.entries(b.imagenIdPorCasilla())
          .map(([casilla, imagenId]) => ({ indice: Number(casilla), imagenId }))
          .filter(({ indice }) => b.rarezaDe(indice) !== b.rarezaEnBack()[indice]);

        if (cambios.length === 0) return of(null);

        return from(cambios).pipe(
          concatMap(({ indice, imagenId }) =>
            this.albumes.cambiarRareza(id, imagenId, mapa[b.rarezaDe(indice)]).pipe(
              tap(() => b.rarezaEnBack.update((r) => ({ ...r, [indice]: b.rarezaDe(indice) }))),
            ),
          ),
          toArray(),
        );
      }),
    );
  }

  private claveDeId(mapa: Record<RarezaCarta, number>, rarezaId: number | null | undefined): RarezaCarta | null {
    if (rarezaId == null) return null;
    return ORDEN_RAREZAS.find((clave) => mapa[clave] === rarezaId) ?? null;
  }

  private firmaImagenes(subidas: { archivo: File; indice: number }[]): string {
    return subidas
      .map((s) => `${s.indice}:${s.archivo.name}:${s.archivo.size}:${s.archivo.lastModified}`)
      .join('|');
  }
}