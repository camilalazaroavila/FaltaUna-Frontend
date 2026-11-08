import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { Body } from '@compartidos/componentes/layout/body/body';
import { NavegacionOla } from '@compartidos/componentes/layout/navegacion-ola/navegacion-ola';

/**
 * Cáscara de la aplicación: el `Body` define el marco visual global, y dentro
 * vive el outlet del router. El toaster queda fuera del marco.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxSonnerToaster, Body, NavegacionOla],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}