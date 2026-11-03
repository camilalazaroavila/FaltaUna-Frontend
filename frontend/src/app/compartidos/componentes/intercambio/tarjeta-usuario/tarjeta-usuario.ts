import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente reutilizable de tarjeta de usuario / coleccionista.
 *
 * Encapsula la estructura base de la tarjeta (avatar, lupa, nombre y estilos de contenedor)
 * y provee slots de proyección de contenido:
 *  - [badge]: Para insignias superiores (ej. "★ 3 deseadas")
 *  - [info]: Para textos de estado, descripciones o estadísticas bajo el nombre
 *  - [acciones]: Para botones de interacción (ej. botón "Intercambiar")
 */
@Component({
  selector: 'app-tarjeta-usuario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tarjeta-usuario.html',
  styleUrl: './tarjeta-usuario.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarjetaUsuario {
  readonly nombreUsuario = input.required<string>();
  readonly avatarUrl = input<string | null>(null);
  readonly destacado = input<boolean>(false);
  readonly seleccionado = input<boolean>(false);
  readonly mostrarBadgeLupa = input<boolean>(true);
  readonly tieneNotificacion = input<boolean>(false);
  readonly compacto = input<boolean>(false);
}
