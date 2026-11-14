import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TarjetaMision } from '@compartidos/componentes/usuario/tarjeta-mision/tarjeta-mision';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';
import type { Mision } from '@modelos/misiones.model';

type ModoBloque = 'jugador' | 'empresa';

interface MuestraMision {
  readonly etiqueta: string;
  readonly mision: Mision;
}

/**
 * Sección de galería de `app-tarjeta-mision`.
 *
 * Muestra los cuatro estados de la tarjeta (en curso, lista para reclamar,
 * reclamada y próximamente) tanto en modo jugador como en modo empresa.
 */
@Component({
  selector: 'app-seccion-tarjeta-mision',
  imports: [TarjetaMision, TarjetaMuestra],
  templateUrl: './seccion-tarjeta-mision.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionTarjetaMision {
  protected readonly modos: readonly ModoBloque[] = ['jugador', 'empresa'];

  protected readonly ultimoReclamo = signal<number | null>(null);

  protected readonly muestras: readonly MuestraMision[] = [
    {
      etiqueta: 'En curso',
      mision: {
        id: 1,
        titulo: 'Abrí 3 sobres esta semana',
        tipo: 'sobres_abiertos',
        periodicidad: 'semanal',
        actual: 2,
        objetivo: 3,
        estado: 'en_curso',
        recompensa: { tipo: 'generico' },
        disponible: true,
      },
    },
    {
      etiqueta: 'Lista para reclamar',
      mision: {
        id: 2,
        titulo: 'Reclamá tu sobre diario',
        tipo: 'reclamar_sobre_diario',
        periodicidad: 'diaria',
        actual: 1,
        objetivo: 1,
        estado: 'completada',
        recompensa: { tipo: 'categoria', categoria: 'gastronomia' },
        disponible: true,
      },
    },
    {
      etiqueta: 'Reclamada',
      mision: {
        id: 3,
        titulo: 'Obtené 10 cartas nuevas para tu álbum',
        tipo: 'obtener_cartas',
        periodicidad: 'permanente',
        actual: 10,
        objetivo: 10,
        estado: 'reclamada',
        recompensa: { tipo: 'generico' },
        disponible: true,
      },
    },
    {
      etiqueta: 'Próximamente (no disponible)',
      mision: {
        id: 4,
        titulo: 'Jugá 3 partidas rápidas con tus amigos',
        tipo: 'partidas_jugadas',
        periodicidad: 'diaria',
        actual: 0,
        objetivo: 3,
        estado: 'en_curso',
        recompensa: null,
        disponible: false,
      },
    },
  ];

  protected registrarReclamo(id: number): void {
    this.ultimoReclamo.set(id);
  }
}

