import { Routes } from '@angular/router';

/**
 * La ruta raíz todavía no tiene destino propio: la landing pública se construye
 * en `paginas/inicio` en una tanda posterior. Hasta entonces redirigimos al
 * alta de usuario migrada desde `app.html`.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'registro',
  },
  {
    path: 'registro',
    title: 'Crear usuario · Falta Una',
    loadComponent: () => import('./paginas/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'componentes',
    title: 'Galería de componentes · Falta Una',
    loadComponent: () =>
      import('./paginas/galeria-componentes/galeria-componentes').then(
        (m) => m.GaleriaComponentes,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];