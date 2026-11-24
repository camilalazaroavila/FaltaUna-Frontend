import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Header } from '@compartidos/componentes/layout/header/header';
import { TarjetaPity } from '@compartidos/componentes/usuario/tarjeta-pity/tarjeta-pity';
import { EsqueletoPity } from '@compartidos/componentes/feedback/esqueleto/esqueleto-pity';
import { Boton } from '@compartidos/componentes/controles/boton/boton';
import { MisionesService } from '@servicios/mision.services';

/**
 * Vista independiente de PT System (`/usuario/misiones/pity`): muestra los 3 contadores
 * reales de pity (General, Categoría, Marca) hacia la carta legendaria garantizada.
 */
@Component({
  selector: 'app-misiones-pity',
  imports: [TarjetaPity, EsqueletoPity, Header, RouterLink, Boton],
  templateUrl: './misiones-pity.html',
  styleUrl: './misiones-pity.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MisionesPity implements OnInit {
  private readonly servicio = inject(MisionesService);

  protected readonly cargando = this.servicio.cargandoPity;
  protected readonly error = this.servicio.errorPity;
  protected readonly pity = this.servicio.pity;

  protected readonly modalPityAbierto = signal<boolean>(false);

  /** Umbrales reales leídos del backend para el modal informativo. */
  protected readonly umbralGeneral = computed(
    () => this.servicio.pity().find((p) => p.tipo === 'GENERAL')?.umbral ?? 40,
  );
  protected readonly umbralCategoria = computed(
    () => this.servicio.pity().find((p) => p.tipo === 'CATEGORIA')?.umbral ?? 20,
  );
  protected readonly umbralMarca = computed(
    () => this.servicio.pity().find((p) => p.tipo === 'MARCA')?.umbral ?? 10,
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.servicio.cargarPity().subscribe({
      error: () => {
        // El servicio expone errorPity() para mostrar el estado en pantalla con botón de reintento.
      },
    });
  }

  protected abrirModalPity(): void {
    this.modalPityAbierto.set(true);
  }

  protected cerrarModalPity(): void {
    this.modalPityAbierto.set(false);
  }
}
