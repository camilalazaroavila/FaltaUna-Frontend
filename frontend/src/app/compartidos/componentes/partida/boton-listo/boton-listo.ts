import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Boton } from '@compartidos/componentes/controles/boton/boton';

export type EstadoBotonListo = 'jugando' | 'esperando' | 'resolviendo';

const TEXTO: Record<EstadoBotonListo, string> = {
  jugando: 'Finalizar turno',
  esperando: 'Esperando…',
  resolviendo: 'Resolviendo…',
};

/**
 * Botón principal de cada turno. Solo interfaz: no decide cuándo se resuelve
 * el turno ni qué pasa si ambos lo aprietan (A confirmar, §10).
 */
@Component({
  selector: 'app-boton-listo',
  templateUrl: './boton-listo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Boton],
  host: { class: 'inline-block' },
})
export class BotonListo {
  readonly estado = input<EstadoBotonListo>('jugando');
  readonly listo = output<void>();

  protected readonly texto = computed(() => TEXTO[this.estado()]);
  protected readonly activo = computed(() => this.estado() === 'jugando');
  protected readonly esperando = computed(() => this.estado() === 'esperando');
  protected readonly resolviendo = computed(() => this.estado() === 'resolviendo');

  protected pulsar(): void {
    if (this.activo()) {
      this.listo.emit();
    }
  }
}