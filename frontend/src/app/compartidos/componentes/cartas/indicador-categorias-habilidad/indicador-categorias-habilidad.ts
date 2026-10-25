import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  ETIQUETA_CATEGORIA,
  type EfectoCategoriaCarta,
} from '@modelos/carta.model';
import { IconoCategoriaComponent } from '@compartidos/componentes/cartas/icono-categoria/icono-categoria.component';

/**
 * Indicador visual de categorías que mejora (+) o empeora (−) una carta o zona.
 *
 * Reutiliza los íconos existentes de categoría y los agrupa en subidas (éxito)
 * y bajadas (error). Cada ícono incluye su signo (+ / −) explícito para no
 * depender únicamente del color, y dispone de aria-label completo para
 * accesibilidad. Si se supera el límite visible, muestra un resumen "+N".
 */
@Component({
  selector: 'app-indicador-categorias-habilidad',
  standalone: true,
  templateUrl: './indicador-categorias-habilidad.html',
  styleUrl: './indicador-categorias-habilidad.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconoCategoriaComponent],
  host: {
    '[class.hidden]': '!tieneEfectos()',
    '[class.indicador--horizontal]': 'orientacion() === "horizontal"',
    '[class.indicador--vertical]': 'orientacion() === "vertical"',
    '[class.indicador--sm]': 'tamanio() === "sm"',
    '[class.indicador--md]': 'tamanio() === "md"',
  },
})
export class IndicadorCategoriasHabilidad {
  readonly efectos = input<readonly EfectoCategoriaCarta[]>([]);
  readonly maxVisibles = input(2);
  readonly orientacion = input<'vertical' | 'horizontal'>('vertical');
  readonly tamanio = input<'sm' | 'md'>('md');

  protected readonly tieneEfectos = computed(() => this.efectos().length > 0);

  protected readonly efectosVisibles = computed(() =>
    this.efectos().slice(0, this.maxVisibles()),
  );

  protected readonly cantidadOcultos = computed(() =>
    Math.max(0, this.efectos().length - this.maxVisibles()),
  );

  protected etiquetaEfecto(efecto: EfectoCategoriaCarta): string {
    const nombreCat = ETIQUETA_CATEGORIA[efecto.categoria] ?? efecto.categoria;
    const accion = efecto.tipo === 'sube' ? 'Mejora' : 'Reduce';
    const valor =
      efecto.valor !== undefined && efecto.valor !== null
        ? ` (${efecto.tipo === 'sube' ? '+' : '-'}${Math.abs(efecto.valor)})`
        : '';

    return `${accion} ${nombreCat}${valor}`;
  }

  protected signoEfecto(efecto: EfectoCategoriaCarta): string {
    return efecto.tipo === 'sube' ? '+' : '−';
  }

  protected etiquetaOcultos(): string {
    const n = this.cantidadOcultos();
    return `${n} ${n === 1 ? 'categoría más afectada' : 'categorías más afectadas'}`;
  }
}
