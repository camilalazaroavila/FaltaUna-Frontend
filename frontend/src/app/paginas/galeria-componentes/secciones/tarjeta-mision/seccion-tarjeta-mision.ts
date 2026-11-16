import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TarjetaMision } from '@compartidos/componentes/usuario/tarjeta-mision/tarjeta-mision';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';
import type { Mision } from '@modelos/misiones.model';

type ModoBloque = 'jugador' | 'empresa';

interface MuestraMision {
  readonly etiqueta: string;
  readonly mostrarRecompensa: boolean;
  readonly mision: Mision;
}

/**
 * Sección de galería de `app-tarjeta-mision`.
 *
 * Muestra las variantes de Diaria (sin sobre: en curso y completada) y
 * Semanal/Permanente (con sobre: en curso, lista para reclamar, reclamada y próximamente)
 * tanto en modo jugador como en modo empresa.
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
      etiqueta: 'Diaria · En curso (sin sobre)',
      mostrarRecompensa: false,
      mision: {
        id: 1,
        titulo: 'Abrí 2 sobres hoy',
        tipo: 'sobres_abiertos',
        periodicidad: 'diaria',
        actual: 1,
        objetivo: 2,
        estado: 'en_curso',
        recompensa: null,
        disponible: true,
      },
    },
    {
      etiqueta: 'Diaria · Completada (sin sobre, atenuada)',
      mostrarRecompensa: false,
      mision: {
        id: 2,
        titulo: 'Iniciá sesión en el juego',
        tipo: 'reclamar_sobre_diario',
        periodicidad: 'diaria',
        actual: 1,
        objetivo: 1,
        estado: 'completada',
        recompensa: null,
        disponible: true,
      },
    },
    {
      etiqueta: 'Semanal · En curso (con sobre)',
      mostrarRecompensa: true,
      mision: {
        id: 3,
        titulo: 'Abrí 5 sobres esta semana',
        tipo: 'sobres_abiertos',
        periodicidad: 'semanal',
        actual: 2,
        objetivo: 5,
        estado: 'en_curso',
        recompensa: { tipo: 'generico' },
        disponible: true,
      },
    },
    {
      etiqueta: 'Semanal · Lista para reclamar (--energia)',
      mostrarRecompensa: true,
      mision: {
        id: 4,
        titulo: 'Conseguí 4 cartas de Gastronomía',
        tipo: 'obtener_cartas',
        periodicidad: 'semanal',
        actual: 4,
        objetivo: 4,
        estado: 'completada',
        recompensa: { tipo: 'categoria', categoria: 'gastronomia' },
        disponible: true,
      },
    },
    {
      etiqueta: 'Permanente · Reclamada',
      mostrarRecompensa: true,
      mision: {
        id: 5,
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
      mostrarRecompensa: true,
      mision: {
        id: 6,
        titulo: 'Jugá 3 partidas rápidas con tus amigos',
        tipo: 'partidas_jugadas',
        periodicidad: 'semanal',
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
