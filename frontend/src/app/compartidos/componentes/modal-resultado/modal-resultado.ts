import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type TipoModalResultado = 'exito' | 'error';

/**
 * Modal de resultado (éxito / error) con la misma tarjeta y estructura en ambos casos:
 * título, ícono, mensaje y botón de cerrar. Solo cambia el ícono y su color.
 *
 * El cierre con Escape lo resuelve la página que lo usa; acá se emite `cerrar`
 * al tocar la X o el fondo.
 */
@Component({
  selector: 'app-modal-resultado',
  standalone: true,
  templateUrl: './modal-resultado.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalResultado {
  readonly tipo = input.required<TipoModalResultado>();
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();

  readonly cerrar = output<void>();

  protected readonly esExito = computed(() => this.tipo() === 'exito');
  /** Un error se anuncia de inmediato a lectores de pantalla; el éxito es un diálogo común. */
  protected readonly rol = computed(() => (this.esExito() ? 'dialog' : 'alertdialog'));
}