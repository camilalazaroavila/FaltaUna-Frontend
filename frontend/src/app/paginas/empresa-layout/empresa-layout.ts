import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '@servicios/auth.service';
import { HeaderEmpresa } from '@compartidos/componentes/layout/header-empresa/header-empresa';

/**
 * Marco de todas las vistas de rol Empresa: header violeta + contenido.
 * Activa el tema claro (`data-modo="empresa"`) mientras esté montado y
 * restaura el valor anterior al salir.
 */
@Component({
  selector: 'app-empresa-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderEmpresa],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header-empresa [destinoLogo]="destinoLogo()" (cerrarSesion)="cerrarSesion()" />
    <router-outlet />
  `,
})
export class EmpresaLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((evento): evento is NavigationEnd => evento instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /**
   * Destino del logo del header. Depende SOLO de la ruta actual para ser
   * determinista: mientras la empresa esté dentro del alta (planes, pago o
   * creación del álbum) el logo queda inerte y no se puede interrumpir el
   * proceso pressándolo. Solo navega al panel estando ya en el panel o en el
   * paso final del formulario (el álbum ya existe).
   */
  protected readonly destinoLogo = computed(() => {
    const url = this.url();
    const enPanel = url.startsWith('/empresa/panel');
    const enPasoFinal = url.startsWith('/empresa/album/crear/listo');
    return enPanel || enPasoFinal ? '/empresa/panel' : null;
  });

  constructor() {
    const raiz = document.documentElement;
    const modoPrevio = raiz.getAttribute('data-modo');
    raiz.setAttribute('data-modo', 'empresa');

    inject(DestroyRef).onDestroy(() => {
      if (modoPrevio) raiz.setAttribute('data-modo', modoPrevio);
      else raiz.removeAttribute('data-modo');
    });
  }

  protected cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
