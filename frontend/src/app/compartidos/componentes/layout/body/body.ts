import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { tieneNavUsuario } from '@compartidos/componentes/layout/navegacion-ola/navegacion-ola.rutas';

/**
 * Carcasa global de la aplicación.
 *
 * Publica en su host las variables CSS de reserva (--reserva-nav-lateral y --reserva-nav-inferior)
 * según la ruta activa, consumiendo la única fuente de verdad `tieneNavUsuario`.
 */
@Component({
  selector: 'app-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-con-nav]': 'tieneNav()',
  },
  template: `
    <div class="min-h-dvh w-full bg-landing-gradiente-amarillo-verde">
      <div class="min-h-dvh w-full bg-fondo-app">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './body.css',
})
export class Body {
  private readonly router = inject(Router, { optional: true });
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tieneNav = signal<boolean>(
    this.router ? tieneNavUsuario(this.router.url) : false,
  );

  constructor() {
    if (!this.router) return;

    this.tieneNav.set(tieneNavUsuario(this.router.url));

    const sub = this.router.events
      .pipe(filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd))
      .subscribe((ev) => {
        this.tieneNav.set(tieneNavUsuario(ev.urlAfterRedirects || ev.url));
        this.cdr.markForCheck();
      });

    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }
}
