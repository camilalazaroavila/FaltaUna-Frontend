import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Titulo } from '@compartidos/componentes/textual/titulo/titulo';
import { Subtitulo } from '@compartidos/componentes/textual/subtitulo/subtitulo';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import { Sobretitulo } from '@compartidos/componentes/textual/sobretitulo/sobretitulo';
import type { TamanoTitulo } from '@compartidos/componentes/textual/titulo/titulo';
import type { TamanoSubtitulo } from '@compartidos/componentes/textual/subtitulo/subtitulo';
import type { TamanoTexto, VarianteTexto } from '@compartidos/componentes/textual/texto/texto';
import type { ColorTexto } from '@compartidos/componentes/textual/colores';
import { TarjetaMuestra } from '@paginas/galeria-componentes/tarjeta-muestra/tarjeta-muestra';

/** Modo de interfaz que fija cada bloque de muestra con `data-modo`. */
type ModoBloque = 'jugador' | 'empresa';

/**
 * Sección de galería del sistema de contenido textual.
 *
 * Repite el mismo set de muestras en dos bloques rotulados, uno con
 * `data-modo="jugador"` y otro con `data-modo="empresa"`, para comparar ambos
 * modos a la vez sin depender del selector global. Cada bloque fija su propio
 * fondo y color de texto porque un contenedor anidado no cambia el body.
 */
@Component({
  selector: 'app-seccion-texto',
  imports: [Titulo, Subtitulo, Texto, Sobretitulo, TarjetaMuestra],
  templateUrl: './seccion-texto.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionTexto {
  protected readonly modos: readonly ModoBloque[] = ['jugador', 'empresa'];

  protected readonly tamanosTitulo: readonly TamanoTitulo[] = ['display', 'lg', 'md', 'sm'];

  protected readonly tamanosSubtitulo: readonly TamanoSubtitulo[] = ['md', 'sm'];

  protected readonly tamanosTexto: readonly TamanoTexto[] = ['cuerpo', 'menor'];

  protected readonly variantesTexto: readonly VarianteTexto[] = [
    'normal',
    'secundario',
    'apagado',
    'heredar',
  ];

  protected readonly colores: readonly ColorTexto[] = [
    'heredar',
    'primario',
    'secundario',
    'apagado',
    'marca',
  ];
}
