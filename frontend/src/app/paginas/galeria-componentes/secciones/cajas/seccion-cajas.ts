import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Caja } from '@compartidos/componentes/contenedor/caja/caja';
import type {
  PaddingCaja,
  RadioCaja,
  SombraCaja,
  VarianteCaja,
} from '@compartidos/componentes/contenedor/caja/caja';
import { Titulo } from '@compartidos/componentes/textual/titulo/titulo';
import { Subtitulo } from '@compartidos/componentes/textual/subtitulo/subtitulo';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { Sobretitulo } from '@compartidos/componentes/textual/sobretitulo/sobretitulo';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';

/** Modo de interfaz que fija cada bloque de muestra con `data-modo`. */
type ModoBloque = 'jugador' | 'empresa';

/** Contenido coherente con cada estado para la combinación de título y subtítulo. */
interface CombinacionFeedback {
  readonly variante: VarianteCaja;
  readonly titulo: string;
  readonly detalle: string;
}

/**
 * Sección de galería de `app-caja`.
 *
 * Repite el mismo set de muestras en dos bloques rotulados, uno con
 * `data-modo="jugador"` y otro con `data-modo="empresa"`, para comparar ambos
 * modos a la vez. Cada bloque fija su propio fondo y color de texto porque un
 * contenedor anidado no cambia el body.
 */
@Component({
  selector: 'app-seccion-cajas',
  imports: [Caja, Titulo, Subtitulo, Texto, Sobretitulo, TarjetaMuestra],
  templateUrl: './seccion-cajas.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionCajas {
  protected readonly modos: readonly ModoBloque[] = ['jugador', 'empresa'];

  protected readonly variantes: readonly VarianteCaja[] = [
    'base',
    'elevada',
    'hundida',
    'destacada',
    'exito',
    'error',
    'advertencia',
    'atencion',
    'info',
  ];

  protected readonly sombras: readonly SombraCaja[] = ['ninguna', 'baja', 'media', 'alta'];

  protected readonly paddings: readonly PaddingCaja[] = ['sm', 'md', 'lg'];

  protected readonly radios: readonly RadioCaja[] = ['sm', 'md', 'lg'];

  protected readonly combinaciones: readonly CombinacionFeedback[] = [
    {
      variante: 'exito',
      titulo: 'Partido confirmado',
      detalle: 'Ya están los once para el sábado a las 20 h.',
    },
    {
      variante: 'error',
      titulo: 'Cupo agotado',
      detalle: 'No quedan lugares para este horario.',
    },
    {
      variante: 'advertencia',
      titulo: 'Asistencia pendiente',
      detalle: 'Faltan confirmar dos jugadores.',
    },
    {
      variante: 'atencion',
      titulo: 'Sobre diario disponible',
      detalle: 'Abrilo antes de que se reinicie.',
    },
    {
      variante: 'info',
      titulo: 'Reglas de la cancha',
      detalle: 'Se cambia de lado al descanso.',
    },
  ];

  /** Líneas de relleno para forzar altura dentro de una caja. */
  protected readonly contenidoAlto: readonly string[] = [
    'Conviene llegar diez minutos antes para entrar en calor.',
    'Se juega con pecheras claras contra oscuras.',
    'El complejo cobra la cancha por seña al reservar.',
    'Si llueve, el partido se reprograma sin costo.',
    'Los arcos son de fútbol once, con red nueva.',
    'Hay vestuario con agua caliente incluido.',
    'La pelota la lleva el que reserva el turno.',
    'Se pide puntualidad: el horario no se estira.',
  ];
}
