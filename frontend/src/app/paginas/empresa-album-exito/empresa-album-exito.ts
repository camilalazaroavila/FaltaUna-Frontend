import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Boton } from '../../compartidos/componentes/boton/boton';
import { EncabezadoPaso } from '../../compartidos/componentes/encabezado-paso/encabezado-paso';

/** Paso 5 del alta: confirmación de álbum creado. */
@Component({
  selector: 'app-empresa-album-exito',
  standalone: true,
  imports: [RouterLink, Boton, NgIcon, EncabezadoPaso],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto w-full max-w-6xl px-4 pb-16 pt-4 sm:px-8">
      <app-encabezado-paso titulo="¡Lo lograste!" [paso]="5" rutaVolver="/empresa/panel" etiquetaVolver="Ir al panel" [tituloAngosto]="false" />

      <section class="mt-16 flex flex-col items-center gap-6 text-center" aria-live="polite">
        <div class="flex size-16 items-center justify-center rounded-circulo bg-marca-primaria text-texto-sobre-oscuro">
          <ng-icon name="phosphorThumbsUpFill" class="size-9" aria-hidden="true" />
        </div>
        <h2 class="max-w-md font-titulo text-4xl uppercase leading-tight text-marca-primaria sm:text-5xl">
          Creación de álbum exitosa
        </h2>
      </section>

      <div class="mt-12 flex justify-end">
        <a app-boton routerLink="/empresa/panel" variante="secundario" tamanio="lg">
          Ir a mi perfil
          <ng-icon name="phosphorArrowRightFill" aria-hidden="true" />
        </a>
      </div>
    </main>
  `,
})
export class EmpresaAlbumExito {}