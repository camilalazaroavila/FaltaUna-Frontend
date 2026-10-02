import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';

/**
 * Cáscara de la aplicación: solo aporta el outlet del router y el toaster
 * global. La lógica de negocio de la pantalla de alta de usuario migró a
 * `paginas/registro`.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NgxSonnerToaster],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}