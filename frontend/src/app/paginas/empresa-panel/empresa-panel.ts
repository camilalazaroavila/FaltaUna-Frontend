import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { BotonNavegacionCircular } from '@compartidos/componentes/controles/boton-navegacion-circular/boton-navegacion-circular';
import urlIconoAlbum from '@svgs/Icon_Album.svg';

/** Destino del dock lateral del panel de empresa. */
interface DestinoPanel {
  readonly id: string;
  readonly nombre: string;
  readonly ruta?: string;
  readonly icono?: string;
  readonly urlIcono?: string;
  readonly deshabilitado?: boolean;
}

/**
 * Marco de las vistas internas del panel de empresa: dock de navegación a la
 * izquierda (o abajo en móvil) + `<router-outlet />`.
 *
 * El header violeta y el tema claro los aporta `EmpresaLayout`, que envuelve a
 * esta vista. El dock acompaña solo a las vistas de panel; Álbumes se muestra a
 * pantalla completa (sin aside persistido), igual que "Mis cartas" en el área
 * de usuario. Descuentos y Empleados quedan como destinos deshabilitados.
 */
@Component({
  selector: 'app-empresa-panel',
  standalone: true,
  imports: [RouterOutlet, BotonNavegacionCircular],
  templateUrl: './empresa-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmpresaPanel {
  private readonly router = inject(Router);

  protected readonly destinos: readonly DestinoPanel[] = [
    {
      id: 'estadisticas',
      nombre: 'Estadísticas',
      ruta: '/empresa/panel/estadisticas',
      icono: 'phosphorChartBarFill',
    },
    {
      id: 'albumes',
      nombre: 'Álbumes',
      ruta: '/empresa/panel/albumes',
      urlIcono: urlIconoAlbum,
    },
    {
      id: 'descuentos',
      nombre: 'Descuentos (próximamente)',
      icono: 'phosphorTagFill',
      deshabilitado: true,
    },
    {
      id: 'empleado',
      nombre: 'Empleados (próximamente)',
      icono: 'phosphorUserFill',
      deshabilitado: true,
    },
  ];

  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map((evento) => evento.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  /** El aside no se persiste en Álbumes: esa vista ocupa todo el ancho. */
  protected readonly mostrarAside = computed(() => !this.urlActual().includes('/albumes'));

  protected esActivo(destino: DestinoPanel): boolean {
    const ruta = destino.ruta;
    return ruta !== undefined && this.urlActual().startsWith(ruta);
  }

  protected seleccionar(destino: DestinoPanel): void {
    if (destino.ruta === undefined || destino.deshabilitado) {
      return;
    }
    void this.router.navigateByUrl(destino.ruta);
  }
}
