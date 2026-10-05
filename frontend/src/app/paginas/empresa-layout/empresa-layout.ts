import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../servicios/auth.service';
import { HeaderEmpresa } from '../../compartidos/componentes/header-empresa/header-empresa';

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
    <app-header-empresa (cerrarSesion)="cerrarSesion()" />
    <router-outlet />
  `,
})
export class EmpresaLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

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
