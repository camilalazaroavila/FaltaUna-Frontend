import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Carcasa global de la aplicación.
 *
 * Define el "viewport" visual común: un fondo de gradiente que ocupa todo el
 * viewport y, centrado, un marco de ancho máximo compartido por todas las
 * vistas. No contiene lógica de negocio ni conoce las rutas.
 *
 * El ancho de la aplicación se controla SOLO acá; cada vista controla
 * únicamente el ancho de su contenido interno.
 */
@Component({
  selector: 'app-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-dvh w-full bg-landing-gradiente-amarillo-verde">
      <div class="min-h-dvh w-full bg-fondo-app">
        <ng-content />
      </div>
    </div>
  `,
})
export class Body {}
