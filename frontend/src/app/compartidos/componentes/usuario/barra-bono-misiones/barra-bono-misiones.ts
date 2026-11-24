import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { SobreMarca } from '@compartidos/componentes/cartas/sobre-marca/sobre-marca';
import { ReinicioMisiones } from '@compartidos/componentes/usuario/reinicio-misiones/reinicio-misiones';
import {
  type BonoDiarioMisiones,
  mapearRecompensa,
} from '@modelos/misiones.model';

/**
 * Barra protagonista del bono diario de Misiones (nombre a aprobar).
 *
 * Renderiza sin contenedor externo:
 * - Fila superior con etiqueta del bono y el chip `app-reinicio-misiones`.
 * - Barra gruesa segmentada en `totalRequeridas` tramos con `completadas/total` adentro.
 * - Sobre `sm` pegado al final de la barra (`Premio` / `Reclamar` en `--energia` / `Reclamado`).
 */
@Component({
  selector: 'app-barra-bono-misiones',
  imports: [SobreMarca, ReinicioMisiones],
  templateUrl: './barra-bono-misiones.html',
  styleUrl: './barra-bono-misiones.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class BarraBonoMisiones {
  readonly bono = input<BonoDiarioMisiones | null>(null);
  readonly reclamando = input<boolean>(false);
  readonly proximoReinicioUtc = input<string | null>(null);
  readonly offsetRelojMs = input<number>(0);

  readonly reclamar = output<void>();
  readonly reinicioAlcanzado = output<void>();

  protected readonly disponible = computed(() => {
    const b = this.bono();
    return Boolean(b && b.disponible && !b.reclamado);
  });

  protected readonly reclamado = computed(() => Boolean(this.bono()?.reclamado));

  protected readonly progresoRatio = computed(() => {
    const b = this.bono();
    if (!b || b.totalRequeridas <= 0) return 0;
    return Math.min(1, Math.max(0, b.completadas / b.totalRequeridas));
  });

  protected readonly segmentos = computed<readonly boolean[]>(() => {
    const b = this.bono();
    if (!b) return [];
    const total = Math.max(1, b.totalRequeridas);
    const completadas = Math.min(total, Math.max(0, b.completadas));
    return Array.from({ length: total }, (_, indice) => indice < completadas);
  });

  protected readonly progresoTexto = computed(() => {
    const b = this.bono();
    return b ? `${b.completadas}/${b.totalRequeridas}` : '';
  });

  protected readonly valorAccesible = computed(() => {
    const b = this.bono();
    return b ? `${b.completadas} de ${b.totalRequeridas} misiones diarias completadas` : '';
  });

  protected readonly etiquetaSobre = computed(() => {
    if (this.reclamado()) return 'Reclamado';
    if (this.disponible()) return 'Reclamar';
    return 'Premio';
  });

  protected readonly sobre = computed(() => mapearRecompensa(this.bono()?.recompensa));

  protected readonly sobreCategoria = computed(() => {
    const s = this.sobre();
    return s?.tipo === 'categoria' ? s.categoria : null;
  });

  protected readonly sobreNombre = computed(() => {
    const s = this.sobre();
    return s?.tipo === 'marca' ? s.nombre : null;
  });

  protected readonly sobreLogo = computed(() => {
    const s = this.sobre();
    return s?.tipo === 'marca' ? s.logoUrl : null;
  });

  protected reclamarBono(): void {
    if (!this.disponible() || this.reclamando()) return;
    this.reclamar.emit();
  }
}
