import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { Caja } from '@compartidos/componentes/contenedor/caja/caja';
import { Texto } from '@compartidos/componentes/textual/texto/texto';
import type { MazoApi } from '@modelos/mazo.model';
import { mapearRareza } from '@servicios/baraja.service';
import { LIMITES_BARAJA } from '@modelos/baraja.model';
import type { RarezaCarta } from '@modelos/carta.model';

export interface ResumenMazo {
  readonly mazo: MazoApi;
  readonly completo: boolean;
  readonly motivoIncompleto?: string;
  readonly conteoRarezas: Record<RarezaCarta, number>;
  readonly esBase: boolean;
}

/**
 * Componente standalone accesible para seleccionar un mazo entre hasta 20 mazos.
 *
 * Características:
 * - Filtro de búsqueda por nombre y alternancia "Solo completos".
 * - Tarjetas con badges de estado (completo vs incompleto con motivo).
 * - Desglose de rarezas por mazo usando los datos reales del contrato.
 * - Navegación accesible por teclado (flechas arriba/abajo o izq/der, Espacio o Enter).
 * - Anuncio de la selección en aria-live.
 * - Estados: cargando, vacío, sin resultados, error con reintento.
 */
@Component({
  selector: 'app-selector-mazos',
  standalone: true,
  imports: [Boton, Caja, FormsModule, RouterLink, Texto],
  templateUrl: './selector-mazos.html',
  styleUrl: './selector-mazos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectorMazos {
  readonly mazos = input<readonly MazoApi[]>([]);
  readonly mazoSeleccionadoId = input<number | null>(null);
  readonly cargando = input<boolean>(false);
  readonly error = input<string | null>(null);

  readonly mazoSeleccionadoChange = output<number>();
  readonly reintentar = output<void>();

  // Filtros
  protected readonly terminoBusqueda = signal('');
  protected readonly soloCompletos = signal(false);

  // Anuncio para lectores de pantalla
  protected readonly mensajeAriaLive = signal('');

  protected readonly resumenesMazos = computed<readonly ResumenMazo[]>(() => {
    const listado = this.mazos();
    return listado.map((mazo, indice) => {
      const cartas = mazo.cartas ?? [];
      const conteo: Record<RarezaCarta, number> = {
        comun: 0,
        rara: 0,
        epicarta: 0,
        legendaria: 0,
      };

      for (const c of cartas) {
        const rareza = mapearRareza(c.rareza, c.rarezaOrden);
        conteo[rareza] = (conteo[rareza] ?? 0) + 1;
      }

      const total = cartas.length;
      let completo = mazo.completo;
      let motivoIncompleto: string | undefined;

      if (!completo) {
        if (total !== 12) {
          motivoIncompleto = `${total}/12 cartas`;
        } else {
          // Si tiene 12 pero no respeta 5 comunes, 4 raras, 2 épicas, 1 legendaria
          const faltas: string[] = [];
          if (conteo.comun !== LIMITES_BARAJA.comun) {
            faltas.push(`${conteo.comun}/${LIMITES_BARAJA.comun} com.`);
          }
          if (conteo.rara !== LIMITES_BARAJA.rara) {
            faltas.push(`${conteo.rara}/${LIMITES_BARAJA.rara} rar.`);
          }
          if (conteo.epicarta !== LIMITES_BARAJA.epicarta) {
            faltas.push(`${conteo.epicarta}/${LIMITES_BARAJA.epicarta} épic.`);
          }
          if (conteo.legendaria !== LIMITES_BARAJA.legendaria) {
            faltas.push(`${conteo.legendaria}/${LIMITES_BARAJA.legendaria} leg.`);
          }
          motivoIncompleto = faltas.length > 0 ? faltas.join(', ') : 'Composición no reglamentaria';
        }
      }

      return {
        mazo,
        completo,
        motivoIncompleto,
        conteoRarezas: conteo,
        esBase: indice < 3,
      };
    });
  });

  protected readonly mazosFiltrados = computed(() => {
    let items = this.resumenesMazos();
    const termino = this.terminoBusqueda().trim().toLowerCase();

    if (termino) {
      items = items.filter((item) => item.mazo.nombre.toLowerCase().includes(termino));
    }

    if (this.soloCompletos()) {
      items = items.filter((item) => item.completo);
    }

    return items;
  });

  seleccionar(item: ResumenMazo): void {
    if (!item.completo) {
      this.mensajeAriaLive.set(`El mazo ${item.mazo.nombre} no se puede elegir: ${item.motivoIncompleto}`);
      return;
    }
    this.mazoSeleccionadoChange.emit(item.mazo.id);
    this.mensajeAriaLive.set(`Mazo seleccionado: ${item.mazo.nombre}`);
  }

  manejarTeclado(evento: KeyboardEvent, indiceActual: number): void {
    const items = this.mazosFiltrados();
    if (items.length === 0) return;

    let nuevoIndice = indiceActual;

    switch (evento.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        evento.preventDefault();
        nuevoIndice = (indiceActual + 1) % items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        evento.preventDefault();
        nuevoIndice = (indiceActual - 1 + items.length) % items.length;
        break;
      case 'Enter':
      case ' ':
        evento.preventDefault();
        this.seleccionar(items[indiceActual]);
        return;
      default:
        return;
    }

    // Foco en la tarjeta correspondiente
    const targetEl = document.getElementById(`tarjeta-mazo-${items[nuevoIndice].mazo.id}`);
    targetEl?.focus();
  }
}
