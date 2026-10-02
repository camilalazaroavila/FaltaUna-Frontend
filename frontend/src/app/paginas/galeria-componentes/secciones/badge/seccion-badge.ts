import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Badge } from '../../../../compartidos/componentes/badge/badge';
import type {
  TamanioBadge,
  VarianteBadge,
} from '../../../../compartidos/componentes/badge/badge';
import { TarjetaMuestra } from '../../tarjeta-muestra/tarjeta-muestra';
import { RegistroEventos } from '../../registro-eventos/registro-eventos';
import { crearRegistroEventos } from '../../registro-eventos';

@Component({
  selector: 'app-seccion-badge',
  imports: [Badge, TarjetaMuestra, RegistroEventos],
  templateUrl: './seccion-badge.html',
  host: { class: 'block scroll-mt-44' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeccionBadge {
  /** El badge no emite outputs: el registro queda siempre vacío a propósito. */
  protected readonly registros = crearRegistroEventos().registros;

  protected readonly variantes: readonly VarianteBadge[] = [
    'exito',
    'advertencia',
    'error',
    'info',
    'atencion',
    'acento',
    'neutro',
  ];

  protected readonly tamanios: readonly TamanioBadge[] = ['sm', 'md'];

  /** Casos reales de uso, para leer el badge con contenido de verdad. */
  protected readonly casos = [
    { variante: 'atencion', texto: 'Nueva' },
    { variante: 'advertencia', texto: 'Repetida ×3' },
    { variante: 'neutro', texto: 'Cupón usado' },
    { variante: 'exito', texto: 'Confirmado' },
    { variante: 'error', texto: 'Cancelado' },
    { variante: 'info', texto: 'Pendiente' },
  ] as const;

  /** Escala de rareza: cada estrella usa su token. */
  protected readonly rarezas = [
    { estrellas: '★', clase: 'text-rareza-1', nombre: 'Común' },
    { estrellas: '★★', clase: 'text-rareza-2', nombre: 'Poco común' },
    { estrellas: '★★★', clase: 'text-rareza-3', nombre: 'Especial' },
    { estrellas: '★★★★', clase: 'text-rareza-4', nombre: 'Legendaria' },
  ] as const;
}